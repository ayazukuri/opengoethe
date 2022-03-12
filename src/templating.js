/**
 * Functions handling insertion into templates and extraction of definitions.
 */

const templateCommands = require("./templateCommands");


/**
 * Takes templated HTML and inserts values for templates.
 * @param {string} html Templated HTML.
 * @param {object} env Mapping of (tag) => (value)
 * @return {string} HTML with filled templates.
 */
function template(html, env) {
    return html
        .replaceAll(/{%.+?}/g, m => env[m.substring(2, m.length - 1)] || "")
        .replaceAll(/{\$.+?}/g, m => {
            const args = m.substring(2, m.length - 1).split(" ");
            const cmd = args.shift();
            return templateCommands[cmd](...args);
        });
}

/**
 * Takes a raw template and extracts definition declarations.
 * @param {string} html
 * @return {[string, Map]} Template with definitions removed and the definition Map instance.
 */
function extractDef(html) {
    const def = new Map();
    const nhtml = html.replaceAll(/{#.+?}/g, m => {
        const [n, val] = m.substring(2, m.length - 1).split(" ");
        def.set(n, val);
        return "";
    });
    return [nhtml, def];
}

module.exports = { template, extractDef };
