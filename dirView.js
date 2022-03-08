const fs = require("fs");
const { join } = require("path");


/**
 * Creates a list of documents in the provided directory to be placed in HTML.
 * @param {string} path Folder in static directory.
 * @return {string} HTML string containing view.
 */
function docView(path) {
    return "<div class=\"dirview\">" +
    fs.readdirSync(join(__dirname, "static", path), { withFileTypes: true })
        .filter(v => v.isFile() && !v.name.endsWith(".gitkeep") && v.name.match(/(.*)-(.*)\.(.+)/))
        .map(({ name: v }) => {
            const m = v.match(/(.*)-(.*)\.(.+)/);
            m.shift();
            const [fname, tooltip, ext] = m;
            return `[${ext.toUpperCase()}] <a` + (tooltip ? `title="${tooltip}"` : "") + ` href="/${path}/${v}">${fname}</a>`;
        }).join("<br/>") + "</div>";
}

module.exports = { docView };
