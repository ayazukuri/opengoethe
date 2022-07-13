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

function post(path, body = {}, headers = {}, timeout = 60000) {
    const r = new XMLHttpRequest();
    r.open("POST", path);
    for (const header of Object.keys(headers)) {
        r.setRequestHeader(header, headers[header]);
    }
    try {
        r.send(JSON.stringify(body));
    } catch (e) {
        r.send(body);
    }
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

function put(path, body = {}, headers = {}, timeout = 60000) {
    const r = new XMLHttpRequest();
    r.open("PUT", path);
    for (const header of Object.keys(headers)) {
        r.setRequestHeader(header, headers[header]);
    }
    try {
        r.send(JSON.stringify(body));
    } catch (e) {
        r.send(body);
    }
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

function doAlert(html, cl) {
    document.getElementById("alert").innerHTML = `
        <div class="alert alert-${cl} alert-dismissable fade show" role="alert">
            ${html}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
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

function disableSubmit() {
    document.getElementById("submit").disabled= true;
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
            doAlert(res.errorMessage, "warning");
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

function submitRegister() {
    disableSubmit();
    const username = document.querySelector('div > input#username').value;
    const email = document.querySelector('div > input#email').value;
    const password = document.querySelector('div > input#password').value;
    const token = document.querySelector('div.frc-captcha > input').value;
    post(h + "/register", {
        username,
        email,
        password
    }, {
        "Content-Type": "application/json",
        "X-Frc-Token": token
    }).then(r => {
        try {
            const res = JSON.parse(r.response);
            doAlert(res.errorMessage, "danger");
        } catch (e) {
            goto("/login");
        }
    })
}

function submitTransaction(tKey, approved) {
    for (const button of document.querySelectorAll("button")) {
        button.setAttribute("disabled", "");
    }
    post(h + "/transaction", {
        transactionKey: tKey,
        approved
    }, {
        "Content-Type": "application/json"
    }).then(r => {
        try {
            const res = JSON.parse(r.response);
            doAlert(res.errorMessage, "danger");
        } catch (e) {
            goto("/");
        }
    });
}

function submitEmailVerificationRequest() {
    put(h + "/transaction", {
        action: "verify_email"
    }, {
        "Content-Type": "application/json"
    }).then(r => {
        try {
            const res = JSON.parse(r.response);
            doAlert(res.errorMessage, "danger");
        } catch (e) {
            doAlert("Eine Bestätigungsnachricht wurde an deine Email-Adresse gesendet", "primary");
        }
    })
}

function checkAvailableUsername() {
    const username = document.querySelector("#username").value;
    if (!username) return;
    get(`/user/${username}`).then(r => {
        console.log(r);
        doAlert(`Der Username "${username}" ist bereits vergeben`, "danger");
    }).catch(e => {
        doAlert(`Der Username "${username}" ist verfügbar`, "success");
    });
}

function importFile(id) {
    let input = document.getElementById(id);
    if (!input) {
        input = document.createElement("input");
        input.id = id;
        input.type = "file";
        input.style="display: none;";
        input.onchange = () => console.log(Array.from(input.files));
        document.body.appendChild(input);
    }
    input.click();
}

function previewImage(input, img) {
    img.src = window.URL.createObjectURL(input.files[0]);
}

function submitSettings() {
    const username = document.getElementById("username");
    const email = document.getElementById("email");
}
