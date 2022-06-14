import { validate } from "email-validator";
import { EndpointHandler } from "../interfaces";

export const endpoint = "/login";
export const handler: EndpointHandler = (context) => async (req, res) => {
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
    if (!("email" in req.body && "password" in req.body)) {
        res.status(400).send("Bad Request");
        return;
    }
    const { email, password } = req.body;
    if (!(typeof email === "string" && typeof password === "string")) {
        res.status(400).send("Bad Request");
        return;
    }
    if (!validate(email)) {
        res.status(400).json({
            "errorMessage": "Email is not valid"
        });
        return;
    }
    if (password.length <= 8) {
        res.status(400).json({
            "errorMessage": "Password must be at least 8 characters"
        });
        return;
    }
    if (!/^[\x00-\x7F]*$/.test(password)) {
        res.status(400).json({
            "errorMessage": "Password must not contain non-ASCII characters"
        });
        return;
    }
    // Rest of register process TODO
};
