/**
 * Takes a list of directory items and turns it into HTML.
 * @param {string} path Path leading to this directory within managed.
 * @param {Dirent} dirList
 * @return {string} HTML.
 */
function dirToHTML(path, dirList) {
    return "<a onclick=\"loadDir(this.parentNode.getAttribute('dir') + '/..', this.parentNode)\">./..</a><br>" +
        dirList.sort((a, b) => a.isFile() - b.isFile()).map(v => {
            const { name } = v;
            if (v.isFile()) {
                const m = name.match(/(.*)\.(.+)/);
                return m ?
                    `<a title="${name}" target="_blank" href="/m/${path}/${name}">[${m[2].toUpperCase()}] ${m[1].replaceAll("_", " ")}</a>` :
                    `<a title="${name}" target="_blank" href="/m/${path}/${name}">${name}</a>`;
            } else {
                return `<a onclick="loadDir(this.parentNode.getAttribute('dir') + '/${name}', this.parentNode)">📁 ${name}</a>`;
            }
        }).join("<br>");
}

module.exports = { dirToHTML };
