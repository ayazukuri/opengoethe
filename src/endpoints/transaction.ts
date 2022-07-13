import { EndpointHandler } from "../interfaces";
import { transactionFromDb } from "../helper";

export const endpoint = ["/transaction", "/transaction/*"];
export const get: EndpointHandler = (context) => async (req, res) => {
    const m = req.path.match(/\/transaction\/(.*)/);
    if (!m) {
        res.status(400).redirect("/");
        return;
    }
    const transaction = transactionFromDb(await context.dbh.fetch(`
        SELECT
            CAST(id AS varchar(50)) AS id,
            CAST(\`user_id\` AS varchar(50)) AS \`user_id\`,
            \`status\`,
            \`action\`,
            \`data\`,
            friendly
        FROM
            \`transaction\`
        WHERE
            \`key\` = ?;
    `, m![1]), m![1]);
    if (!transaction || transaction.userId !== req.env.user?.id) {
        res.status(200).send(context.templates.get("transaction.pug")!({
            env: req.env,
            f: {
                found: false
            }
        }));
        return;
    }
    res.status(200).send(context.templates.get("transaction.pug")!({
        env: req.env,
        f: {
            found: true,
            status: transaction.status,
            friendlyAction: transaction.friendly ?? "This transaction has no description.",
            tKey: transaction.key
        }
    }));
};
export const post: EndpointHandler = (context) => async (req, res) => {
    const transaction = transactionFromDb(await context.dbh.fetch(`
        SELECT
            CAST(id AS varchar(50)) AS id,
            CAST(\`user_id\` AS varchar(50)) AS \`user_id\`,
            \`status\`,
            \`action\`,
            \`data\`,
            friendly
        FROM
            \`transaction\`
        WHERE
            \`key\` = ?;
    `, req.body.transactionKey), req.body.transactionKey);
    if (!transaction || transaction.userId !== req.env.user?.id) {
        res.status(404).send("Not Found");
        return;
    }
    if (transaction.status !== "pending") {
        res.status(401).send("Forbidden");
        return;
    }
    if (!req.body.approved) {
        await context.dbh.run(`
            UPDATE
                \`transaction\`
            SET
                \`status\` = 2
            WHERE
                id = CAST(? AS UNSIGNED);
        `, transaction.id);
        res.status(200).send("OK");
        return;
    }
    switch (transaction.action) {
        case "verify_email":
            if (req.env.user?.permissionLevel !== 0) {
                await context.dbh.run(`
                    UPDATE
                        \`transaction\`
                    SET
                        \`status\` = 2
                    WHERE
                        id = CAST(? AS UNSIGNED);
                `, transaction.id);
                res.status(401).send("Forbidden");
                return;
            }
            await context.dbh.interaction(async (con) => {
                await con.query(`
                    UPDATE
                        user
                    SET
                        permission_level = 1
                    WHERE
                        id = CAST(? AS UNSIGNED) AND
                        permission_level = 0;
                    
                `, transaction.userId);
                await con.query(`
                    UPDATE
                        \`transaction\`
                    SET
                        \`status\` = 1
                    WHERE
                        id = CAST(? AS UNSIGNED);
                `, transaction.id);
            });
            break;
        default:
            res.status(501).send("Not Implemented");
            return;
    }
    res.status(200).send("OK");
};
export const put: EndpointHandler = (context) => async (req, res) => {
    if (!req.env.loggedIn) {
        res.status(403).json("Unauthorized");
        return;
    }
    switch (req.body.action) {
        case "verify_email":
            if (req.env.user?.permissionLevel !== 0) {
                res.status(400).send("Bad Request");
                return;
            }
            const tKey = context.idGenerator.tKey();
            await context.dbh.run(`
                INSERT INTO
                    \`transaction\` (
                        id,
                        \`user_id\`,
                        \`key\`,
                        \`status\`,
                        \`action\`,
                        \`data\`,
                        friendly
                    )
                VALUES
                (
                    CAST(? AS UNSIGNED),
                    CAST(? AS UNSIGNED),
                    ?,
                    0,
                    0,
                    null,
                    ?
                )
            `, context.idGenerator.id(), req.env.user!.id, tKey, `Email Adresse bestätigen<br><b>${req.env.user!.email}</b>`);
            await context.emailTransporter.sendMail({
                to: req.env.user!.email,
                subject: "Registrierung bestätigen auf OpenGoethe!",
                text: `Hi ${req.env.user!.username}!\n` +
                      "Bestätige deine Registrierung bei OpenGoethe unter dem folgenden Link:\n\n" +
                      `https://${context.config.domain}/transaction/${tKey}`
            });
            break;
        default:
            res.status(501).send("Not Implemented");
            return;
    }
    res.status(200).send("OK");
};
