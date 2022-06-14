import markdownIt from "markdown-it";
import nodemailer from "nodemailer";
import sqlite3 from "sqlite3";
import express, { ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { compileTemplate, compileFile } from "pug";
import { readFileSync, mkdirSync, readdirSync, existsSync, writeFile } from "fs";
import { createServer } from "https";
import { IDGenerator, DBHandler } from "./classes";
import { Context, Endpoint } from "./interfaces";
import SendmailTransport from "nodemailer/lib/sendmail-transport";

function log(err: Error): void {
    const c = new Date();
    const date = c.toLocaleDateString("DE") + " " + c.toLocaleTimeString("DE");
    writeFile("./logs" + c.getTime() + ".log", `${date}\n${err.stack}`, () => { });
}

async function main() {
    const config = JSON.parse(readFileSync("./config.json").toString("utf-8"));
    const md = markdownIt({
        breaks: true
    });
    const idg = new IDGenerator();
    const htmlTransporter = nodemailer.createTransport(<SendmailTransport.Options> ({
        sendmail: true,
        newline: "unix",
        path: "sendmail"
    }), {
        from: config.emailOut
    });
    const templates: Map<string, compileTemplate> = new Map();

    // DATABASE / FILESYSTEM

    sqlite3.verbose();
    const db = new sqlite3.Database(config.sqliteFile);
    const dbh = new DBHandler(db);
    db.exec(readFileSync("./scheme.sql").toString("utf-8"));
    if (!existsSync("./logs")) mkdirSync("./logs");
    if (!existsSync("./resource")) mkdirSync("./resource");

    const context: Context = {
        md,
        idGenerator: idg,
        emailTransporter: htmlTransporter,
        dbh,
        templates,
        config
    };

    // EXPRESS

    const app = express();

    // PRE-PROCESING OF REQUESTS

    app.use(express.json());
    app.use(cookieParser());
    app.use((req, res, next) => {
        req.env = {
            loggedIn: false
        };
        req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
    });
    app.use(async (req, res, next) => {
        if ("session" in req.cookies) {
            const token = req.cookies.session;
            const user = await dbh.user("session", token);
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
    app.use(<ErrorRequestHandler> ((err, req, res, next) => {
        log(err);
        res.status(500).send("Internal Server Error");
    }));
    app.use("/static", express.static("./static"));
    app.use("/resource", express.static("./resource"));

    // PUG TEMPLATING

    const ver = JSON.parse(readFileSync("./package.json").toString("utf-8"));
    const indexTemplater = compileFile("./src/pug/index.pug");
    for (const file of readdirSync("./src/pug/templates")) {
        if (!file.endsWith(".pug")) continue;

        // Save complete template.
        const pugFn = compileFile("./src/pug/templates/" + file);
        const template: compileTemplate = (locals) => indexTemplater({
            page: pugFn(locals),
            ver: ver.version
        });
        templates.set(file, template);
    }

    // ENDPOINTS

    for (const file of readdirSync("./dist/endpoints")) {
        if (!file.endsWith(".js")) continue;

        const imp: Endpoint = await import(__dirname + "/endpoints/" + file);
        app.get(imp.endpoint, async (req, res) => {
            if (imp.permissionLevel) {
                if (!req.env.loggedIn) {
                    res.status(401).redirect("https://" + req.headers.host + "/login");
                    return;
                }
                if (imp.permissionLevel > req.env.user!.permissionLevel) {
                    res.status(403).redirect("https://" + req.headers.host + "/?rejected=1");
                    return;
                }
            }
            await imp.handler(context)(req, res);
        });
    }

    const credentials = {
        cert: readFileSync("./ssl/cert.pem"),
        key: readFileSync("./ssl/key.pem")
    };

    const httpsServer = createServer(credentials, app);
    app.listen(80, () => {
        console.log("Listening on 80 for HTTP.");
    });
    httpsServer.listen(443, () => {
        console.log("Listening on 443 for HTTPS.");
    });
}

main();


