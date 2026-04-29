const board = document.querySelector("#board");
const rollButton = document.querySelector("#rollButton");
const resetButton = document.querySelector("#resetButton");
const diceFace = document.querySelector("#diceFace");
const statusText = document.querySelector("#statusText");
const turnLabel = document.querySelector("#turnLabel");
const questionCard = document.querySelector("#questionCard");
const questionTopic = document.querySelector("#questionTopic");
const questionText = document.querySelector("#questionText");
const answers = document.querySelector("#answers");
const toast = document.querySelector("#toast");
const playerOneCard = document.querySelector("#playerOneCard");
const playerTwoCard = document.querySelector("#playerTwoCard");
const playerOnePosition = document.querySelector("#playerOnePosition");
const playerTwoPosition = document.querySelector("#playerTwoPosition");
const svgNamespace = "http://www.w3.org/2000/svg";

const ladders = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const snakes = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

const questionBank = [
  { topic: "Penjumlahan", text: "12 + 8 = ...", answer: 20, options: [18, 20, 21, 22] },
  { topic: "Penjumlahan", text: "25 + 16 = ...", answer: 41, options: [39, 40, 41, 43] },
  { topic: "Pengurangan", text: "48 - 19 = ...", answer: 29, options: [27, 28, 29, 31] },
  { topic: "Pengurangan", text: "70 - 35 = ...", answer: 35, options: [25, 30, 35, 45] },
  { topic: "Perkalian", text: "7 x 6 = ...", answer: 42, options: [36, 40, 42, 48] },
  { topic: "Perkalian", text: "9 x 4 = ...", answer: 36, options: [32, 35, 36, 40] },
  { topic: "Pembagian", text: "56 : 7 = ...", answer: 8, options: [6, 7, 8, 9] },
  { topic: "Pembagian", text: "45 : 5 = ...", answer: 9, options: [7, 8, 9, 10] },
  { topic: "Pecahan", text: "1/2 dari 18 adalah ...", answer: 9, options: [6, 8, 9, 12] },
  { topic: "Pecahan", text: "1/4 dari 24 adalah ...", answer: 6, options: [4, 5, 6, 8] },
  { topic: "Soal Cerita", text: "Rani punya 15 pensil. Ia membeli 7 lagi. Jumlah pensil Rani adalah ...", answer: 22, options: [20, 21, 22, 23] },
  { topic: "Soal Cerita", text: "Ada 6 kotak. Tiap kotak berisi 5 kelereng. Jumlah kelereng semuanya ...", answer: 30, options: [25, 30, 35, 40] },
  { topic: "Satuan", text: "3 lusin sama dengan ... buah", answer: 36, options: [24, 30, 36, 40] },
  { topic: "Bilangan", text: "Bilangan genap setelah 46 adalah ...", answer: 48, options: [47, 48, 49, 50] },
  { topic: "Urutan", text: "Angka yang lebih besar dari 68 dan lebih kecil dari 70 adalah ...", answer: 69, options: [67, 68, 69, 70] },
];

const players = [
  { name: "Pemain 1", position: 1, tokenClass: "token-one" },
  { name: "Pemain 2", position: 1, tokenClass: "token-two" },
];

let currentPlayer = 0;
let pendingRoll = 0;
let activeQuestion = null;
let acceptingAnswer = false;
let gameOver = false;

function createBoard() {
  board.innerHTML = '<svg class="board-art" id="boardArt" viewBox="0 0 1000 1000" aria-hidden="true"></svg>';
  for (let row = 9; row >= 0; row -= 1) {
    const numbers = [];
    for (let col = 0; col < 10; col += 1) {
      const base = row * 10 + 1;
      numbers.push(row % 2 === 0 ? base + col : base + 9 - col);
    }

    numbers.forEach((number) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.number = number;
      cell.innerHTML = `
        <span class="cell-number">${number}</span>
        <span class="tokens" aria-hidden="true"></span>
      `;

      const mark = document.createElement("span");
      mark.className = "jump-mark";
      if (ladders[number]) {
        mark.textContent = "UP";
        mark.style.color = "var(--green)";
        mark.title = `Tangga ke ${ladders[number]}`;
      }
      if (snakes[number]) {
        mark.textContent = "DN";
        mark.style.color = "var(--red)";
        mark.title = `Ular ke ${snakes[number]}`;
      }
      if (mark.textContent) {
        cell.appendChild(mark);
      }
      board.appendChild(cell);
    });
  }
  drawBoardArt();
}

function numberToPoint(number) {
  const rowFromBottom = Math.floor((number - 1) / 10);
  const column = rowFromBottom % 2 === 0 ? (number - 1) % 10 : 9 - ((number - 1) % 10);

  return {
    x: column * 100 + 50,
    y: 950 - rowFromBottom * 100,
  };
}

function createSvgElement(type, attributes = {}) {
  const element = document.createElementNS(svgNamespace, type);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  return element;
}

function drawBoardArt() {
  const art = document.querySelector("#boardArt");
  art.innerHTML = "";

  Object.entries(ladders).forEach(([start, end], index) => {
    drawLadder(art, Number(start), end, index);
  });

  Object.entries(snakes).forEach(([start, end], index) => {
    drawSnake(art, Number(start), end, index);
  });
}

function drawLadder(art, start, end, index) {
  const from = numberToPoint(start);
  const to = numberToPoint(Number(end));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const offsetX = (-dy / length) * 18;
  const offsetY = (dx / length) * 18;
  const railAStart = { x: from.x + offsetX, y: from.y + offsetY };
  const railAEnd = { x: to.x + offsetX, y: to.y + offsetY };
  const railBStart = { x: from.x - offsetX, y: from.y - offsetY };
  const railBEnd = { x: to.x - offsetX, y: to.y - offsetY };

  const group = createSvgElement("g", { class: "ladder-group" });
  group.appendChild(line(railAStart, railAEnd, "ladder-rail"));
  group.appendChild(line(railBStart, railBEnd, "ladder-rail"));

  const rungs = Math.max(3, Math.floor(length / 82));
  for (let rung = 1; rung <= rungs; rung += 1) {
    const progress = rung / (rungs + 1);
    const rungA = {
      x: railAStart.x + (railAEnd.x - railAStart.x) * progress,
      y: railAStart.y + (railAEnd.y - railAStart.y) * progress,
    };
    const rungB = {
      x: railBStart.x + (railBEnd.x - railBStart.x) * progress,
      y: railBStart.y + (railBEnd.y - railBStart.y) * progress,
    };
    group.appendChild(line(rungA, rungB, "ladder-rung"));
  }

  group.style.opacity = index % 2 === 0 ? "0.94" : "0.86";
  art.appendChild(group);
}

function line(start, end, className) {
  return createSvgElement("line", {
    class: className,
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
  });
}

function drawSnake(art, start, end, index) {
  const from = numberToPoint(start);
  const to = numberToPoint(Number(end));
  const middle = {
    x: (from.x + to.x) / 2 + (index % 2 === 0 ? 82 : -82),
    y: (from.y + to.y) / 2 + (index % 3 === 0 ? -34 : 34),
  };
  const color = ["#16a34a", "#ef4444", "#7c3aed", "#0ea5e9"][index % 4];
  const pathData = `M ${from.x} ${from.y} Q ${middle.x} ${middle.y} ${to.x} ${to.y}`;

  const group = createSvgElement("g", { class: "snake-group" });
  group.appendChild(
    createSvgElement("path", {
      class: "snake-body",
      d: pathData,
      stroke: color,
      "stroke-width": 28,
    }),
  );
  group.appendChild(
    createSvgElement("path", {
      class: "snake-belly",
      d: pathData,
    }),
  );
  group.appendChild(
    createSvgElement("ellipse", {
      class: "snake-head",
      cx: from.x,
      cy: from.y,
      rx: 27,
      ry: 21,
      fill: color,
      transform: `rotate(${snakeHeadAngle(from, middle)} ${from.x} ${from.y})`,
    }),
  );
  group.appendChild(createSvgElement("circle", { class: "snake-eye", cx: from.x - 8, cy: from.y - 6, r: 3.5 }));
  group.appendChild(createSvgElement("circle", { class: "snake-eye", cx: from.x + 8, cy: from.y - 6, r: 3.5 }));
  group.appendChild(
    createSvgElement("path", {
      class: "snake-tongue",
      d: `M ${from.x} ${from.y + 14} L ${from.x} ${from.y + 27} M ${from.x} ${from.y + 27} L ${from.x - 8} ${from.y + 35} M ${from.x} ${from.y + 27} L ${from.x + 8} ${from.y + 35}`,
    }),
  );
  group.appendChild(createSvgElement("circle", { cx: to.x, cy: to.y, r: 10, fill: color, opacity: 0.9 }));
  art.appendChild(group);
}

function snakeHeadAngle(from, middle) {
  return (Math.atan2(middle.y - from.y, middle.x - from.x) * 180) / Math.PI + 90;
}

function renderTokens() {
  document.querySelectorAll(".tokens").forEach((slot) => {
    slot.innerHTML = "";
  });

  players.forEach((player) => {
    const slot = document.querySelector(`.cell[data-number="${player.position}"] .tokens`);
    const token = document.createElement("span");
    token.className = `player-token ${player.tokenClass}`;
    token.title = `${player.name} di kotak ${player.position}`;
    slot.appendChild(token);
  });

  playerOnePosition.textContent = `Kotak ${players[0].position}`;
  playerTwoPosition.textContent = `Kotak ${players[1].position}`;
  playerOneCard.classList.toggle("active", currentPlayer === 0);
  playerTwoCard.classList.toggle("active", currentPlayer === 1);
  turnLabel.textContent = gameOver ? "Permainan selesai" : `Giliran ${players[currentPlayer].name}`;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function rollDice() {
  if (gameOver || acceptingAnswer) return;

  pendingRoll = Math.floor(Math.random() * 6) + 1;
  diceFace.dataset.value = pendingRoll;
  diceFace.setAttribute("aria-label", `Dadu menunjukkan angka ${pendingRoll}`);
  diceFace.classList.remove("rolling");
  window.requestAnimationFrame(() => {
    diceFace.classList.add("rolling");
  });
  rollButton.disabled = true;
  activeQuestion = randomItem(questionBank);
  acceptingAnswer = true;

  statusText.textContent = `${players[currentPlayer].name} mendapat angka ${pendingRoll}. Jawab benar untuk maju ${pendingRoll} kotak.`;
  questionTopic.textContent = activeQuestion.topic;
  questionText.textContent = activeQuestion.text;
  answers.innerHTML = "";

  shuffle(activeQuestion.options).forEach((option) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(option, button));
    answers.appendChild(button);
  });

  questionCard.hidden = false;
}

function checkAnswer(selectedAnswer, button) {
  if (!acceptingAnswer) return;

  acceptingAnswer = false;
  const isCorrect = Number(selectedAnswer) === activeQuestion.answer;
  button.classList.add(isCorrect ? "correct" : "wrong");
  answers.querySelectorAll("button").forEach((answerButton) => {
    answerButton.disabled = true;
    if (Number(answerButton.textContent) === activeQuestion.answer) {
      answerButton.classList.add("correct");
    }
  });

  window.setTimeout(() => {
    if (isCorrect) {
      advanceCurrentPlayer();
    } else {
      statusText.textContent = `Belum tepat. Jawaban benar: ${activeQuestion.answer}. Giliran berpindah.`;
      showToast("Tidak apa-apa, coba lagi di giliran berikutnya.");
      nextTurn();
    }
  }, 650);
}

function advanceCurrentPlayer() {
  const player = players[currentPlayer];
  const target = player.position + pendingRoll;

  if (target > 100) {
    statusText.textContent = `${player.name} butuh angka pas untuk mencapai 100. Giliran berpindah.`;
    showToast("Angkanya melewati 100, tunggu lemparan berikutnya.");
    nextTurn();
    return;
  }

  player.position = target;
  renderTokens();

  window.setTimeout(() => {
    applyJumpOrFinish(player);
  }, 420);
}

function applyJumpOrFinish(player) {
  if (player.position === 100) {
    finishGame(player);
    return;
  }

  const ladderTarget = ladders[player.position];
  const snakeTarget = snakes[player.position];

  if (ladderTarget) {
    player.position = ladderTarget;
    statusText.textContent = `${player.name} menemukan tangga dan naik ke kotak ${ladderTarget}.`;
    showToast("Hebat, naik tangga!");
  } else if (snakeTarget) {
    player.position = snakeTarget;
    statusText.textContent = `${player.name} terkena ular dan turun ke kotak ${snakeTarget}.`;
    showToast("Turun dulu, lalu bangkit lagi.");
  } else {
    statusText.textContent = `${player.name} maju ke kotak ${player.position}.`;
  }

  renderTokens();

  if (player.position === 100) {
    finishGame(player);
    return;
  }

  nextTurn();
}

function finishGame(player) {
  gameOver = true;
  questionCard.hidden = true;
  rollButton.disabled = true;
  statusText.textContent = `${player.name} menang! Tekan tombol ulang untuk bermain lagi.`;
  showToast(`${player.name} mencapai kotak 100. Selamat!`);
  renderTokens();
}

function nextTurn() {
  window.setTimeout(() => {
    if (gameOver) return;
    currentPlayer = currentPlayer === 0 ? 1 : 0;
    questionCard.hidden = true;
    rollButton.disabled = false;
    pendingRoll = 0;
    activeQuestion = null;
    diceFace.dataset.value = "1";
    diceFace.setAttribute("aria-label", "Dadu menunjukkan angka 1");
    renderTokens();
  }, 700);
}

function resetGame() {
  players.forEach((player) => {
    player.position = 1;
  });
  currentPlayer = 0;
  pendingRoll = 0;
  activeQuestion = null;
  acceptingAnswer = false;
  gameOver = false;
  questionCard.hidden = true;
  rollButton.disabled = false;
  diceFace.dataset.value = "1";
  diceFace.setAttribute("aria-label", "Dadu menunjukkan angka 1");
  statusText.textContent = "Jawab soal dengan benar setelah dadu dilempar agar bidak bisa maju.";
  renderTokens();
  showToast("Permainan dimulai ulang.");
}

rollButton.addEventListener("click", rollDice);
resetButton.addEventListener("click", resetGame);

createBoard();
renderTokens();
