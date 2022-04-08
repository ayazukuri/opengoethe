import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
    writeFile,
    readFileSync,
    readdirSync,
    existsSync,
    mkdirSync
} from "fs";
import { createServer } from "https";

import express from "express";
import cookieParser from "cookie-parser";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import pug from "pug";
import crypto from "crypto";
import markdownIt from "markdown-it";
import nodemailer from "nodemailer";

import Cache from "./classes/Cache.js";
import IDGenerator from "./classes/IDGenerator.js";


/**
 * Logs an error to a file.
 * @param {Error} err
 */
function log(err) {
    const c = new Date();
    const date = c.toLocaleDateString("DE") + " " + c.toLocaleTimeString("DE");
    writeFile(join(__dirname, "../logs", c.getTime() + ".log"), `${date}\n${err.stack}`, () => { });
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const md = markdownIt({
    breaks: true
});
const idg = new IDGenerator();
const htmlTransporter = nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "sendmail"
}, {
    from: "noreply@informatik-goethe.de"
});

// DB / FILESYSTEM SETUP

sqlite3.verbose();
const db = new sqlite3.Database("ifg.db");
const cache = new Cache(db);
db.exec(readFileSync(join(__dirname, "scheme.sql")).toString("utf-8"));
setInterval(cache.purge.bind(cache), 10000);
setInterval(cache.run.bind(cache, "purge_sessions"), 3600000);
if (!existsSync(join(__dirname, "../logs"))) mkdirSync(join(__dirname, "../logs"));
if (!existsSync(join(__dirname, "../resource"))) mkdirSync(join(__dirname, "../resource"));

const app = express();

// MIDDLEWARES & STATIC FILESYSTEM

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
});
app.use(async (req, res, next) => {
    req.env = {};
    if ("session" in req.cookies) {
        const token = req.cookies["session"];
        const user = await cache.user("session", token);
        if (user) {
            req.env.loggedIn = true;
            req.env.user = user;
        } else {
            req.env.loggedIn = false;
            res.cookie("session", "", { maxAge: 0 });
        }
    }
    next();
});
app.use((err, req, res, next) => {
    log(err);
    res.status(500).send("Internal Server Error");
});
app.use("/static", express.static(join(__dirname, "../static")));
app.use("/resource", express.static(join(__dirname, "../resource")));

// LOADING PUG TEMPLATES

const templates = new Map();
const ver = JSON.parse(readFileSync(join(__dirname, "../package.json").toString("utf-8")));
const indexPugFn = pug.compileFile(join(__dirname, "pug/index.pug"));
for (const file of readdirSync(join(__dirname, "pug/sites"))) {
    if (!file.endsWith(".pug")) continue;

    // Save complete template.
    const pugFn = pug.compileFile(join(__dirname, "pug/sites", file));
    const templateFn = locals => indexPugFn({ page: pugFn(locals), ver: ver.version });
    templates.set(file, templateFn);

    // Run define stage.
    const def = new Map();
    pugFn({ define: def.set.bind(def) });

    // Handle automated serving.
    if (!def.has("endpoint")) continue;
    app.get(def.get("endpoint"), async (req, res) => {
        if (def.has("permissionLevel")) {
            // Site requires user to be authorized.
            if (!req.env.loggedIn) {
                res.status(401).redirect(`https://${req.headers.host}/login`);
                return;
            }
            if (def.get("permissionLevel") > req.env.user.permissionLevel) {
                res.status(403).redirect(`https://${req.headers.host}/?rejected=1`);
                return;
            }
        }

        // Run fetch stage.
        let fetches = [];
        pugFn({ fetch: fetches.push.bind(fetches), req });
        fetches = fetches.map(({ identifier, passAs, optional, params, all }) => {
            let f;
            if (all) {
                f = cache.all(identifier, params);
            } else {
                f = cache.fetch(identifier, params);
            }
            return f.then(r => {
                if (!r && !optional) {
                    throw new Error("Error fetching resource!");
                }
                return [r, passAs];
            });
        });
        let results;
        try {
            results = await Promise.all(fetches);
        } catch (e) {
            // TODO make 404 page!
            res.status(404).redirect(`https://${req.headers.host}`);
            return;
        }
        const fetchPass = {};
        results.forEach(([row, passAs]) => fetchPass[passAs] = row);

        // Send templated file to client.
        res.status(200).send(templateFn({ env: req.env, f: fetchPass, md }));
    });
}

// ENDPOINTS

app.get("/", (req, res) => res.redirect(`https://${req.headers.host}/page/main`));

app.get("/auth", async (req, res) => {
    let auth = req.header("authorization");
    const recaptchaToken = req.header("x-captcha-token");
    if ([auth, recaptchaToken].includes(undefined)) {
        res.status(403).send("Authorization Required");
        return;
    }
    auth = auth.split(" ");
    if (auth[0] !== "Basic") {
        res.status(403).send("Authorization Required");
        return;
    }
    auth.shift();
    auth = auth.join(" ");
    // As per authorization header spec:
    // <username (email)>:<password> base64 encoded
    // (password starts after first colon).
    const colsep = Buffer.from(auth, "base64").toString().split(":");
    const email = colsep[0];
    const password = colsep.slice(1).join(":");
    const row = await cache.fetch("auth", {
        $email: email
    });
    if (!row) {
        res.status(200).json({
            "error": 100,
            "errorMessage": "Email is not registered"
        });
        return;
    }
    const match = await bcrypt.compare(password, row["password_hash"]);
    if (!match) {
        res.status(200).json({
            "error": 101,
            "errorMessage": "Password is incorrect"
        });
        return;
    }
    const token = crypto.randomBytes(32).toString("base64");
    // Potentially leads to invalid session
    // if insert goes wrong.
    res.status(200).cookie("session", token, { sameSite: "strict", secure: true }).send("OK");
    await cache.run("create_session", {
        $id: idg.id(),
        $token: token,
        $user_id: row["id"]
    });
});

/*
app.put("/user", (req, res) => {
    
});
*/

const credentials = {
    cert: readFileSync(join(__dirname, "../ssl/cert.pem")),
    key: readFileSync(join(__dirname, "../ssl/key.pem"))
};

const httpsServer = createServer(credentials, app);
app.listen(80, () => {
    console.log("Listening on 80 for HTTP.");
});
httpsServer.listen(443, () => {
    console.log("Server listening on port 443.");
});
