const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const modeAiBtn = document.getElementById('mode-ai');
const modePvpBtn = document.getElementById('mode-pvp');
const themeToggleBtn = document.getElementById('theme-toggle');

let board = Array(9).fill(null);
let currentPlayer = 'X'; // X always starts
let mode = 'ai'; // 'ai' or 'pvp'
let gameOver = false;

function init(){
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('role','button');
    cell.dataset.index = i;
    cell.addEventListener('click', onCellClick);
    const inner = document.createElement('div');
    inner.className = 'cell-inner';
    cell.appendChild(inner);
    boardEl.appendChild(cell);
  }
  updateStatus();
}

function updateStatus(message){
  if(message){
    statusEl.textContent = message;
    return;
  }
  if(gameOver) return;
  statusEl.textContent = `${currentPlayer}'s turn`;
}

function onCellClick(e){
  const idx = Number(e.currentTarget.dataset.index);
  if(gameOver) return;
  if(board[idx]) return; // occupied
  if(mode==='ai' && currentPlayer!=='X') return; // prevent clicking while AI thinking or when it's O's turn

  makeMove(idx, currentPlayer);

  if(!gameOver){
    if(mode==='ai'){
      // AI (O) makes move after a tiny delay
      setTimeout(()=>{
        const aiIdx = findBestMove(board.slice());
        makeMove(aiIdx, 'O');
      }, 220);
    }
  }
}

function makeMove(idx, player){
  if(board[idx] || gameOver) return false;
  board[idx] = player;
  renderBoard();

  const winner = checkWinner(board);
  if(winner){
    gameOver = true;
    highlightWin(winner.line);
    updateStatus(`${winner.player} wins!`);
    return true;
  }

  if(isDraw(board)){
    gameOver = true;
    updateStatus("It's a draw");
    return true;
  }

  // switch player
  currentPlayer = player === 'X' ? 'O' : 'X';
  updateStatus();
  return true;
}

function renderBoard(){
  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach((c,i)=>{
    const inner = c.firstElementChild;
    inner.textContent = board[i] ? board[i] : '';
    inner.classList.toggle('o', board[i]==='O');
    c.classList.toggle('disabled', !!board[i] || gameOver);
  });
}

function checkWinner(b){
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for(const line of lines){
    const [a,b1,c] = line;
    if(b[a] && b[a]===b[b1] && b[a]===b[c]){
      return {player: b[a], line};
    }
  }
  return null;
}

function isDraw(b){
  return b.every(Boolean) && !checkWinner(b);
}

function highlightWin(line){
  const cells = boardEl.querySelectorAll('.cell');
  line.forEach(i=>cells[i].classList.add('win-highlight'));
}

function resetGame(){
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;
  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach(c=>{c.classList.remove('win-highlight');});
  renderBoard();
  updateStatus();
}

restartBtn.addEventListener('click', ()=>{
  resetGame();
});

themeToggleBtn && themeToggleBtn.addEventListener('click', ()=>{
  document.body.classList.toggle('bw');
  themeToggleBtn.classList.toggle('active');
});

modeAiBtn.addEventListener('click', ()=>{
  mode='ai';
  modeAiBtn.classList.add('active');
  modePvpBtn.classList.remove('active');
  resetGame();
});
modePvpBtn.addEventListener('click', ()=>{
  mode='pvp';
  modePvpBtn.classList.add('active');
  modeAiBtn.classList.remove('active');
  resetGame();
});

// Minimax AI (O is AI, X is human)
function findBestMove(b){
  // if first move and center empty, take center
  if(b.every(v=>v===null)) return 4;

  let bestScore = -Infinity;
  let bestMove = null;
  for(let i=0;i<9;i++){
    if(!b[i]){
      b[i] = 'O';
      const score = minimax(b, 0, false);
      b[i] = null;
      if(score > bestScore){
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(b, depth, isMaximizing){
  const winner = checkWinner(b);
  if(winner){
    if(winner.player === 'O') return 10 - depth;
    if(winner.player === 'X') return depth - 10;
  }
  if(isDraw(b)) return 0;

  if(isMaximizing){
    let maxEval = -Infinity;
    for(let i=0;i<9;i++){
      if(!b[i]){
        b[i] = 'O';
        const evalScore = minimax(b, depth+1, false);
        b[i] = null;
        maxEval = Math.max(maxEval, evalScore);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for(let i=0;i<9;i++){
      if(!b[i]){
        b[i] = 'X';
        const evalScore = minimax(b, depth+1, true);
        b[i] = null;
        minEval = Math.min(minEval, evalScore);
      }
    }
    return minEval;
  }
}

// For PvP mode, allow alternating moves without AI
function pvpmove(idx){
  if(gameOver) return;
  if(board[idx]) return;
  makeMove(idx, currentPlayer);
}

// Hook up click for PvP to respect player switching
boardEl.addEventListener('click',(e)=>{
  if(!e.target.closest('.cell')) return;
  const cell = e.target.closest('.cell');
  const idx = Number(cell.dataset.index);
  if(mode==='pvp'){
    pvpmove(idx);
  }
});

// Initialize app
init();
