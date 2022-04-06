/**
 * Template commands only take string arguments and return strings.
 * Template commands are called within a template.
 */

const User = require("./classes/User"); // eslint-disable-line no-unused-vars

const ENUM_PERMISSION_COLOUR = {
    0: "btn-outline-secondary",
    1: "btn-outline-info",
    2: "btn-outline-primary",
    3: "btn-outline-success",
    4: "btn-outline-warning",
    5: "btn-outline-danger"
};

/**
 * Helper function generating a user card.
 * @param {User} user User instnace.
 * @return {string} User card HTML.
 */
function userDisplayCard(user) {
    return /*html*/`
        <a class="btn ${ENUM_PERMISSION_COLOUR[user.permissionLevel]} float-end align-items-center d-flex position-relative" href="/user/${user.id}">
            <span style="font-size: 25px; line-height: 0;">
                ${user.username}
            </span>
            <img class="login-img" src="/resource/${user.avatar || "standard_avatar.png"}" height="50" width="50">
        </a>
    `;
}

/**
 * Builds a title element.
 * @param {object} env Environment set request handler.
 * @param {...string} title
 * @return {string} HTML string containing title element.
 */
function ti(env, ...title) {
    const t = title.length ? title.join(" ") : "";
    let login;
    if (env.loggedIn) {
        login = userDisplayCard(env.user);
    } else {
        login = /*html*/`
            <button type="button" class="btn btn-primary float-end px-5" onclick="window.location.href=window.location.origin + '/login?from=' + encodeURIComponent(window.location.href)">Login</button>
        `;
    }
    return /*html*/`
        <header>
            <h1 class="d-inline-block">
                <a href="/">Informatik Goethe</a><br>
                ${t}
            </h1>
            ${login}
        </header>
    `;
}

/**
 * Builds a Google driver folder widget.
 * @param {object} env Environment set by request handler.
 * @param {string} folderId Google drive folder id.
 * @param {string} display What kind of display to use. Either "grid" or "list".
 * @return {string} HTML string containing widget.
 */
function driveView(env, folderId, display = "list") {
    return /*html*/`
        <iframe src="https://drive.google.com/embeddedfolderview?id=${folderId}#${display}" style="width:100%; height:350px; border:0;"></iframe>
    `;
}

module.exports = {
    ti,
    drive_view: driveView
};
