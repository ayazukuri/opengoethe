const express = require("express");
const cookieParser = require("cookie-parser");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const pug = require("pug");
const crypto = require("crypto");
const { join } = require("path");
const fs = require("fs");
const https = require("https");
const Cache = require("./classes/Cache");

/**
 * Logs an error to a file.
 * @param {Error} err
 */
function log(err) {
    const c = new Date();
    const date = c.toLocaleDateString("DE") + " " + c.toLocaleTimeString("DE");
    fs.writeFile(join(__dirname, "../logs", c.getTime() + ".log"), `${date}\n${err.stack}`, () => {});
}

// DB / FILESYSTEM SETUP

const db = new sqlite3.Database("ifg.db");
db.exec(fs.readFileSync(join(__dirname, "scheme.sql")).toString("utf-8"));
const cache = new Cache(db);
setInterval(cache.purge.bind(cache), 10000);
setInterval(cache.run.bind(cache, "purge_sessions"), 3600000);
if (!fs.existsSync(join(__dirname, "../logs"))) fs.mkdirSync(join(__dirname, "../logs"));
if (!fs.existsSync(join(__dirname, "../resource"))) fs.mkdirSync(join(__dirname, "../resource"));

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
const ver = JSON.parse(fs.readFileSync(join(__dirname, "../package.json").toString("utf-8")));
const indexPugFn = pug.compileFile(join(__dirname, "pug/index.pug"));
for (const file of fs.readdirSync(join(__dirname, "pug/sites"))) {
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
        fetches = fetches.map(({ identifier, passAs, optional, params }) => {
            return cache.fetch(identifier, params).then(row => {
                if (!row && !optional) {
                    throw new Error("Resource not found!");
                }
                return [row, passAs];
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
        res.status(200).send(templateFn({ env: req.env, f: fetchPass }));
    });
}

// ENDPOINTS

app.get("/auth", async (req, res) => {
    let auth = req.header("authorization");
    if (auth === undefined) {
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
        $token: token,
        $user_id: row["id"]
    });
});

const credentials = {
    cert: fs.readFileSync(join(__dirname, "../ssl/cert.pem")),
    key: fs.readFileSync(join(__dirname, "../ssl/key.pem"))
};

const httpsServer = https.createServer(credentials, app);
app.listen(80, () => {
    console.log("Listening on 80 for HTTP.");
});
httpsServer.listen(443, () => {
    console.log("Server listening on port 443.");
});
