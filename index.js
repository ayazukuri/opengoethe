const express = require("express");
const { join } = require("path");
const fs = require("fs");
const https = require("https");

const dirView = require("./dirView");


const tr = /{%(.+)%}/g;
function template(html, valmap) {
    return html.replaceAll(tr, m => valmap[m.substring(2, m.length - 2)] || "");
}

function ti(title) {
    return " · " + title;
}

function log(err) {
    const date = (d => d.toLocaleDateString("DE") + " " + d.toLocaleTimeString("DE"))(new Date());
    fs.writeFile(join(__dirname, "logs", date) + ".log", err.stack);
}

// LOADING HTML TEMPLATES

const templates = {};
const index = fs.readFileSync(join(__dirname, "./html/index.html")).toString("utf-8");
for (const file of fs.readdirSync(join(__dirname, "html"))) {
    if (!file.endsWith(".html") || file === "index.html") continue;
    const page = fs.readFileSync(join(__dirname, "html", file)).toString("utf-8");
    templates[file] = index.replace(`<div id="content"></div>`, `<div id="content">${page}</div>`); 
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

// ENDPOINTS

app.get("/", (req, res) => {
    res.status(200);
    res.send(template(templates["main.html"], {}));
});

app.get("/abi", (req, res) => {
    res.status(200);
    res.send(template(templates["abi.html"], {
        "ti": ti("Mathematik Abitur"),
        "ex": dirView("abi")
    }));
});

const httpsServer = https.createServer(credentials, app);
app.listen(80, () => {
    console.log("Listening on 80 for HTTP.");
});
httpsServer.listen(443, () => {
    console.log("Server listening on port 443.");
});