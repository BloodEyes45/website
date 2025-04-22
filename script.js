const music = document.getElementById("bg-music");
let playing = false;

function toggleMusic() {
  if (playing) {
    music.pause();
  } else {
    music.play();
  }
  playing = !playing;
}

function showLoveMessage() {
  const msg = document.getElementById("love-message");
  msg.style.display = "block";
}

// Geri Sayım / Sayaç
const startDate = new Date("2024-04-06T00:00:00"); // ilişkinin başladığı tarih
function updateCountdown() {
  const now = new Date();
  const diff = now - startDate;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById("timer").textContent =
    `${days} gün, ${hours} saat, ${minutes} dakika, ${seconds} saniye geçti 💖`;
}
setInterval(updateCountdown, 1000);
updateCountdown();
