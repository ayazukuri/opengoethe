const express = require("express");
const path = require("path");
const fs = require("fs");
const https = require("https");

const app = express();

const credentials = {
    cert: fs.readFileSync("ssl/cert.pem"),
    key: fs.readFileSync("ssl/key.pem")
};

exams = [];
const fileMap = new Map();

for (const file of fs.readdirSync("./f")) {
    let k;
    do k = Math.floor(Math.random() * 10000000);
    while (fileMap.has(k));

    if (file.endsWith(".pdf")) {
        na = file.match("(.*)\.pdf")[1].split("_");
        exams.push({
            k,
            n: na[0],
            d: na[1]
        });
        fileMap.set("" + k, file);
    }
}
const html = fs.readFileSync("./index.html").toString("utf8").replace("%EX%", exams.map(obj => `[${obj.d}] <a target="_blank" href="/getFile/${obj.k}">${obj.n}</a>`).join("<br/>"));

app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
});
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send(html);
    res.status(200);
});

app.get("/getFile/*", (req, res) => {
    let id;
    try {
        id = req.path.split("/")[2];
    } catch (e) {
        res.send("Bad Request");
        res.status(400);
        return;
    }
    const file = fileMap.get(id);
    if (!file) {
        res.send("Not Found");
        res.status(404);
        return;
    }
    res.sendFile(path.join(__dirname, "/f/" + file));
    res.status(200);
});

const httpsServer = https.createServer(credentials, app);
app.listen(80, () => {
    console.log("Listening on 80 for HTTP.");
});
httpsServer.listen(443, () => {
    console.log("Server listening on port 443.");
});