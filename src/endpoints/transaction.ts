import { EndpointHandler } from "../interfaces";
import { transactionFromDb } from "../helper";
import { handlers } from "../transactions";

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
    if (!(transaction.action in handlers)) {
        res.status(500).send("Internal Server Error");
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
    try {
        await handlers[transaction.action].handle(context)(transaction, req.env.user);
        await context.dbh.run(`
            UPDATE
                \`transaction\`
            SET
                \`status\` = 1
            WHERE
                id = CAST(? AS UNSIGNED);
        `, transaction.id);
        res.status(200).send("OK");
    } catch (e) {
        res.status(400).send("Bad Request");
    }
};

export const put: EndpointHandler = (context) => async (req, res) => {
    if (!req.env.user) {
        res.status(403).json("Unauthorized");
        return;
    }
    if (!(req.body.action in handlers)) {
        res.status(501).send("Not Implemented");
        return;
    }
    try {
        const tKey = context.idGenerator.tKey();
        const opts = await handlers[req.body.action].instantiate(context)(tKey, req.env.user);
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
                    ?,
                    0,
                    null,
                    ?
                );
        `,
        context.idGenerator.id(),
        req.env.user.id,
        tKey,
        handlers[req.body.action].action,
        opts.friendly
        );
        await context.emailTransporter.sendMail(opts.email);
        res.status(200).send("OK");
    } catch (e) {
        res.status(400).send("Bad Request");
    }
};
