const BOARD_SIZE = 5;
const DIRECTIONS = ["top", "right", "bottom", "left"];
const DIRECTION_OFFSETS = {
  top: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  bottom: { row: 1, col: 0 },
  left: { row: 0, col: -1 }
};
const OPPOSITE_DIRECTION = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
};

const levels = [{ timeLimit: 90 }, { timeLimit: 75 }, { timeLimit: 60 }];
const cleanWaterFacts = [
  "Clean water helps communities stay healthy and thrive.",
  "Access to safe drinking water helps children spend more time learning.",
  "Clean water access can reduce the time families spend collecting water."
];

const gameState = {
  currentLevel: 1,
  score: 0,
  timeRemaining: levels[0].timeLimit,
  gameStarted: false,
  gameActive: false,
  levelCompleted: false,
  board: [],
  solvedBoard: [],
  startingBoard: [],
  timerInterval: null,
  completedLevels: new Set(),
  previousSignature: ""
};

let boardElement;
let levelIndicatorElement;
let scoreIndicatorElement;
let timerElement;
let statusMessageElement;
let startButton;
let checkButton;
let restartButton;
let overlay;
let overlayTitle;
let overlayMessage;
let overlayPoints;
let overlayTotalScore;
let overlayFact;
let overlayFactCard;
let overlayAction;

function initGame() {
  boardElement = document.getElementById("board");
  levelIndicatorElement = document.getElementById("level-indicator");
  scoreIndicatorElement = document.getElementById("score-indicator");
  timerElement = document.getElementById("timer");
  statusMessageElement = document.getElementById("status-message");
  startButton = document.getElementById("start-button");
  checkButton = document.getElementById("check-button");
  restartButton = document.getElementById("restart-button");
  overlay = document.getElementById("overlay");
  overlayTitle = document.getElementById("overlay-title");
  overlayMessage = document.getElementById("overlay-message");
  overlayPoints = document.getElementById("overlay-points");
  overlayTotalScore = document.getElementById("overlay-total-score");
  overlayFact = document.getElementById("overlay-fact");
  overlayFactCard = document.getElementById("overlay-fact-card");
  overlayAction = document.getElementById("overlay-action");

  startButton.addEventListener("click", startLevel);
  checkButton.addEventListener("click", handleCheckPipes);
  restartButton.addEventListener("click", restartLevel);
  overlayAction.addEventListener("click", handleOverlayAction);

  createNewLevel();
  renderBoard();
  updateDisplay();
  updateControls();
}

function createNewLevel() {
  const levelData = levels[gameState.currentLevel - 1];
  let puzzle;
  let attempts = 0;

  do {
    puzzle = generatePuzzle();
    attempts += 1;
  } while (puzzle.signature === gameState.previousSignature && attempts < 20);

  if (puzzle.signature === gameState.previousSignature) {
    puzzle = changeUnusedPipe(puzzle);
  }

  gameState.solvedBoard = cloneBoard(puzzle.solvedBoard);
  gameState.startingBoard = cloneBoard(puzzle.scrambledBoard);
  gameState.board = cloneBoard(puzzle.scrambledBoard);
  gameState.previousSignature = puzzle.signature;
  gameState.timeRemaining = levelData.timeLimit;
  gameState.gameActive = false;
  gameState.levelCompleted = false;
  clearHighlightedPath();
  hideOverlay();
}

function generatePuzzle() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const path = generatePath();
    const solvedBoard = createSolvedBoard(path);
    const scrambledBoard = cloneBoard(solvedBoard);

    scrambledBoard.forEach((row) => row.forEach((pipe) => {
      pipe.rotation = (pipe.rotation + randomRotation()) % 360;
      pipe.visualRotation = pipe.rotation;
    }));

    if (checkConnections(scrambledBoard).success) {
      const pathPipe = scrambledBoard[path[0].row][path[0].col];
      pathPipe.rotation = (pathPipe.rotation + 90) % 360;
      pathPipe.visualRotation += 90;
    }

    const solvedResult = checkConnections(solvedBoard);
    const scrambledResult = checkConnections(scrambledBoard);
    if (solvedResult.success && !scrambledResult.success) {
      return { solvedBoard, scrambledBoard, path, signature: boardSignature(scrambledBoard) };
    }
  }

  throw new Error("Unable to generate a valid puzzle after 20 attempts.");
}

function changeUnusedPipe(puzzle) {
  const pathPositions = new Set(puzzle.path.map((step) => `${step.row}-${step.col}`));
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!pathPositions.has(`${row}-${col}`)) {
        const pipe = puzzle.scrambledBoard[row][col];
        pipe.rotation = (pipe.rotation + 90) % 360;
        pipe.visualRotation += 90;
        puzzle.signature = boardSignature(puzzle.scrambledBoard);
        return puzzle;
      }
    }
  }
  throw new Error("Unable to create a distinct puzzle layout.");
}

function generatePath() {
  // A shuffled set of four right and four down moves always reaches the bucket without revisiting tiles.
  const moves = ["right", "right", "right", "right", "bottom", "bottom", "bottom", "bottom"];
  shuffle(moves);

  const path = [{ row: 0, col: 0 }];
  let row = 0;
  let col = 0;
  moves.forEach((direction) => {
    row += DIRECTION_OFFSETS[direction].row;
    col += DIRECTION_OFFSETS[direction].col;
    path.push({ row, col });
  });
  return path;
}

function createSolvedBoard(path) {
  const pathPositions = new Map(path.map((step, index) => [`${step.row}-${step.col}`, index]));
  const board = Array.from({ length: BOARD_SIZE }, () => []);

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const pathIndex = pathPositions.get(`${row}-${col}`);
      if (pathIndex === undefined) {
        board[row][col] = createPipe(Math.random() < 0.5 ? "straight" : "elbow", randomRotation());
        continue;
      }

      const previous = path[pathIndex - 1];
      const next = path[pathIndex + 1];
      const entry = previous ? directionBetween(path[pathIndex], previous) : "top";
      const exit = next ? directionBetween(path[pathIndex], next) : "bottom";
      const type = isOppositePair(entry, exit) ? "straight" : "elbow";
      board[row][col] = createPipe(type, rotationForOpenings(type, [entry, exit]));
    }
  }
  return board;
}

function createPipe(type, rotation) {
  return { type, rotation, visualRotation: rotation };
}

function directionBetween(from, to) {
  const rowDelta = to.row - from.row;
  const colDelta = to.col - from.col;
  return DIRECTIONS.find((direction) => {
    const offset = DIRECTION_OFFSETS[direction];
    return offset.row === rowDelta && offset.col === colDelta;
  });
}

function isOppositePair(first, second) {
  return OPPOSITE_DIRECTION[first] === second;
}

function rotationForOpenings(type, desiredOpenings) {
  for (let rotation = 0; rotation < 360; rotation += 90) {
    if (desiredOpenings.every((opening) => getPipeOpenings({ type, rotation }).includes(opening))) {
      return rotation;
    }
  }
  throw new Error("Unable to orient generated pipe.");
}

function randomRotation() {
  return Math.floor(Math.random() * 4) * 90;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function cloneBoard(board) {
  return board.map((row) => row.map((pipe) => ({ ...pipe })));
}

function boardSignature(board) {
  return board.flat().map((pipe) => `${pipe.type[0]}${pipe.rotation}`).join(":");
}

function renderBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < gameState.board.length; row += 1) {
    for (let col = 0; col < gameState.board[row].length; col += 1) {
      const tile = document.createElement("button");
      const pipe = gameState.board[row][col];
      tile.type = "button";
      tile.className = "pipe-tile";
      tile.setAttribute("role", "gridcell");
      tile.setAttribute("aria-label", `Pipe row ${row + 1}, column ${col + 1}`);
      tile.dataset.row = row;
      tile.dataset.col = col;
      tile.innerHTML = getPipeSvg(pipe.type);
      tile.querySelector(".pipe-graphic").style.transform = `rotate(${pipe.visualRotation}deg)`;
      tile.disabled = !gameState.gameActive;
      tile.addEventListener("click", () => rotatePipe(row, col));
      boardElement.appendChild(tile);
    }
  }
}

function getPipeSvg(type) {
  if (type === "straight") {
    return `<svg class="pipe-graphic" viewBox="0 0 100 100" aria-hidden="true"><path class="pipe-main" d="M50 8 L50 92"></path><path class="pipe-inner" d="M50 8 L50 92"></path></svg>`;
  }
  return `<svg class="pipe-graphic" viewBox="0 0 100 100" aria-hidden="true"><path class="pipe-main" d="M50 8 L50 50 L92 50"></path><path class="pipe-inner" d="M50 8 L50 50 L92 50"></path></svg>`;
}

function rotatePipe(row, col) {
  if (!gameState.gameActive || gameState.levelCompleted) {
    return;
  }
  const pipe = gameState.board[row][col];
  pipe.rotation = (pipe.rotation + 90) % 360;
  pipe.visualRotation += 90;
  const tileElement = boardElement.children[row * BOARD_SIZE + col];
  tileElement.querySelector(".pipe-graphic").style.transform = `rotate(${pipe.visualRotation}deg)`;
  tileElement.classList.remove("connected");
  setStatusMessage("Keep going! Rotate pipes to build a full path.", "");
}

function startLevel() {
  gameState.gameStarted = true;
  gameState.gameActive = true;
  gameState.levelCompleted = false;
  gameState.board = cloneBoard(gameState.startingBoard);
  gameState.timeRemaining = levels[gameState.currentLevel - 1].timeLimit;
  hideOverlay();
  renderBoard();
  updateDisplay();
  updateControls();
  setStatusMessage("Level started! Connect source to bucket.", "");
  startTimer();
}

function restartLevel() {
  stopTimer();
  gameState.board = cloneBoard(gameState.startingBoard);
  gameState.timeRemaining = levels[gameState.currentLevel - 1].timeLimit;
  gameState.gameActive = true;
  gameState.levelCompleted = false;
  hideOverlay();
  clearHighlightedPath();
  renderBoard();
  updateDisplay();
  updateControls();
  setStatusMessage("Level restarted. Try again!", "");
  startTimer();
}

function updateDisplay() {
  levelIndicatorElement.textContent = String(gameState.currentLevel);
  scoreIndicatorElement.textContent = String(gameState.score);
  timerElement.textContent = formatTime(gameState.timeRemaining);
  timerElement.classList.toggle("warning", gameState.timeRemaining <= 20 && gameState.timeRemaining > 10);
  timerElement.classList.toggle("critical", gameState.timeRemaining <= 10);
}

function updateControls() {
  startButton.disabled = gameState.gameActive;
  checkButton.disabled = !gameState.gameActive;
  restartButton.disabled = !gameState.gameStarted;
}

function startTimer() {
  stopTimer();
  gameState.timerInterval = setInterval(() => {
    gameState.timeRemaining -= 1;
    updateDisplay();
    if (gameState.timeRemaining <= 0) {
      gameState.timeRemaining = 0;
      updateDisplay();
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getPipeOpenings(pipe) {
  const baseOpenings = pipe.type === "straight" ? ["top", "bottom"] : ["top", "right"];
  const rotationSteps = ((((pipe.rotation % 360) + 360) % 360) / 90);
  return baseOpenings.map((direction) => rotateDirection(direction, rotationSteps));
}

function rotateDirection(direction, steps) {
  const startIndex = DIRECTIONS.indexOf(direction);
  return DIRECTIONS[(startIndex + steps) % DIRECTIONS.length];
}

function handleCheckPipes() {
  const result = checkConnections(gameState.board);
  if (result.success) {
    completeLevel(result.path);
  } else {
    setStatusMessage("Not quite! Check the pipe connections and keep trying.", "error");
    clearHighlightedPath();
  }
}

function checkConnections(board) {
  // Follow the only route from the source, requiring each neighboring pipe to face back into the route.
  let row = 0;
  let col = 0;
  let incomingDirection = "top";
  const visited = new Set();
  const path = [];

  while (isInsideBoard(row, col)) {
    const positionKey = `${row}-${col}`;
    if (visited.has(positionKey)) {
      return { success: false, path };
    }
    visited.add(positionKey);
    path.push({ row, col });

    const openings = getPipeOpenings(board[row][col]);
    if (!openings.includes(incomingDirection)) {
      return { success: false, path };
    }
    const outgoingDirection = openings.find((direction) => direction !== incomingDirection);
    if (!outgoingDirection) {
      return { success: false, path };
    }
    if (row === BOARD_SIZE - 1 && col === BOARD_SIZE - 1 && outgoingDirection === "bottom") {
      return { success: true, path };
    }

    const nextRow = row + DIRECTION_OFFSETS[outgoingDirection].row;
    const nextCol = col + DIRECTION_OFFSETS[outgoingDirection].col;
    if (!isInsideBoard(nextRow, nextCol)) {
      return { success: false, path };
    }
    const incomingToNext = OPPOSITE_DIRECTION[outgoingDirection];
    if (!getPipeOpenings(board[nextRow][nextCol]).includes(incomingToNext)) {
      return { success: false, path };
    }
    row = nextRow;
    col = nextCol;
    incomingDirection = incomingToNext;
  }
  return { success: false, path };
}

function isInsideBoard(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function clearHighlightedPath() {
  if (boardElement) {
    Array.from(boardElement.children).forEach((tile) => tile.classList.remove("connected"));
  }
}

function animateSuccessfulPath(path) {
  clearHighlightedPath();
  path.forEach((step, index) => {
    window.setTimeout(() => {
      const tile = boardElement.children[step.row * BOARD_SIZE + step.col];
      if (tile) {
        tile.classList.add("connected");
      }
    }, index * 90);
  });
}

function completeLevel(path) {
  stopTimer();
  gameState.gameActive = false;
  gameState.levelCompleted = true;
  updateControls();

  if (!gameState.completedLevels.has(gameState.currentLevel)) {
    const pointsEarned = 100 + gameState.timeRemaining * 10;
    gameState.score += pointsEarned;
    gameState.completedLevels.add(gameState.currentLevel);
    overlayPoints.textContent = `Points earned: ${pointsEarned}`;
  } else {
    overlayPoints.textContent = "Points already earned for this level.";
  }
  overlayTotalScore.textContent = `Total score: ${gameState.score}`;

  animateSuccessfulPath(path);
  setStatusMessage("Great work! Water reaches the bucket.", "success");
  updateDisplay();
  const hasNextLevel = gameState.currentLevel < levels.length;
  showOverlay({
    title: "Great Job!",
    message: hasNextLevel
      ? `You connected the pipes for Level ${gameState.currentLevel}.`
      : `Total score: ${gameState.score}. Thank you for learning why clean water access matters.`,
    fact: cleanWaterFacts[(gameState.currentLevel - 1) % cleanWaterFacts.length],
    actionLabel: hasNextLevel ? "Next Level" : "Play Again",
    actionType: hasNextLevel ? "next" : "play-again"
  });
}

function handleTimeUp() {
  stopTimer();
  gameState.gameActive = false;
  gameState.levelCompleted = false;
  clearHighlightedPath();
  updateControls();
  setStatusMessage("Time's Up!", "error");
  overlayPoints.textContent = "Points earned: 0";
  overlayTotalScore.textContent = `Total score: ${gameState.score}`;
  showOverlay({
    title: "Time's Up!",
    message: "You ran out of time for this level.",
    fact: "",
    actionLabel: "Retry",
    actionType: "retry"
  });
}

function showOverlay({ title, message, fact, actionLabel, actionType }) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlayFact.textContent = fact || "";
  overlayFactCard.classList.toggle("hidden", !fact);
  overlayAction.textContent = actionLabel;
  overlayAction.dataset.action = actionType;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  if (overlay) {
    overlay.classList.add("hidden");
    overlayAction.dataset.action = "";
  }
}

function handleOverlayAction() {
  const action = overlayAction.dataset.action;
  if (action === "next") {
    gameState.currentLevel += 1;
    createNewLevel();
    startLevel();
    return;
  }
  if (action === "retry") {
    restartLevel();
    return;
  }
  if (action === "play-again") {
    stopTimer();
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.gameStarted = false;
    gameState.completedLevels.clear();
    createNewLevel();
    renderBoard();
    updateDisplay();
    updateControls();
    setStatusMessage("Press Start Game to play again from Level 1.", "");
  }
}

function setStatusMessage(message, tone) {
  statusMessageElement.textContent = message;
  statusMessageElement.classList.remove("success", "error");
  if (tone) {
    statusMessageElement.classList.add(tone);
  }
}

function runPuzzleGenerationTests(count = 100) {
  let previousSignature = "";
  for (let index = 0; index < count; index += 1) {
    const puzzle = generatePuzzle();
    if (puzzle.solvedBoard.flat().length !== 25) {
      return false;
    }
    if (!checkConnections(puzzle.solvedBoard).success || checkConnections(puzzle.scrambledBoard).success) {
      return false;
    }
    if (puzzle.signature === previousSignature) {
      return false;
    }
    previousSignature = puzzle.signature;
  }
  return true;
}

window.runPuzzleGenerationTests = runPuzzleGenerationTests;
window.getPipeOpenings = getPipeOpenings;
window.checkConnections = checkConnections;

document.addEventListener("DOMContentLoaded", initGame);