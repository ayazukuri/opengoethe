const express = require("express");
const path = require("path");
const fs = require("fs");
const https = require("https");

const tr = /{%(.+)%}/g;
function template(html, valmap) {
    return html.replaceAll(tr, m => valmap[m.substring(2, m.length - 2)] || "");
}

const templates = {};
const index = fs.readFileSync("./html/index.html").toString("utf-8");
for (const file of fs.readdirSync("./html")) {
    if (!file.endsWith(".html") || file === "index.html") continue;
    const page = fs.readFileSync("./html/" + file).toString("utf-8");
    templates[file] = index.replace(`<div id="content"></div>`, `<div id="content">${page}</div>`); 
}

const app = express();

const credentials = {
    cert: fs.readFileSync("ssl/cert.pem"),
    key: fs.readFileSync("ssl/key.pem")
};

// MIDDLEWARES & STATIC FILESYSTEM

app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
});
app.use(express.static("static"));

app.get("/", (req, res) => {
    res.send(template(templates["main.html"], {}));
    res.status(200);
});

app.get("/abi", (req, res) => {
    let links;
    try {
        links = fs.readdirSync("./static/abi").filter(v => v.endsWith(".pdf")).map(v => {
            const s = v.split(".");
            s.pop();
            const t = s.join(".").split("-");
            const date = t.pop();
            const id = t.join("-").replace(/_/g, " ");
            return `[${date}] <a target="_blank" href="/abi/${v}">${id}</a>`
        }).join("<br/>");
    } catch (e) {
        res.send("Internal Server Error");
        res.status(500);
    }
    res.send(template(templates["abi.html"], {
        "ex": links,
        "ti": " · Mathematik Abitur"
    }));
    res.status(200);
});

const httpsServer = https.createServer(credentials, app);
app.listen(80, () => {
    console.log("Listening on 80 for HTTP.");
});
httpsServer.listen(443, () => {
    console.log("Server listening on port 443.");
});