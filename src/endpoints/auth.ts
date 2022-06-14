import bcrypt from "bcrypt";
import crypto from "crypto";
import { EndpointHandler } from "../interfaces";

export const endpoint = "/auth";
export const handler: EndpointHandler = (context) => async (req, res) => {
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
    const row = await context.dbh.fetch("auth", {
        $email: email
    });
    if (!row) {
        res.status(200).json({
            "errorMessage": "Email is not registered"
        });
        return;
    }
    const match = await bcrypt.compare(password, row["password_hash"]);
    if (!match) {
        res.status(200).json({
            "errorMessage": "Password is incorrect"
        });
        return;
    }
    const token = crypto.randomBytes(32).toString("base64");
    res.status(200).cookie("session", token, { sameSite: "strict", secure: true }).send("OK");
    await context.dbh.run("create_session", {
        $id: context.idGenerator.id(),
        $token: token,
        $user_id: row["id"]
    });
};
