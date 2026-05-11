const TOTAL_ROUNDS = 5;
const ANSWER_RADIUS_METERS = 90;
const STORAGE_KEY = "csunMapGameHighScore";

const csunCenter = { lat: 34.2406, lng: -118.5291 };

// Includes 4 custom picks and 1 required location from the assignment prompt.
const LOCATIONS = [
  {
    name: "Oviatt Library",
    lat: 34.240005,
    lng: -118.528623
  },
  {
    name: "Student Recreation Center",
    lat: 34.245282,
    lng: -118.525998
  },
  {
    name: "University Student Union",
    lat: 34.242431,
    lng: -118.528252
  },
  {
    name: "Sierra Tower",
    lat: 34.239752,
    lng: -118.531704
  },
  {
    name: "Alumni Relations, Reseda Annex - A4",
    lat: 34.24009396929945,
    lng: -118.53587673189622
  }
];

let map;
let rounds = [];
let currentRoundIndex = 0;
let score = 0;
let isPlaying = false;
let canAnswerRound = false;
let answerCircle = null;
let guessMarker = null;
let timerIntervalId = null;
let startTimeMs = 0;

const ui = {
  roundCounter: document.getElementById("roundCounter"),
  scoreCounter: document.getElementById("scoreCounter"),
  targetPrompt: document.getElementById("targetPrompt"),
  feedback: document.getElementById("feedback"),
  timer: document.getElementById("timer"),
  highScoreText: document.getElementById("highScoreText"),
  startButton: document.getElementById("startButton"),
  restartButton: document.getElementById("restartButton"),
  infoPanel: document.querySelector(".info-panel")
};

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: csunCenter,
    zoom: 16,
    mapTypeId: "roadmap",
    disableDefaultUI: true,
    disableDoubleClickZoom: true,
    draggable: false,
    keyboardShortcuts: false,
    scrollwheel: false,
    gestureHandling: "none"
  });

  map.addListener("dblclick", onMapDoubleClick);

  ui.startButton.addEventListener("click", startGame);
  ui.restartButton.addEventListener("click", startGame);

  renderHighScore();
}

function startGame() {
  rounds = shuffleArray([...LOCATIONS]).slice(0, TOTAL_ROUNDS);
  currentRoundIndex = 0;
  score = 0;
  isPlaying = true;
  canAnswerRound = true;
  startTimeMs = Date.now();

  clearMapFeedback();
  clearFeedbackText();
  updateCounters();
  showCurrentPrompt();
  startTimer();
}

function onMapDoubleClick(event) {
  if (!isPlaying || !canAnswerRound) {
    return;
  }

  canAnswerRound = false;
  clearMapFeedback();

  const guess = event.latLng;
  const target = rounds[currentRoundIndex];
  const targetLatLng = new google.maps.LatLng(target.lat, target.lng);

  guessMarker = new google.maps.Marker({
    position: guess,
    map,
    title: "Your guess",
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: "#1f6ef8",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2
    }
  });

  const distance = google.maps.geometry.spherical.computeDistanceBetween(guess, targetLatLng);
  const isCorrect = distance <= ANSWER_RADIUS_METERS;

  answerCircle = new google.maps.Circle({
    map,
    center: targetLatLng,
    radius: ANSWER_RADIUS_METERS,
    strokeColor: isCorrect ? "#1e7f3f" : "#b22d2b",
    strokeOpacity: 0.95,
    strokeWeight: 2,
    fillColor: isCorrect ? "#38b962" : "#e14545",
    fillOpacity: 0.3
  });

  if (isCorrect) {
    score += 1;
    showFeedback("Correct! Nice job.", "correct");
    animatePanel("pulse-success");
  } else {
    showFeedback("Wrong. The highlighted red area is the correct location.", "wrong");
    animatePanel("pulse-wrong");
  }

  updateCounters();

  window.setTimeout(() => {
    advanceRound();
  }, 1400);
}

function advanceRound() {
  currentRoundIndex += 1;

  if (currentRoundIndex >= TOTAL_ROUNDS) {
    finishGame();
    return;
  }

  clearMapFeedback();
  clearFeedbackText();
  canAnswerRound = true;
  showCurrentPrompt();
  updateCounters();
}

function finishGame() {
  isPlaying = false;
  canAnswerRound = false;
  stopTimer();

  const elapsed = Date.now() - startTimeMs;
  const elapsedText = formatElapsed(elapsed);
  showFeedback(
    `Game finished! You got ${score} out of ${TOTAL_ROUNDS} correct in ${elapsedText}.`,
    score >= 3 ? "correct" : "wrong"
  );

  alert(`Final score: ${score}/${TOTAL_ROUNDS}. Time: ${elapsedText}.`);

  updateHighScore(score, elapsed);
  renderHighScore();
}

function showCurrentPrompt() {
  const target = rounds[currentRoundIndex];
  ui.targetPrompt.textContent = target
    ? target.name
    : "Press Start to begin.";
}

function updateCounters() {
  ui.roundCounter.textContent = `${Math.min(currentRoundIndex + (isPlaying ? 1 : 0), TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`;
  ui.scoreCounter.textContent = String(score);
}

function showFeedback(message, type) {
  ui.feedback.textContent = message;
  ui.feedback.classList.remove("correct", "wrong");

  if (type) {
    ui.feedback.classList.add(type);
  }
}

function clearFeedbackText() {
  showFeedback("", "");
}

function clearMapFeedback() {
  if (answerCircle) {
    answerCircle.setMap(null);
    answerCircle = null;
  }

  if (guessMarker) {
    guessMarker.setMap(null);
    guessMarker = null;
  }
}

function animatePanel(className) {
  ui.infoPanel.classList.remove("pulse-success", "pulse-wrong");
  ui.infoPanel.classList.add(className);

  window.setTimeout(() => {
    ui.infoPanel.classList.remove(className);
  }, 600);
}

function startTimer() {
  stopTimer();
  updateTimerUI();

  timerIntervalId = window.setInterval(() => {
    updateTimerUI();
  }, 1000);
}

function stopTimer() {
  if (timerIntervalId) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function updateTimerUI() {
  if (!startTimeMs) {
    ui.timer.textContent = "00:00";
    return;
  }

  const elapsed = Date.now() - startTimeMs;
  ui.timer.textContent = formatElapsed(elapsed);
}

function formatElapsed(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateHighScore(newScore, elapsedMs) {
  const previous = getHighScore();

  if (!previous) {
    saveHighScore({ score: newScore, elapsedMs });
    return;
  }

  const hasMoreCorrect = newScore > previous.score;
  const tieButFaster = newScore === previous.score && elapsedMs < previous.elapsedMs;

  if (hasMoreCorrect || tieButFaster) {
    saveHighScore({ score: newScore, elapsedMs });
  }
}

function renderHighScore() {
  const saved = getHighScore();

  if (!saved) {
    ui.highScoreText.textContent = "No high score yet.";
    return;
  }

  ui.highScoreText.textContent = `${saved.score}/${TOTAL_ROUNDS} in ${formatElapsed(saved.elapsedMs)}`;
}

function getHighScore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed.score !== "number" || typeof parsed.elapsedMs !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveHighScore(payload) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

window.initMap = initMap;

function loadGoogleMapsApi() {
  const apiKey = window.MAPS_API_KEY;

  if (!apiKey) {
    showFeedback("Missing API key. Add it in local-config.js.", "wrong");
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&callback=initMap`;
  script.onerror = () => {
    showFeedback("Google Maps failed to load. Check your API key restrictions.", "wrong");
  };
  document.head.appendChild(script);
}

loadGoogleMapsApi();
