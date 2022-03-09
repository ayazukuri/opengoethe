const h = window.location.hostname;

function get(path, query, timeout = 60000) {
    const r = new XMLHttpRequest();
    const q = [];
    for (const k of Object.keys(query)) if (("" + k).length !== 0 && ("" + query[k]).length !== 0) q.push(encodeURI(k) + "=" + encodeURI(query[k]));
    if (q.length === 0) r.open("GET", path);
    else r.open("GET", path + "?" + q.join("&"));
    r.send();
    return new Promise((resolve, reject) => {
        r.onreadystatechange = () => {
            if (r.readyState === XMLHttpRequest.DONE) {
                if (r.status === 0 || (r.status >= 200 && r.status < 400)) resolve(r);
                else reject(new Error("Request rejected."), r);
            }
        };
        setTimeout(() => reject(new Error("Timeout reached during a request."), r), timeout);
    }); 
    
}

function loadDir(dir, view) {
    get("https://" + h + "/dirView", { dir }).then(xhr => {
        view.innerHTML = xhr.responseText;
        view.setAttribute("dir", dir);
    }).catch((e, xhr) => {
        console.log(e);
    });
}