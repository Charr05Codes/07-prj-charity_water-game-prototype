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

const cleanWaterFacts = [
  "Clean water helps communities stay healthy and thrive.",
  "Access to safe drinking water helps children spend more time learning.",
  "Clean water access can reduce the time families spend collecting water."
];

const levels = [
  {
    timeLimit: 90,
    layout: [
      ["elbow", "straight", "straight", "straight", "elbow"],
      ["straight", "elbow", "elbow", "elbow", "straight"],
      ["straight", "straight", "straight", "elbow", "straight"],
      ["elbow", "elbow", "straight", "elbow", "straight"],
      ["straight", "straight", "straight", "straight", "straight"]
    ],
    solution: [
      [0, 90, 90, 90, 180],
      [0, 0, 180, 270, 0],
      [0, 90, 0, 180, 0],
      [90, 180, 90, 0, 0],
      [90, 0, 90, 0, 0]
    ],
    scramble: [
      [0, 0, 90, 0, 90],
      [90, 90, 0, 90, 0],
      [0, 90, 180, 90, 90],
      [90, 0, 90, 180, 0],
      [90, 0, 90, 180, 0]
    ]
  },
  {
    timeLimit: 75,
    layout: [
      ["elbow", "straight", "straight", "straight", "elbow"],
      ["straight", "elbow", "elbow", "elbow", "straight"],
      ["straight", "straight", "straight", "elbow", "straight"],
      ["elbow", "elbow", "straight", "elbow", "straight"],
      ["straight", "straight", "straight", "straight", "straight"]
    ],
    solution: [
      [0, 90, 90, 90, 180],
      [0, 90, 0, 180, 0],
      [0, 90, 0, 90, 0],
      [180, 0, 90, 270, 0],
      [90, 0, 90, 0, 0]
    ],
    scramble: [
      [180, 90, 270, 90, 180],
      [90, 180, 90, 270, 180],
      [270, 180, 270, 0, 180],
      [90, 270, 180, 90, 180],
      [0, 180, 270, 180, 180]
    ]
  },
  {
    timeLimit: 60,
    layout: [
      ["elbow", "straight", "straight", "straight", "elbow"],
      ["straight", "elbow", "elbow", "elbow", "straight"],
      ["straight", "straight", "straight", "elbow", "straight"],
      ["elbow", "elbow", "straight", "elbow", "straight"],
      ["straight", "straight", "straight", "straight", "straight"]
    ],
    solution: [
      [0, 90, 90, 90, 180],
      [0, 180, 90, 0, 0],
      [0, 90, 0, 180, 0],
      [90, 270, 90, 180, 0],
      [90, 180, 90, 180, 0]
    ],
    scramble: [
      [270, 180, 270, 180, 90],
      [180, 270, 180, 270, 180],
      [270, 180, 270, 180, 270],
      [180, 270, 180, 270, 180],
      [270, 180, 270, 180, 180]
    ]
  }
];

const gameState = {
  currentLevel: 1,
  score: 0,
  timeRemaining: levels[0].timeLimit,
  gameStarted: false,
  gameActive: false,
  levelCompleted: false,
  board: [],
  timerInterval: null,
  completedLevels: new Set()
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
let overlayFact;
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
  overlayFact = document.getElementById("overlay-fact");
  overlayAction = document.getElementById("overlay-action");

  startButton.addEventListener("click", startLevel);
  checkButton.addEventListener("click", handleCheckPipes);
  restartButton.addEventListener("click", restartLevel);
  overlayAction.addEventListener("click", handleOverlayAction);

  restartLevelState();
  renderBoard();
  updateDisplay();

  // Developer-only helper output so level solvability can be checked quickly.
  const allSolvable = validatePredefinedSolutions();
  console.log(`Level solvability check: ${allSolvable ? "PASS" : "FAIL"}`);
}

function restartLevelState() {
  const levelData = levels[gameState.currentLevel - 1];
  gameState.timeRemaining = levelData.timeLimit;
  gameState.gameActive = false;
  gameState.levelCompleted = false;
  gameState.board = createBoardFromLevel(levelData, false);
  clearHighlightedPath();
  hideOverlay();
}

function createBoardFromLevel(levelData, useSolution) {
  return levelData.layout.map((row, rowIndex) =>
    row.map((pipeType, colIndex) => {
      const baseRotation = levelData.solution[rowIndex][colIndex];
      const extraRotation = useSolution ? 0 : levelData.scramble[rowIndex][colIndex];
      return {
        type: pipeType,
        rotation: (baseRotation + extraRotation) % 360
      };
    })
  );
}

// Draw all tiles from the board array and make each one clickable.
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
      tile.querySelector(".pipe-graphic").style.transform = `rotate(${pipe.rotation}deg)`;
      tile.disabled = !gameState.gameActive;

      tile.addEventListener("click", () => rotatePipe(row, col));
      boardElement.appendChild(tile);
    }
  }
}

function getPipeSvg(type) {
  if (type === "straight") {
    return `
      <svg class="pipe-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path class="pipe-main" d="M50 8 L50 92"></path>
        <path class="pipe-inner" d="M50 8 L50 92"></path>
      </svg>
    `;
  }

  return `
    <svg class="pipe-graphic" viewBox="0 0 100 100" aria-hidden="true">
      <path class="pipe-main" d="M50 8 L50 50 L92 50"></path>
      <path class="pipe-inner" d="M50 8 L50 50 L92 50"></path>
    </svg>
  `;
}

// Rotate one tile clockwise by 90 degrees and refresh only that tile view.
function rotatePipe(row, col) {
  if (!gameState.gameActive || gameState.levelCompleted) {
    return;
  }

  const pipe = gameState.board[row][col];
  pipe.rotation = (pipe.rotation + 90) % 360;

  const tileIndex = row * 5 + col;
  const tileElement = boardElement.children[tileIndex];
  const graphic = tileElement.querySelector(".pipe-graphic");
  graphic.style.transform = `rotate(${pipe.rotation}deg)`;

  tileElement.classList.remove("connected");
  setStatusMessage("Keep going! Rotate pipes to build a full path.", "");
}

function startLevel() {
  gameState.gameStarted = true;
  restartLevelState();
  gameState.gameActive = true;
  renderBoard();
  updateDisplay();
  updateControls();
  setStatusMessage("Level started! Connect source to bucket.", "");
  startTimer();
}

function restartLevel() {
  stopTimer();
  restartLevelState();
  gameState.gameActive = true;
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

    if (gameState.timeRemaining <= 0) {
      gameState.timeRemaining = 0;
      updateDisplay();
      handleTimeUp();
      return;
    }

    updateDisplay();
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

// Determine pipe openings based on type and clockwise rotation.
function getPipeOpenings(pipe) {
  if (pipe.type === "straight") {
    if (pipe.rotation % 180 === 0) {
      return ["top", "bottom"];
    }

    return ["left", "right"];
  }

  const elbowOpenings = ["top", "right"];
  const rotationSteps = (pipe.rotation % 360) / 90;
  return elbowOpenings.map((direction) => rotateDirection(direction, rotationSteps));
}

function rotateDirection(direction, steps) {
  const startIndex = DIRECTIONS.indexOf(direction);
  const newIndex = (startIndex + steps) % DIRECTIONS.length;
  return DIRECTIONS[newIndex];
}

function handleCheckPipes() {
  const result = checkConnections(gameState.board);

  if (result.success) {
    completeLevel(result.path);
  } else {
    setStatusMessage("Not quite! Some pipes are disconnected. Keep trying!", "error");
    clearHighlightedPath();
  }
}

// Follow one deterministic route from source to bucket while validating connections.
function checkConnections(board) {
  let row = 0;
  let col = 0;
  let incomingDirection = "top";
  const visitedStates = new Set();
  const path = [];

  while (true) {
    if (!isInsideBoard(row, col)) {
      return { success: false, path: [] };
    }

    const tileStateKey = `${row}-${col}-${incomingDirection}`;
    if (visitedStates.has(tileStateKey)) {
      return { success: false, path };
    }

    visitedStates.add(tileStateKey);
    path.push({ row, col });

    const pipe = board[row][col];
    const openings = getPipeOpenings(pipe);

    if (!openings.includes(incomingDirection)) {
      return { success: false, path };
    }

    const outgoingDirection = openings.find((side) => side !== incomingDirection);
    if (!outgoingDirection) {
      return { success: false, path };
    }

    const nextRow = row + DIRECTION_OFFSETS[outgoingDirection].row;
    const nextCol = col + DIRECTION_OFFSETS[outgoingDirection].col;

    if (!isInsideBoard(nextRow, nextCol)) {
      const reachedBucketExit = row === 4 && col === 4 && outgoingDirection === "bottom";
      return reachedBucketExit ? { success: true, path } : { success: false, path };
    }

    const nextPipe = board[nextRow][nextCol];
    const incomingToNext = OPPOSITE_DIRECTION[outgoingDirection];
    const nextOpenings = getPipeOpenings(nextPipe);

    if (!nextOpenings.includes(incomingToNext)) {
      return { success: false, path };
    }

    row = nextRow;
    col = nextCol;
    incomingDirection = incomingToNext;

    if (path.length > 25) {
      return { success: false, path };
    }
  }
}

function isInsideBoard(row, col) {
  return row >= 0 && row < 5 && col >= 0 && col < 5;
}

function clearHighlightedPath() {
  Array.from(boardElement.children).forEach((tile) => tile.classList.remove("connected"));
}

function animateSuccessfulPath(path) {
  clearHighlightedPath();

  path.forEach((step, index) => {
    window.setTimeout(() => {
      const tileIndex = step.row * 5 + step.col;
      const tileElement = boardElement.children[tileIndex];
      if (tileElement) {
        tileElement.classList.add("connected");
      }
    }, index * 90);
  });
}

// On success: stop timer, award points once, and show educational feedback.
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

  animateSuccessfulPath(path);
  setStatusMessage("Great work! Water reaches the bucket.", "success");
  updateDisplay();

  const factIndex = (gameState.currentLevel - 1) % cleanWaterFacts.length;
  const hasNextLevel = gameState.currentLevel < levels.length;

  showOverlay({
    title: hasNextLevel ? "Level Complete!" : "Congratulations! You completed Water Works!",
    message: hasNextLevel
      ? `You connected the pipes for Level ${gameState.currentLevel}.`
      : `Total score: ${gameState.score}. Thank you for learning why clean water access matters.`,
    fact: cleanWaterFacts[factIndex],
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

  showOverlay({
    title: "Time's Up!",
    message: "You ran out of time for this level.",
    fact: cleanWaterFacts[(gameState.currentLevel - 1) % cleanWaterFacts.length],
    actionLabel: "Retry",
    actionType: "retry"
  });

  overlayPoints.textContent = "Points earned: 0";
}

function showOverlay({ title, message, fact, actionLabel, actionType }) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlayFact.textContent = fact;
  overlayAction.textContent = actionLabel;
  overlayAction.dataset.action = actionType;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
  overlayAction.dataset.action = "";
}

function handleOverlayAction() {
  const action = overlayAction.dataset.action;

  if (action === "next") {
    gameState.currentLevel += 1;
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
    restartLevelState();
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

function validatePredefinedSolutions() {
  return levels.every((levelData) => {
    const solvedBoard = createBoardFromLevel(levelData, true);
    const result = checkConnections(solvedBoard);
    return result.success;
  });
}

window.validateLevelSolutions = validatePredefinedSolutions;

document.addEventListener("DOMContentLoaded", initGame);
