/**
 * Template commands only take string arguments and return strings.
 * Template commands are called within a template.
 */

/**
 * Builds a title element.
 * @param  {...string} title
 * @return {string} HTML string containing title element.
 */
function ti(...title) {
    const t = title.length ? " · " + title.join(" ") : "";
    return `<header><h1><a href="/">Informatik Goethe</a>${t}</h1></header>`;
}

/**
 * Builds a Google driver folder widget.
 * @param {string} folderId Google drive folder id.
 * @param {string} display What kind of display to use. Either "grid" or "list".
 * @return {string} HTML string containing widget.
 */
function driveView(folderId, display) {
    return `<iframe src="https://drive.google.com/embeddedfolderview?id=${folderId}#${display}" style="width:100%; height:350px; border:0;"></iframe>`;
}

module.exports = {
    ti,
    drive_view: driveView
};
