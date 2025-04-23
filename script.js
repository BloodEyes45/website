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
  const message = document.getElementById("love-message");
  message.classList.toggle("hidden");
}

function toggleSurprise() {
  const surpriseBox = document.getElementById("surprise-box");
  surpriseBox.classList.toggle("hidden");
}

function submitMessage() {
  const messageBox = document.querySelector(".message-box textarea");
  alert(`Mesajınız: ${messageBox.value}`);
}

function revealSecret() {
  const secretMessage = document.getElementById("secretMessage");
  const password = document.getElementById("secretInput").value;

  if (password === "060424") {
    secretMessage.classList.remove("hidden");
  } else {
    alert("Yanlış şifre!");
  }
}

// Countdown Timer
let targetDate = new Date("2025-05-31T00:00:00").getTime();
let timer = document.getElementById("timer");

function updateTimer() {
  let now = new Date().getTime();
  let distance = targetDate - now;

  let days = Math.floor(distance / (1000 * 60 * 60 * 24));
  let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((distance % (1000 * 60)) / 1000);

  timer.innerHTML = `${days}g ${hours}s ${minutes}d ${seconds}s`;

  if (distance < 0) {
    clearInterval(x);
    timer.innerHTML = "Birlikte Zaman Geçirmeye Başladık!";
  }
}

setInterval(updateTimer, 1000);
