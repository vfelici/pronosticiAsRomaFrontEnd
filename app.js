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
            localStorage.setItem("token", token);
            const decoded = JSON.parse(atob(token.split(".")[1]));
            isAdmin = decoded.is_admin;

            document.getElementById("login").style.display = "none";
            document.getElementById("main").style.display = "block";

            if (isAdmin) document.getElementById("adminLinks").style.display = "block";

            loadLeaderboard();
            loadUpcomingMatches();
            loadAllMatchesForView();
            loadScorers();
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
    const matchDate = new Date(m.date);   // UTC dal DB → convertito local dal browser
    const now = new Date();
    
    const option = document.createElement("option");
    option.value = m.id;
    
    // Mostra l'orario in fuso italiano (Europe/Rome)
    const oraLocale = matchDate.toLocaleString("it-IT", { timeZone: "Europe/Rome" });
    
    option.textContent = `${oraLocale} - ${m.home_team} vs ${m.away_team}`;
    
    // ⚠️ Se la partita è già iniziata → disabilita
    if (matchDate <= now) {
        option.disabled = true;
        option.textContent += " (iniziata)";
    }
    
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
  const scorer_id = document.getElementById("scorer_select").value;

  if(!match_id || !home_score || !away_score || !scorer_id){
    alert("⚠️ Completa tutti i campi");
    return;
  }

  try {
    const res = await fetch(`${backendUrl}/matches/${match_id}/predictions`, {
      method: "POST",
      headers:{
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ home_score, away_score, scorer_id })
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
                html += `<li>${row.username} - ${row.points} punti</li>`;
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

async function viewPredictions() {
  const match_id = document.getElementById("view_match_select").value;
  if (!match_id) {
    alert("⚠️ Seleziona una partita");
    return;
  }

  try {
    const res = await fetch(`${backendUrl}/predictions/${match_id}`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();

    const container = document.getElementById("predictions_list");
    container.innerHTML = `<h3>${data.match.home_team} vs ${data.match.away_team}</h3>`;

    if (data.predictions.length === 0) {
      container.innerHTML += `<p>Nessun pronostico disponibile</p>`;
      return;
    }

    let listHtml = "<ul>";
    data.predictions.forEach(p => {
      listHtml += `<li><strong>${p.username}</strong>: ${p.home_score}-${p.away_score} (marcatore: ${p.scorer})</li>`;
    });
    listHtml += "</ul>";
    container.innerHTML += listHtml;

  } catch (err) {
    console.error("Errore caricamento pronostici:", err);
    alert("Errore recupero pronostici");
  }
}

async function loadAllMatchesForView() {
  try {
    const res = await fetch(`${backendUrl}/matches`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const matches = await res.json();

    const select = document.getElementById("view_match_select");
    select.innerHTML = `<option value="">-- seleziona partita --</option>`;

    matches.forEach(m => {
      const option = document.createElement("option");
      option.value = m.id;
      const stato = m.finished ? "✅ finita" : "⏳ in programma";
      option.textContent = `${new Date(m.date).toLocaleString()} - ${m.home_team} vs ${m.away_team} (${stato})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Errore caricamento partite per visualizzazione:", err);
  }
}

async function loadScorers() {
  const res = await fetch(`${backendUrl}/scorers`);
  const players = await res.json();
  const select = document.getElementById("scorer_select");
  select.innerHTML = "";
  players.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.name} (+${p.points}pt)`;
    select.appendChild(option);
  });
}
