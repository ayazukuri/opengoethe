import { validate } from "email-validator";
import bcrypt from "bcrypt";
import { EndpointHandler } from "../interfaces";

export const endpoint = "/register";
export const get: EndpointHandler = (context) => async (req, res) => {
    if (req.env.user) {
        res.status(400).redirect("/");
        return;
    }
    res.status(200).send(context.templates.get("register.pug")!({
        env: req.env,
        f: {
            siteKey: context.config.frcSitekey
        }
    }));
};
export const post: EndpointHandler = (context) => async (req, res) => {
    const frcToken = req.header("X-Frc-Token");
    if (!frcToken) {
        res.status(403).send("Missing Authorization");
        return;
    }
    const response = await fetch("https://api.friendlycaptcha.com/api/v1/siteverify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            solution: frcToken,
            secret: context.config.frcSecret,
            sitekey: context.config.frcSitekey
        })
    });
    const data = await response.json();
    if (response.status === 200 && !data.success) {
        res.status(400).send("Bad Request");
        return;
    }
    if (!("username" in req.body && "email" in req.body && "password" in req.body)) {
        res.status(400).send("Bad Request");
        return;
    }
    const { username, email, password } = req.body;
    if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
        res.status(400).send("Bad Request");
        return;
    }
    if (username.length < 6 || username.length > 30) {
        res.status(200).json({
            "errorMessage": "Username muss zwischen 6 und 30 Zeichen lang sein"
        });
        return;
    }
    if (!/^[a-zA-Z0-9öäüÖÄÜ\.]*$/.test(username) || /\.\./.test(username)) {
        res.status(200).json({
            "errorMessage": "Username darf nur aus Buchstaben, Zahlen und einzelnen Punkten bestehen"
        });
        return;
    }
    if (!validate(email)) {
        res.status(200).json({
            "errorMessage": "Email-Adresse ist nicht gültig"
        });
        return;
    }
    if (password.length < 8) {
        res.status(200).json({
            "errorMessage": "Passwort muss mindestens 8 Zeichen lang sein"
        });
        return;
    }
    if (!/^[\x00-\x7F]*$/.test(password)) {
        res.status(200).json({
            "errorMessage": "Passwort darf nur aus ASCII-Zeichen bestehen"
        });
        return;
    }
    const c = await context.dbh.fetch(`
        SELECT
            COUNT(*) AS c
        FROM
            user
        WHERE
            email = ? OR
            username = ?;
    `, email, username);
    if (c !== 0) {
        res.status(200).json({
            "errorMessage": "Dein Username oder deine Email-Adresse wird bereits benutzt"
        });
        return;
    }
    await context.dbh.run(`
        INSERT INTO
            user (
                id,
                email,
                username,
                password_hash,
                permission_level
            )
        VALUES
            (
                CAST(? AS UNSIGNED),
                ?,
                ?,
                ?,
                0
            );
    `, context.idGenerator.id(), email, username, await bcrypt.hash(password, 10));
    res.status(200).send("OK");
};
