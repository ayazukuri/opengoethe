/**
 * Helper functions strictly for converting other data types to HTML strings.
 */

/**
 * Takes a list of directory items and turns it into HTML.
 * @param {string} path Path leading to this directory within managed.
 * @param {Dirent} dirList
 * @return {string} HTML.
 */
function dirToHTML(path, dirList) {
    const fileList = dirList
        .sort((a, b) => a.isFile() - b.isFile())
        .map(v => {
            const { name } = v;
            if (v.isFile()) {
                const m = name.match(/(.*)\.(.+)/);
                if (m === null) return `<a title="${name}" target="_blank" href="/m/${path}/${name}">${name}</a>`;
                return `<a title="${name}" target="_blank" href="/m/${path}/${name}">[${m[2].toUpperCase()}] ${m[1].replaceAll("_", " ")}</a>`;
            }
            return `<a onclick="loadDir(this.parentNode.parentNode.getAttribute('dir') + '/${name}', this.parentNode.parentNode)">${name}/</a>`;
        })
        .join("<br>");
    return `<input autocomplete="off" onkeypress="onEnter(event, () => loadDir(this.value, this.parentNode))" type="text" value="${path.replaceAll(/\\/g, "/")}">
            <div class="dir_list">
                <a onclick="loadDir(this.parentNode.parentNode.getAttribute('dir') + '/..', this.parentNode.parentNode)">./..</a><br>
                ${fileList}
            </div>`;
}

module.exports = { dirToHTML };
