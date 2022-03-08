/**
 * Template commands only take string arguments and return strings.
 * Template commands are called within a template.
 */

const fs = require("fs");
const { join } = require("path");


/**
 * Creates a list of documents in the provided directory.
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
            return `[${ext.toUpperCase()}] <a target="_blank" ` + (tooltip ? `title="${tooltip}" ` : "") + `href="/${path}/${v}">${fname.replaceAll("_", " ")}</a>`;
        }).join("<br/>") + "</div>";
}

/**
 * Builds a title element.
 * @param  {...string} title
 * @return {string} HTML string containing title element.
 */
function ti(...title) {
    const t = title.length ? " · " + title.join(" ") : "";
    return `<header><h1><a href="/">Informatik Goethe</a>${t}</h1></header>`;
}

module.exports = { doc_view: docView, ti };
