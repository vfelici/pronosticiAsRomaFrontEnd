let token = "";
let isAdmin = false;

// 👇 Cambia con l’URL del backend su Render 
const backendUrl = "https://backendpronosticiasroma.onrender.com";

// --- REGISTRAZIONE + LOGIN AUTOMATICO ---
async function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Inserisci username e password");
        return;
    }

    try {
        const res = await fetch(`${backendUrl}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            alert("Registrazione completata! Eseguo login automatico…");
            // 🔹 Subito login con le stesse credenziali
            await login(username, password);
        } else {
            alert(data.error || "Errore registrazione");
        }
    } catch (err) {
        alert("Errore di connessione al server: " + err.message);
    }
}

// --- LOGIN ---
async function login(forcedUsername, forcedPassword) {
    const username = forcedUsername || document.getElementById("username").value.trim();
    const password = forcedPassword || document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Inserisci username e password");
        return;
    }

    try {
        const res = await fetch(`${backendUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok && data.token) {
            token = data.token;
            const decoded = JSON.parse(atob(token.split(".")[1]));
            isAdmin = decoded.is_admin;

            document.getElementById("login").style.display = "none";
            document.getElementById("main").style.display = "block";

            if (isAdmin) document.getElementById("adminLinks").style.display = "block";

            loadLeaderboard();
            loadUpcomingMatches();
        } else {
            alert(data.error || "Errore login");
        }
    } catch (err) {
        alert("Errore di connessione al server: " + err.message);
    }
}

async function loadUpcomingMatches() {
  try {
    const res = await fetch(`${backendUrl}/matches/upcoming`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const matches = await res.json();

    const select = document.getElementById("match_select");
    select.innerHTML = `<option value="">-- seleziona partita --</option>`; // reset

    matches.forEach(m => {
      const option = document.createElement("option");
      option.value = m.id;
      option.textContent = `${new Date(m.date).toLocaleString()} - ${m.home_team} vs ${m.away_team}`;
      select.appendChild(option);
    });

  } catch (err) {
    console.error("Errore recupero partite future:", err);
  }
}

async function addPrediction() {
  const match_id = document.getElementById("match_select").value;
  const home_score = document.getElementById("home_score").value;
  const away_score = document.getElementById("away_score").value;
  const scorer = document.getElementById("scorer").value;

  if(!match_id || !home_score || !away_score || !scorer){
    alert("⚠️ Completa tutti i campi");
    return;
  }

  try {
    const res = await fetch(`${backendUrl}/predictions`, {
      method: "POST",
      headers:{
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ match_id, home_score, away_score, scorer })
    });

    const data = await res.json();
    if(res.ok){
      alert("✅ Pronostico salvato!");
    } else {
      alert("❌ Errore: " + (data.error || "Impossibile salvare"));
    }
  } catch (err) {
    console.error("Errore:", err);
  }
}

// --- INSERIMENTO RISULTATO UFFICIALE ---
async function setResult() {
    try {
        const res = await fetch(`${backendUrl}/matches/${document.getElementById("result_match_id").value}/result`, {
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
        const data = await res.json();

        if (res.ok) {
            alert("Risultato e punteggi aggiornati!");
            loadLeaderboard();
        } else {
            alert(data.error || "Errore set risultato");
        }
    } catch (err) {
        alert("Errore connessione: " + err.message);
    }
}

// --- CLASSIFICA ---
async function loadLeaderboard() {
    try {
        const res = await fetch(`${backendUrl}/leaderboard`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();

        if (res.ok) {
            let html = "<ol>";
            data.forEach(row => {
                html += `<li>${row.username} - ${row.total_points} punti</li>`;
            });
            html += "</ol>";
            document.getElementById("leaderboard").innerHTML = html;
        } else {
            document.getElementById("leaderboard").innerHTML = "Errore caricamento classifica.";
        }
    } catch (err) {
        document.getElementById("leaderboard").innerHTML = "Errore connessione: " + err.message;
    }
}

// --- VISUALIZZA PRONOSTICI ---
async function viewPredictions() {
    try {
        const res = await fetch(`${backendUrl}/matches/${document.getElementById("view_match_id").value}/predictions`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();

        if (res.ok) {
            let html = "<ul>";
            data.forEach(p => {
                html += `<li>${p.username ? p.username + ": " : ""} ${p.home_score}-${p.away_score} (${p.scorer || ""}) ${p.points !== undefined ? "- " + p.points + " punti" : ""}</li>`;
            });
            html += "</ul>";
            document.getElementById("predictions_list").innerHTML = html;
        } else {
            alert(data.error || "Errore caricamento pronostici");
        }
    } catch (err) {
        alert("Errore connessione: " + err.message);
    }
}
