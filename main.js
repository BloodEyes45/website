// Maç verileri örnek yapısı:
// { myChampion: 'Ahri', cousinChampion: 'Yasuo', result: 'win', link: 'https://...' }

let championData = null;
let championIconBase = 'https://ddragon.leagueoflegends.com/cdn/14.9.1/img/champion/';
let championLoading = false;

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

function getMatches() {
  return JSON.parse(localStorage.getItem('matches') || '[]');
}

function saveMatches(matches) {
  localStorage.setItem('matches', JSON.stringify(matches));
}

function getNotes() {
  return JSON.parse(localStorage.getItem('match_notes') || '{}');
}

function saveNotes(notes) {
  localStorage.setItem('match_notes', JSON.stringify(notes));
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

async function renderMatchesTable(matches) {
  await loadChampions();
  const tbody = document.getElementById('matches-tbody');
  const notes = getNotes();
  tbody.innerHTML = '';
  matches.forEach((m, i) => {
    const tr = document.createElement('tr');
    tr.className = m.result === 'win' ? 'win-row' : 'lose-row';
    // Şampiyon ikonları
    const myIcon = `<img src="${getChampionIcon(m.myChampion)}" alt="${m.myChampion}" class="champ-icon" title="${m.myChampion}" />`;
    const cousinIcon = `<img src="${getChampionIcon(m.cousinChampion)}" alt="${m.cousinChampion}" class="champ-icon" title="${m.cousinChampion}" />`;
    // Maç linki ikonu
    const linkIcon = `<a href="${m.link}" target="_blank" title="Maç Linki"><svg class="match-link-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 14L21 3M21 3v7m0-7h-7"/><path d="M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/></svg></a>`;
    // Not input
    const noteVal = notes[i] || '';
    const noteInput = `<input type="text" class="match-note-input" data-index="${i}" value="${noteVal}" placeholder="Not ekle..." maxlength="60" />`;
    // Satır
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
  // Silme butonları
  document.querySelectorAll('.delete-match-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-index'), 10);
      const matches = getMatches();
      matches.splice(idx, 1);
      saveMatches(matches);
      updateStats(matches);
      renderMatchesTable(matches);
      const notes = getNotes();
      delete notes[idx];
      saveNotes(notes);
    });
  });
  // Not inputları
  document.querySelectorAll('.match-note-input').forEach(input => {
    input.addEventListener('change', function() {
      const idx = this.getAttribute('data-index');
      const notes = getNotes();
      notes[idx] = this.value;
      saveNotes(notes);
    });
  });
}

// Sayfa yüklenince verileri göster
const matches = getMatches();
updateStats(matches);
renderMatchesTable(matches);

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
  const matches = getMatches();
  matches.unshift({ myChampion, cousinChampion, result, link });
  saveMatches(matches);
  updateStats(matches);
  renderMatchesTable(matches);
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
