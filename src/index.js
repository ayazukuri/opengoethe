const express = require("express");
const cookieParser = require("cookie-parser");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { join } = require("path");
const fs = require("fs");
const https = require("https");
const { template, extractDef } = require("./templating.js");
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

// LOADING HTML TEMPLATES
// INITIALIZING AUTOMATIC PAGES

const templates = new Map();
const ver = JSON.parse(fs.readFileSync(join(__dirname, "../package.json").toString("utf-8")));
const index = fs.readFileSync(join(__dirname, "../html/index.html")).toString("utf-8").replace(/*html*/`<div id="ver"></div>`, /*html*/`<div id="ver">running ${ver.version}</div>`);
for (const file of fs.readdirSync(join(__dirname, "../html"))) {
    if (!file.endsWith(".htm")) continue;
    const [page, def] = extractDef(fs.readFileSync(join(__dirname, "../html", file)).toString("utf-8"));
    const html = index.replace(
        /*html*/`<div class="container-fluid" id="content"></div>`,
        /*html*/`<div class="container-fluid" id="content">${page}</div>`
    );
    templates.set(file, { html, def });
    if (def.has("endpoint")) {
        app.get(def.get("endpoint"), async (req, res) => {
            if (def.has("permission_level")) {
                if (!req.env.loggedIn) {
                    res.status(401).redirect("https://" + req.headers.host + "/login");
                    return;
                }
                if (def.get("permission_level") <= req.env.user.permissionLevel) {
                    res.status(200).send(template(html, req.env));
                } else {
                    // Some kind of reject page here.
                    res.status(403).redirect("https://" + req.headers.host + "/?rejected=1");
                }
            } else {
                res.status(200).send(template(html, req.env));
            }
        });
    }
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

app.get("/user/*", async (req, res) => {
    let row;
    if (req.path.match(/\/user\/\~(.*)/)) {
        const username = req.path.match(/\/user\/\~(.*)/)[1];
        row = await cache.fetch("profile_by_username", {
            $username: username
        });
    } else {
        const id = req.path.match(/\/user\/(.*)/)[1];
        row = await cache.fetch("profile_by_id", {
            $id: id
        });
    }
    if (!row) {
        res.status(404).send("Not Found");
        return;
    }
    res.status(200).send(template(templates.get("user.htm").html, {
        ...row,
        ...req.env
    }));
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
