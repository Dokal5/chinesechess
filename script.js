const PIECES = {
  general: { red: "帥", black: "將" },
  advisor: { red: "仕", black: "士" },
  elephant: { red: "相", black: "象" },
  horse: { red: "傌", black: "馬" },
  chariot: { red: "俥", black: "車" },
  cannon: { red: "炮", black: "砲" },
  soldier: { red: "兵", black: "卒" },
};

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset");

let board = [];
let currentPlayer = "red";
let selected = null;
let legalMoves = [];
let winner = null;

function emptyBoard() {
  return Array.from({ length: 10 }, () => Array(9).fill(null));
}

function placePiece(r, c, color, type) {
  board[r][c] = { color, type };
}

function setupBoard() {
  board = emptyBoard();

  [0, 9].forEach((row, idx) => {
    const color = idx === 0 ? "black" : "red";
    placePiece(row, 0, color, "chariot");
    placePiece(row, 1, color, "horse");
    placePiece(row, 2, color, "elephant");
    placePiece(row, 3, color, "advisor");
    placePiece(row, 4, color, "general");
    placePiece(row, 5, color, "advisor");
    placePiece(row, 6, color, "elephant");
    placePiece(row, 7, color, "horse");
    placePiece(row, 8, color, "chariot");
  });

  placePiece(2, 1, "black", "cannon");
  placePiece(2, 7, "black", "cannon");
  placePiece(7, 1, "red", "cannon");
  placePiece(7, 7, "red", "cannon");

  [0, 2, 4, 6, 8].forEach((c) => {
    placePiece(3, c, "black", "soldier");
    placePiece(6, c, "red", "soldier");
  });
}

function inside(r, c) {
  return r >= 0 && r < 10 && c >= 0 && c < 9;
}

function inPalace(r, c, color) {
  if (c < 3 || c > 5) return false;
  return color === "red" ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
}

function crossedRiver(r, color) {
  return color === "red" ? r <= 4 : r >= 5;
}

function clearPathStraight(r1, c1, r2, c2) {
  if (r1 !== r2 && c1 !== c2) return false;
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  let r = r1 + dr;
  let c = c1 + dc;
  while (r !== r2 || c !== c2) {
    if (board[r][c]) return false;
    r += dr;
    c += dc;
  }
  return true;
}

function countBetween(r1, c1, r2, c2) {
  if (r1 !== r2 && c1 !== c2) return -1;
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  let r = r1 + dr;
  let c = c1 + dc;
  let count = 0;
  while (r !== r2 || c !== c2) {
    if (board[r][c]) count++;
    r += dr;
    c += dc;
  }
  return count;
}

function findGeneral(color) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.color === color && p.type === "general") return { r, c };
    }
  }
  return null;
}

function generalsFacing() {
  const red = findGeneral("red");
  const black = findGeneral("black");
  if (!red || !black || red.c !== black.c) return false;
  const minR = Math.min(red.r, black.r) + 1;
  const maxR = Math.max(red.r, black.r);
  for (let r = minR; r < maxR; r++) {
    if (board[r][red.c]) return false;
  }
  return true;
}

function pseudoLegalMove(fromR, fromC, toR, toC) {
  if (!inside(toR, toC)) return false;
  const piece = board[fromR][fromC];
  if (!piece) return false;
  const target = board[toR][toC];
  if (target && target.color === piece.color) return false;

  const dr = toR - fromR;
  const dc = toC - fromC;
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);

  switch (piece.type) {
    case "general": {
      if (!inPalace(toR, toC, piece.color)) return false;
      return absR + absC === 1;
    }
    case "advisor":
      return inPalace(toR, toC, piece.color) && absR === 1 && absC === 1;
    case "elephant": {
      if (absR !== 2 || absC !== 2) return false;
      if (piece.color === "red" && toR < 5) return false;
      if (piece.color === "black" && toR > 4) return false;
      const eyeR = fromR + dr / 2;
      const eyeC = fromC + dc / 2;
      return !board[eyeR][eyeC];
    }
    case "horse": {
      if (!((absR === 2 && absC === 1) || (absR === 1 && absC === 2))) return false;
      const blockR = absR === 2 ? fromR + dr / 2 : fromR;
      const blockC = absC === 2 ? fromC + dc / 2 : fromC;
      return !board[blockR][blockC];
    }
    case "chariot":
      return clearPathStraight(fromR, fromC, toR, toC);
    case "cannon": {
      if (fromR !== toR && fromC !== toC) return false;
      const between = countBetween(fromR, fromC, toR, toC);
      return target ? between === 1 : between === 0;
    }
    case "soldier": {
      const forward = piece.color === "red" ? -1 : 1;
      if (dr === forward && dc === 0) return true;
      if (crossedRiver(fromR, piece.color) && dr === 0 && absC === 1) return true;
      return false;
    }
    default:
      return false;
  }
}

function legalMove(fromR, fromC, toR, toC) {
  if (!pseudoLegalMove(fromR, fromC, toR, toC)) return false;

  const moving = board[fromR][fromC];
  const captured = board[toR][toC];
  board[toR][toC] = moving;
  board[fromR][fromC] = null;
  const invalid = generalsFacing();
  board[fromR][fromC] = moving;
  board[toR][toC] = captured;
  return !invalid;
}

function getLegalMoves(r, c) {
  const piece = board[r][c];
  if (!piece || piece.color !== currentPlayer) return [];
  const moves = [];
  for (let rr = 0; rr < 10; rr++) {
    for (let cc = 0; cc < 9; cc++) {
      if (legalMove(r, c, rr, cc)) moves.push([rr, cc]);
    }
  }
  return moves;
}

function doMove(fromR, fromC, toR, toC) {
  const moving = board[fromR][fromC];
  const target = board[toR][toC];
  board[toR][toC] = moving;
  board[fromR][fromC] = null;

  if (target?.type === "general") {
    winner = moving.color;
  } else {
    currentPlayer = currentPlayer === "red" ? "black" : "red";
    if (generalsFacing()) {
      winner = moving.color;
    }
  }

  selected = null;
  legalMoves = [];
  render();
}

function clickCell(r, c) {
  if (winner) return;

  const piece = board[r][c];

  if (selected) {
    const [sr, sc] = selected;
    const match = legalMoves.some(([mr, mc]) => mr === r && mc === c);
    if (match) {
      doMove(sr, sc, r, c);
      return;
    }

    if (piece && piece.color === currentPlayer) {
      selected = [r, c];
      legalMoves = getLegalMoves(r, c);
      render();
      return;
    }

    selected = null;
    legalMoves = [];
    render();
    return;
  }

  if (piece && piece.color === currentPlayer) {
    selected = [r, c];
    legalMoves = getLegalMoves(r, c);
    render();
  }
}

function render() {
  boardEl.innerHTML = "";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      if (r === 4 || r === 5) cell.classList.add("river");

      if (selected && selected[0] === r && selected[1] === c) {
        cell.classList.add("selected");
      }
      if (legalMoves.some(([mr, mc]) => mr === r && mc === c)) {
        cell.classList.add("highlight");
      }

      cell.addEventListener("click", () => clickCell(r, c));

      const piece = board[r][c];
      if (piece) {
        const p = document.createElement("div");
        p.className = `piece ${piece.color}`;
        p.textContent = PIECES[piece.type][piece.color];
        p.title = `${piece.color} ${piece.type}`;
        cell.appendChild(p);
      }

      boardEl.appendChild(cell);
    }
  }

  if (winner) {
    statusEl.textContent = `${winner[0].toUpperCase() + winner.slice(1)} wins!`;
  } else {
    statusEl.textContent = `${currentPlayer[0].toUpperCase() + currentPlayer.slice(1)} to move`;
  }
}

function reset() {
  currentPlayer = "red";
  selected = null;
  legalMoves = [];
  winner = null;
  setupBoard();
  render();
}

resetBtn.addEventListener("click", reset);
reset();
