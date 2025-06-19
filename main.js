// Maç verileri örnek yapısı:
// { myChampion: 'Ahri', cousinChampion: 'Yasuo', result: 'win', link: 'https://...' }

let championData = null;
let championIconBase = 'https://ddragon.leagueoflegends.com/cdn/14.9.1/img/champion/';
let championLoading = false;

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBzVqheIZ-1OXPAb65MU2vFrx4Sgr9ehmI",
  authDomain: "lol-win-lose-tracker.firebaseapp.com",
  databaseURL: "https://lol-win-lose-tracker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lol-win-lose-tracker",
  storageBucket: "lol-win-lose-tracker.appspot.com",
  messagingSenderId: "948422840389",
  appId: "1:948422840389:web:2397840c016aa80b06132c"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

async function loadChampions() {
  if (championData || championLoading) return;
  championLoading = true;
  try {
    const res = await fetch('https://ddragon.leagueoflegends.com/cdn/14.9.1/data/tr_TR/champion.json');
    const data = await res.json();
    championData = {};
    Object.values(data.data).forEach(champ => {
      championData[champ.name.toLowerCase()] = champ.image.full;
    });
  } catch (e) {
    championData = null;
  }
  championLoading = false;
}

function getChampionIcon(name) {
  if (!championData) return 'https://ddragon.leagueoflegends.com/cdn/14.9.1/img/champion/Aatrox.png'; // default
  // Data Dragon'da Türkçe isimler büyük harf duyarlı, ama image.full İngilizce
  // Kullanıcı Türkçe veya İngilizce girebilir, önce tam eşleşme, sonra baş harf büyük dene
  let key = name.trim().toLowerCase();
  if (championData[key]) return championIconBase + championData[key];
  // Baş harf büyük dene
  key = key.charAt(0).toUpperCase() + key.slice(1);
  for (const champ in championData) {
    if (championData[champ].toLowerCase().startsWith(key.toLowerCase())) {
      return championIconBase + championData[champ];
    }
  }
  return 'https://ddragon.leagueoflegends.com/cdn/14.9.1/img/champion/Aatrox.png';
}

// Firebase ile çalışan fonksiyonlar
function getMatches(callback) {
  db.ref('matches').on('value', snap => {
    const val = snap.val();
    callback(val ? val : []);
  });
}
function saveMatches(matches) {
  db.ref('matches').set(matches);
}
function getNotes(callback) {
  db.ref('match_notes').on('value', snap => {
    const val = snap.val();
    callback(val ? val : {});
  });
}
function saveNotes(notes) {
  db.ref('match_notes').set(notes);
}

function updateWinrateBar(winrate) {
  const bar = document.getElementById('winrate-bar');
  bar.style.width = winrate + '%';
  if (winrate >= 70) {
    bar.style.background = 'linear-gradient(90deg, #4fe39b 0%, #00e0c6 100%)';
  } else if (winrate >= 50) {
    bar.style.background = 'linear-gradient(90deg, #ffe066 0%, #4fe39b 100%)';
  } else {
    bar.style.background = 'linear-gradient(90deg, #ff4f4f 0%, #ffe066 100%)';
  }
}

// Maçları ve notları dinle, güncel tut
let currentMatches = [];
let currentNotes = {};
getMatches(matches => {
  currentMatches = matches;
  updateStats(matches);
  renderMatchesTable(matches, currentNotes);
});
getNotes(notes => {
  currentNotes = notes;
  renderMatchesTable(currentMatches, notes);
});

document.getElementById('add-match-btn').addEventListener('click', addMatch);

function addMatch() {
  const myChampion = prompt('Senin oynadığın karakter?');
  if (!myChampion) return;
  const cousinChampion = prompt('Kuzenin oynadığı karakter?');
  if (!cousinChampion) return;
  const result = prompt('Sonuç? (win/lose)').toLowerCase();
  if (result !== 'win' && result !== 'lose') return alert('Sonuç win veya lose olmalı!');
  const link = prompt('Maçın Porofessor linki?');
  if (!link) return;
  const matches = currentMatches.slice();
  matches.unshift({ myChampion, cousinChampion, result, link });
  saveMatches(matches);
}

function calculateStreaks(matches) {
  let currentWin = 0, currentLose = 0;
  let bestWin = 0, bestLose = 0;
  let tempWin = 0, tempLose = 0;
  let last = null;
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].result === 'win') {
      if (last === 'win') {
        tempWin++;
      } else {
        tempWin = 1;
      }
      tempLose = 0;
    } else if (matches[i].result === 'lose') {
      if (last === 'lose') {
        tempLose++;
      } else {
        tempLose = 1;
      }
      tempWin = 0;
    }
    if (tempWin > bestWin) bestWin = tempWin;
    if (tempLose > bestLose) bestLose = tempLose;
    last = matches[i].result;
  }
  // Son maçın streak'i aktif streaktir
  if (matches.length > 0) {
    if (matches[matches.length-1].result === 'win') {
      currentWin = tempWin;
      currentLose = 0;
    } else if (matches[matches.length-1].result === 'lose') {
      currentLose = tempLose;
      currentWin = 0;
    }
  }
  return { currentWin, currentLose, bestWin, bestLose };
}

function updateStats(matches) {
  const total = matches.length;
  const wins = matches.filter(m => m.result === 'win').length;
  const loses = matches.filter(m => m.result === 'lose').length;
  const winrate = total ? Math.round((wins / total) * 100) : 0;
  document.getElementById('total-matches').textContent = total;
  document.getElementById('total-wins').textContent = wins;
  document.getElementById('total-loses').textContent = loses;
  document.getElementById('winrate').textContent = winrate + '%';
  updateWinrateBar(winrate);
  // Streakler
  const streaks = calculateStreaks(matches);
  document.getElementById('current-win-streak').textContent = streaks.currentWin;
  document.getElementById('current-lose-streak').textContent = streaks.currentLose;
  document.getElementById('best-win-streak').textContent = streaks.bestWin;
  document.getElementById('best-lose-streak').textContent = streaks.bestLose;
}

function updateTopChampion(matches) {
  const champWins = {};
  matches.forEach(m => {
    if (m.result === 'win') {
      champWins[m.myChampion] = (champWins[m.myChampion] || 0) + 1;
    }
  });
  let top = '-';
  let max = 0;
  for (const champ in champWins) {
    if (champWins[champ] > max) {
      max = champWins[champ];
      top = champ;
    }
  }
  document.getElementById('champion-name').textContent = top;
}

async function renderMatchesTable(matches, notes) {
  await loadChampions();
  const tbody = document.getElementById('matches-tbody');
  notes = notes || {};
  tbody.innerHTML = '';
  matches.forEach((m, i) => {
    const tr = document.createElement('tr');
    tr.className = m.result === 'win' ? 'win-row' : 'lose-row';
    const myIcon = `<img src="${getChampionIcon(m.myChampion)}" alt="${m.myChampion}" class="champ-icon" title="${m.myChampion}" />`;
    const cousinIcon = `<img src="${getChampionIcon(m.cousinChampion)}" alt="${m.cousinChampion}" class="champ-icon" title="${m.cousinChampion}" />`;
    const linkIcon = `<a href="${m.link}" target="_blank" title="Maç Linki"><svg class="match-link-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 14L21 3M21 3v7m0-7h-7"/><path d="M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/></svg></a>`;
    const noteVal = notes[i] || '';
    const noteInput = `<input type="text" class="match-note-input" data-index="${i}" value="${noteVal}" placeholder="Not ekle..." maxlength="60" />`;
    tr.innerHTML = `
      <td>${myIcon} ${m.myChampion}</td>
      <td>${cousinIcon} ${m.cousinChampion}</td>
      <td><b>${m.result === 'win' ? 'Win' : 'Lose'}</b> ${linkIcon}</td>
      <td>${noteInput}</td>
      <td><button class="delete-match-btn" data-index="${i}">Sil</button></td>
    `;
    tbody.appendChild(tr);
    setTimeout(() => { tr.classList.remove('win-row', 'lose-row'); }, 1200);
  });
  document.querySelectorAll('.delete-match-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-index'), 10);
      const matches = currentMatches.slice();
      matches.splice(idx, 1);
      saveMatches(matches);
    });
  });
  document.querySelectorAll('.match-note-input').forEach(input => {
    input.addEventListener('change', function() {
      const idx = this.getAttribute('data-index');
      const notes = Object.assign({}, currentNotes);
      notes[idx] = this.value;
      saveNotes(notes);
    });
  });
} 
