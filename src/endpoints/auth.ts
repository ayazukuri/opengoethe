import bcrypt from "bcrypt";
import crypto from "crypto";
import { EndpointHandler } from "../interfaces";

export const endpoint = "/auth";
export const get: EndpointHandler = (context) => async (req, res) => {
    const auth = req.header("Authorization");
    if (!auth) {
        res.status(403).send("Missing Authorization");
        return;
    }
    if (auth.split(" ")[0] !== "Basic") {
        res.status(400).send("Bad Request");
        return;
    }
    const b64 = auth.split(" ").slice(1).join(" ");
    // As per authorization header spec:
    // <username (email)>:<password> base64 encoded
    // (password starts after first colon).
    const colsep = Buffer.from(b64, "base64").toString().split(":");
    const email = colsep[0];
    const password = colsep.slice(1).join(":");
    const row = await context.dbh.fetch(`
        SELECT
            CAST(id AS varchar(50)) AS id,
            password_hash
        FROM
            user
        WHERE
            email = ?;
    `, email);
    if (!row) {
        res.status(200).json({
            "errorMessage": "Email ist nicht registriert"
        });
        return;
    }
    const match = await bcrypt.compare(password, row["password_hash"]);
    if (!match) {
        res.status(200).json({
            "errorMessage": "Passwort ist nicht korrekt"
        });
        return;
    }
    const token = crypto.randomBytes(32).toString("base64");
    res.status(200).cookie("session", token, { sameSite: "strict", secure: true }).send("OK");
    await context.dbh.run(`
        INSERT INTO
            \`session\` (
                id,
                token,
                \`user_id\`,
                expiry
            )
        VALUES
            (
                CAST(? AS UNSIGNED),
                ?,
                CAST(? AS UNSIGNED),
                FROM_UNIXTIME(UNIX_TIMESTAMP() + 604800)
            );
    `, context.idGenerator.id(), token, row.id);
};
