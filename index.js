const express = require("express");
const { join } = require("path");
const fs = require("fs");
const https = require("https");

const templateCommands = require("./templateCommands");


/**
 * Takes templated HTML and inserts values for templates.
 * @param {string} html Templated HTML.
 * @param {object} env Mapping of (tag) => (value)
 * @return {string} HTML with filled templates.
 */
function template(html, env) {
    return html
        .replaceAll(/{%.+?}/g, m => env[m.substring(2, m.length - 1)] || "")
        .replaceAll(/{\$.+?}/g, m => {
            const args = m.substring(2, m.length - 1).split(" ");
            const cmd = args.shift();
            return templateCommands[cmd](...args);
        });
}

/**
 * Takes a raw template and extracts definition declarations.
 * @param {string} html
 * @return {[string, Map]} Template with definitions removed and the definition Map instance.
 */
function extractDef(html) {
    const def = new Map();
    const nhtml = html.replaceAll(/{#.+?}/g, m => {
        const [n, val] = m.substring(2, m.length - 1).split(" ");
        def.set(n, val);
        return "";
    });
    return [nhtml, def];
}

/**
 * Logs an error to a file.
 * @param {Error} err
 */
function log(err) {
    const c = new Date();
    const date = c.toLocaleDateString("DE") + " " + c.toLocaleTimeString("DE");
    fs.writeFile(join(__dirname, "logs", date) + ".log", err.stack);
}

const app = express();

const credentials = {
    cert: fs.readFileSync(join(__dirname, "ssl/cert.pem")),
    key: fs.readFileSync(join(__dirname, "ssl/key.pem"))
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
app.use(express.static("static"));

// LOADING HTML TEMPLATES
// INITIALIZING AUTOMATIC PAGES

const templates = new Map();
const index = fs.readFileSync(join(__dirname, "html/index.html")).toString("utf-8");
for (const file of fs.readdirSync(join(__dirname, "html"))) {
    if (!file.endsWith(".htm")) continue;
    const [page, def] = extractDef(fs.readFileSync(join(__dirname, "html", file)).toString("utf-8"));
    const html = index.replace("<div id=\"content\"></div>", `<div id="content">${page}</div>`);
    templates.set(file, { html, def });
    if (def.has("endpoint")) {
        app.get(def.get("endpoint"), (req, res) => {
            res.status(200);
            res.send(template(html, {}));
        });
    }
}

// ENDPOINTS

// ---

const httpsServer = https.createServer(credentials, app);
app.listen(80, () => {
    console.log("Listening on 80 for HTTP.");
});
httpsServer.listen(443, () => {
    console.log("Server listening on port 443.");
});
