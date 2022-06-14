const h = "https://" + window.location.hostname;

const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
const tooltipList = tooltipTriggerList.map(tooltipTriggerEl => {
  return new bootstrap.Tooltip(tooltipTriggerEl)
});

function get(path, query = {}, headers = {}, timeout = 60000) {
    const r = new XMLHttpRequest();
    const q = [];
    for (const k of Object.keys(query))
        if (k.toString().length !== 0 && query[k].toString().length !== 0)
            q.push(encodeURIComponent(k) + "=" + encodeURIComponent(query[k]));
    if (q.length === 0) r.open("GET", path);
    else r.open("GET", path + "?" + q.join("&"));
    for (const header of Object.keys(headers)) {
        r.setRequestHeader(header, headers[header]);
    }
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

function goto(where) {
    window.location.href = window.location.origin + where;
}

function onEnter(ev, cb) {
    if (ev.keyCode === 13) cb();
}

function enableSubmit() {
    document.getElementById("submit").disabled = false;
}

function submitLogin() {
    const email = document.querySelector('div > input#email').value;
    const password = document.querySelector('div > input#password').value;
    // const token = document.querySelector('div.frc-captcha > input').value;
    get(h + "/auth", {}, {
        "Authorization": "Basic " + btoa(email + ":" + password),
        // "X-Frc-Token": token
    }).then(r => {
        try {
            const res = JSON.parse(r.response);
            alert("Error " + "\n" + res.errorMessage);
        } catch (e) {
            const from = new URLSearchParams(window.location.search).get("from");
            if (from) {
                goto(decodeURIComponent(from));
            } else {
                goto("/");
            }
        }
    });
}
