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
    if (file.endsWith(".pdf")) {
        const [n, d] = file.match("(.*)\.pdf")[1].split("-");
        console.log(n, d);
        exams.push({
            n,
            d
        });
        fileMap.set(n + ".pdf", file);
    }
}
const html = fs.readFileSync("./index.html").toString("utf8").replace("%EX%", exams.map(obj => `[${obj.d}] <a target="_blank" href="/f/${obj.n}.pdf">${obj.n.replace("_", " ")}</a>`).join("<br/>"));

app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
});
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send(html);
    res.status(200);
});

app.get("/f/*", (req, res) => {
    let n;
    try {
        n = decodeURI(req.path.split("/")[2]);
    } catch (e) {
        res.send("Bad Request");
        res.status(400);
        return;
    }
    try {
        res.sendFile(path.join(__dirname, "/f/" + fileMap.get(n)));
    } catch (e) {
        res.send("File Not Found");
        res.status(404);
        return;
    }
    res.status(200);
});

const httpsServer = https.createServer(credentials, app);
app.listen(80, () => {
    console.log("Listening on 80 for HTTP.");
});
httpsServer.listen(443, () => {
    console.log("Server listening on port 443.");
});