// ============================================
// 1인 연습 모드 - JavaScript
// ============================================

// 게임 인스턴스
let game = null;
let bestScore = 0;

// DOM 요소
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const backBtn = document.getElementById('backBtn');
const restartBtn = document.getElementById('restartBtn');
const mainMenuBtn = document.getElementById('mainMenuBtn');

const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const linesDisplay = document.getElementById('lines');
const bestScoreDisplay = document.getElementById('bestScore');

const gameOverModal = document.getElementById('gameOverModal');
const finalScore = document.getElementById('finalScore');
const finalLevel = document.getElementById('finalLevel');
const finalLines = document.getElementById('finalLines');
const newRecordMsg = document.getElementById('newRecordMsg');

// ============================================
// 초기화
// ============================================

function init() {
    // 최고 점수 불러오기
    loadBestScore();
    
    // 게임 인스턴스 생성
    game = new TetrisGame('gameCanvas');
    
    // 콜백 함수 설정
    game.onScoreUpdate = handleScoreUpdate;
    game.onGameOver = handleGameOver;
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    console.log('1인 연습 모드 초기화 완료');
}

// ============================================
// 최고 점수 관리
// ============================================

function loadBestScore() {
    const saved = localStorage.getItem('tetris_best_score');
    bestScore = saved ? parseInt(saved) : 0;
    bestScoreDisplay.textContent = bestScore;
}

function saveBestScore(score) {
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('tetris_best_score', bestScore);
        bestScoreDisplay.textContent = bestScore;
        return true; // 신기록
    }
    return false;
}

// ============================================
// 이벤트 리스너
// ============================================

function setupEventListeners() {
    // 버튼 이벤트
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    backBtn.addEventListener('click', goToMainMenu);
    restartBtn.addEventListener('click', restartGame);
    mainMenuBtn.addEventListener('click', goToMainMenu);
    
    // 키보드 이벤트
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    if (!game || game.gameOver) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            game.moveLeft();
            updateNextPiece();
            break;
        case 'ArrowRight':
            e.preventDefault();
            game.moveRight();
            updateNextPiece();
            break;
        case 'ArrowDown':
            e.preventDefault();
            game.moveDown();
            updateNextPiece();
            break;
        case 'ArrowUp':
            e.preventDefault();
            game.rotate();
            updateNextPiece();
            break;
        case ' ':
            e.preventDefault();
            game.hardDrop();
            updateNextPiece();
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            pauseGame();
            break;
    }
}

// ============================================
// 게임 제어
// ============================================

function startGame() {
    game.start();
    
    // 버튼 상태 변경
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // 점수판 초기화
    scoreDisplay.textContent = '0';
    levelDisplay.textContent = '1';
    linesDisplay.textContent = '0';
    
    // 다음 블록 표시
    updateNextPiece();
    
    console.log('게임 시작!');
}

function pauseGame() {
    if (!game || game.gameOver) return;
    
    game.pause();
    
    if (game.isPaused) {
        pauseBtn.textContent = '계속하기';
    } else {
        pauseBtn.textContent = '일시정지';
        updateNextPiece();
    }
}

function restartGame() {
    // 모달 닫기
    gameOverModal.classList.remove('active');
    
    // 게임 재시작
    startGame();
}

function goToMainMenu() {
    if (confirm('메인 메뉴로 돌아가시겠습니까?')) {
        window.location.href = 'index.html';
    }
}

// ============================================
// 게임 콜백 함수
// ============================================

function handleScoreUpdate(data) {
    scoreDisplay.textContent = data.score;
    levelDisplay.textContent = data.level;
    linesDisplay.textContent = data.lines;
    
    // 다음 블록 업데이트
    updateNextPiece();
}

function handleGameOver(data) {
    // 버튼 상태 변경
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '일시정지';
    
    // 최종 점수 표시
    finalScore.textContent = data.score;
    finalLevel.textContent = data.level;
    finalLines.textContent = data.lines;
    
    // 신기록 확인
    const isNewRecord = saveBestScore(data.score);
    if (isNewRecord) {
        newRecordMsg.style.display = 'block';
    } else {
        newRecordMsg.style.display = 'none';
    }
    
    // 모달 표시
    setTimeout(() => {
        gameOverModal.classList.add('active');
    }, 500);
    
    console.log('게임 오버! 점수:', data.score);
}

function updateNextPiece() {
    if (game) {
        game.drawNextPiece('nextCanvas');
    }
}

// ============================================
// 페이지 로드 시 실행
// ============================================

window.addEventListener('load', init);
