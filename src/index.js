const express = require("express");
const { join } = require("path");
const fs = require("fs");
const https = require("https");
const { template, extractDef } = require("./templating.js");

/**
 * Logs an error to a file.
 * @param {Error} err
 */
function log(err) {
    const c = new Date();
    const date = c.toLocaleDateString("DE") + " " + c.toLocaleTimeString("DE");
    fs.writeFile(join(__dirname, "..", "logs", c.getTime() + ".log"), `${date}\n${err.stack}`, () => {});
}

const app = express();

const credentials = {
    cert: fs.readFileSync(join(__dirname, "..", "ssl/cert.pem")),
    key: fs.readFileSync(join(__dirname, "..", "ssl/key.pem"))
};

// MIDDLEWARES & STATIC FILESYSTEM

app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
});
app.use((err, req, res, next) => {
    log(err);
    res.status(500);
    res.send("Internal Server Error");
});
app.use("/static", express.static("static"));

// LOADING HTML TEMPLATES
// INITIALIZING AUTOMATIC PAGES

const templates = new Map();
const index = fs.readFileSync(join(__dirname, "..", "html/index.html")).toString("utf-8");
for (const file of fs.readdirSync(join(__dirname, "..", "html"))) {
    if (!file.endsWith(".htm")) continue;
    const [page, def] = extractDef(fs.readFileSync(join(__dirname, "..", "html", file)).toString("utf-8"));
    const html = index.replace("<div id=\"content\"></div>", `<div id="content">${page}</div>`);
    templates.set(file, { html, def });
    if (def.has("endpoint")) {
        app.get(def.get("endpoint"), (req, res) => {
            res.status(200);
            res.send(template(html, {}));
        });
    }
}

const httpsServer = https.createServer(credentials, app);
app.listen(80, () => {
    console.log("Listening on 80 for HTTP.");
});
httpsServer.listen(443, () => {
    console.log("Server listening on port 443.");
});
