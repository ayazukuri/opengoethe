/**
 * Template commands only take string arguments and return strings.
 * Template commands are called within a template.
 */

const fs = require("fs");
const { join } = require("path");
const { dirToHTML } = require("./htmlHelper");

/**
 * Creates a list of documents in the provided directory.
 * @param {string} path Folder in managed directory.
 * @return {string} HTML string containing view.
 */
function dirView(path) {
    let dir;
    try {
        dir = fs.readdirSync(join(__dirname, "managed", path), { withFileTypes: true });
    } catch (e) {
        if (e.code === "ENOENT") {
            fs.mkdirSync(join(__dirname, "managed", path), { recursive: true });
            return dirView(path);
        } else throw e;
    }
    return `<div class="dir_view" dir="${path}">` + dirToHTML(path, dir) + "</div>";
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

module.exports = { dir_view: dirView, ti };