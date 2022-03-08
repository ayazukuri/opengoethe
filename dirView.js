const fs = require("fs");
const { join } = require("path");


function dirView(path) {
    return fs.readdirSync(join(__dirname, "static", path))
        .filter(v => !v.endsWith(".gitkeep"))
        .map(v => {
            const s = v.split(".");
            const ext = s.length > 1 ? s.pop() : null;
            const t = s.join(".").split("-");
            const tooltip = t.pop();
            const id = t.join("-").replace(/_/g, " ");
            const html = [];
            if (ext) html.push(`[${ext.toUpperCase()}] `);
            html.push(`<a `);
            if (tooltip) html.push(`title="${tooltip}" `);
            html.push(`target="_blank" href="/${path}/${v}">${id}</a>`);
            return html.join("");
        }).join("<br/>");
}

module.exports = dirView;