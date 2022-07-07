import { validate } from "email-validator";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { EndpointHandler, Transaction } from "../interfaces";

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
            "errorMessage": "Username must be between 6 and 30 characters long"
        });
        return;
    }
    if (!/^[a-zA-Z0-9öäüÖÄÜ\.]*$/.test(username) || /\.\./.test(username)) {
        res.status(200).json({
            "errorMessage": "Username must only include letters, numbers and single periods"
        });
        return;
    }
    if (!validate(email)) {
        res.status(200).json({
            "errorMessage": "Email is not valid"
        });
        return;
    }
    if (password.length <= 8) {
        res.status(200).json({
            "errorMessage": "Password must be at least 8 characters long"
        });
        return;
    }
    if (!/^[\x00-\x7F]*$/.test(password)) {
        res.status(200).json({
            "errorMessage": "Password must not contain non-ASCII characters"
        });
        return;
    }
    if ((await context.dbh.fetch("user_exists", {
        $email: email,
        $username: username
    })).c !== 0) {
        res.status(200).json({
            "errorMessage": "Your email or username is already in use"
        });
        return;
    }
    const tKey = crypto.randomBytes(32).toString("base64")
        .replaceAll(/\+/g, ".")
        .replaceAll(/\//g, "_")
        .replaceAll(/=/g, "-");
    const regTrans: Transaction = {
        id: context.idGenerator.id(),
        key: tKey,
        friendlyAction: "Registrierung bestätigen für:<br><b>" + username + "</b>",
        issued: new Date(),
        action: async () => context.dbh.run("register_user", {
            $id: context.idGenerator.id(),
            $email: email,
            $username: username,
            $passwordHash: await bcrypt.hash(password, 10)
        })
    };
    context.transactions.set(tKey, regTrans);
    context.emailTransporter.sendMail({
        to: email,
        subject: "Registrierung bestätigen auf OpenGoethe!",
        text: "Hallo " + username + "!\nBestätige deine Registrierung bei OpenGoethe unter dem folgenden Link: https://" + context.config.domain + "/transaction/" + tKey
    });
    res.status(200).send("OK");
};
