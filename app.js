let token = "";
let isAdmin = false;
const backendUrl = "https://TUO_BACKEND.onrender.com";

async function register() {
    const res = await fetch(`${backendUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        })
    });
    alert((await res.json()).message || "Registrato");
}

async function login() {
    const res = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        })
    });
    const data = await res.json();
    if (data.token) {
        token = data.token;
        isAdmin = JSON.parse(atob(token.split(".")[1])).is_admin;
        document.getElementById("login").style.display = "none";
        document.getElementById("main").style.display = "block";
        if (isAdmin) document.getElementById("admin").style.display = "block";
        loadLeaderboard();
    } else alert(data.error);
}

async function addPrediction() {
    await fetch(`${backendUrl}/matches/${document.getElementById("match_id").value}/predictions`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            home_score: parseInt(document.getElementById("home_score").value),
            away_score: parseInt(document.getElementById("away_score").value),
            scorer: document.getElementById("scorer").value
        })
    });
    alert("Pronostico inviato");
}

async function setResult() {
    await fetch(`${backendUrl}/matches/${document.getElementById("result_match_id").value}/result`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            home_score: parseInt(document.getElementById("result_home").value),
            away_score: parseInt(document.getElementById("result_away").value)
        })
    });
    alert("Risultato e punteggi aggiornati");
    loadLeaderboard();
}

async function loadLeaderboard() {
    const res = await fetch(`${backendUrl}/leaderboard`, {
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    let html = "<ol>";
    data.forEach(row => {
        html += `<li>${row.username} - ${row.total_points} punti</li>`;
    });
    html += "</ol>";
    document.getElementById("leaderboard").innerHTML = html;
}

async function viewPredictions() {
    const res = await fetch(`${backendUrl}/matches/${document.getElementById("view_match_id").value}/predictions`, {
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    let html = "<ul>";
    data.forEach(p => {
        html += `<li>${p.username ? p.username + ": " : ""} ${p.home_score}-${p.away_score} (${p.scorer || ""}) ${p.points !== undefined ? "- " + p.points + " punti" : ""}</li>`;
    });
    html += "</ul>";
    document.getElementById("predictions_list").innerHTML = html;
}
