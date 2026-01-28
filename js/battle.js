// ============================================
// 배틀 모드 JavaScript
// ============================================

let roomCode = null;
let myGame = null;
let roomRef = null;
let attacksRef = null;
let currentRoom = null;
let myPlayerId = null;
let opponentGames = {};
let isEliminated = false;
let myRank = null;

// DOM 요소
const myCanvas = document.getElementById('myCanvas');
const myScore = document.getElementById('myScore');
const myLevel = document.getElementById('myLevel');
const myLines = document.getElementById('myLines');
const gameResultModal = document.getElementById('gameResultModal');
const resultTitle = document.getElementById('resultTitle');
const resultsTable = document.getElementById('resultsTable');

// ============================================
// 초기화
// ============================================

function init() {
    // URL 파라미터에서 방 코드 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    roomCode = urlParams.get('room');
    
    if (!roomCode) {
        alert('잘못된 접근입니다.');
        window.location.href = 'index.html';
        return;
    }
    
    // Firebase 초기화 대기
    waitForFirebase();
}

function waitForFirebase() {
    if (typeof firebase !== 'undefined' && currentUserId) {
        myPlayerId = currentUserId;
        setupBattle();
    } else {
        setTimeout(waitForFirebase, 100);
    }
}

function setupBattle() {
    // 게임 인스턴스 생성
    myGame = new TetrisGame('myCanvas');
    
    // 콜백 함수 설정
    myGame.onScoreUpdate = handleMyScoreUpdate;
    myGame.onGameOver = handleMyGameOver;
    myGame.onLinesClear = handleLinesClear;
    
    // Firebase 감시 설정
    roomRef = watchRoom(roomCode, handleRoomUpdate);
    attacksRef = watchAttacks(roomCode, handleAttackReceived);
    
    // 키보드 이벤트
    setupKeyboardControls();
    
    // 게임 상태 동기화 시작
    startStateSyncTimer();
    
    console.log('배틀 모드 초기화 완료');
}

// ============================================
// 키보드 컨트롤
// ============================================

function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!myGame || myGame.gameOver) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                myGame.moveLeft();
                updateNextPiece();
                break;
            case 'ArrowRight':
                e.preventDefault();
                myGame.moveRight();
                updateNextPiece();
                break;
            case 'ArrowDown':
                e.preventDefault();
                myGame.moveDown();
                updateNextPiece();
                break;
            case 'ArrowUp':
                e.preventDefault();
                myGame.rotate();
                updateNextPiece();
                break;
            case ' ':
                e.preventDefault();
                myGame.hardDrop();
                updateNextPiece();
                break;
        }
    });
}

// ============================================
// 게임 시작
// ============================================

function startBattle() {
    // 게임 시작
    myGame.start();
    
    // 첫 블록을 공정하게 (O, I, L 중 하나)
    const fairBlocks = ['O', 'I', 'L'];
    const firstBlock = fairBlocks[Math.floor(Math.random() * fairBlocks.length)];
    myGame.currentPiece = myGame.createNewPiece(firstBlock);
    
    updateNextPiece();
    
    console.log('배틀 시작!');
}

// ============================================
// 내 게임 콜백
// ============================================

function handleMyScoreUpdate(data) {
    myScore.textContent = data.score;
    myLevel.textContent = data.level;
    myLines.textContent = data.lines;
    
    updateNextPiece();
}

function handleLinesClear(lines) {
    // 2줄 이상 제거하면 공격
    if (lines >= 2) {
        const attackLines = lines - 1;
        sendAttack(roomCode, attackLines);
        console.log(`${attackLines}줄 공격 전송!`);
    }
}

function handleMyGameOver(data) {
    if (isEliminated) return;
    
    isEliminated = true;
    
    // Firebase에 탈락 기록
    recordElimination(roomCode, data.score)
        .then(() => {
            console.log('탈락 기록 완료');
        });
}

function updateNextPiece() {
    if (myGame) {
        myGame.drawNextPiece('nextCanvas');
    }
}

// ============================================
// 공격 처리
// ============================================

function handleAttackReceived(attack) {
    if (isEliminated) return;
    
    const attackLines = attack.lines;
    
    // 게임판 하단에 공격받은 줄 추가
    for (let i = 0; i < attackLines; i++) {
        // 게임판을 한 줄씩 위로 올림
        myGame.board.shift();
        
        // 하단에 새 줄 추가 (랜덤 위치 하나만 빈칸)
        const newLine = new Array(BOARD_WIDTH).fill('#FF6B35');
        const emptySpot = Math.floor(Math.random() * BOARD_WIDTH);
        newLine[emptySpot] = 0;
        
        myGame.board.push(newLine);
    }
    
    // 화면 흔들림 효과
    myCanvas.classList.add('attack-effect');
    setTimeout(() => {
        myCanvas.classList.remove('attack-effect');
    }, 500);
    
    myGame.draw();
    
    console.log(`${attackLines}줄 공격 받음!`);
}

// ============================================
// 방 업데이트 처리
// ============================================

function handleRoomUpdate(room) {
    if (!room) {
        alert('방이 종료되었습니다.');
        window.location.href = 'index.html';
        return;
    }
    
    currentRoom = room;
    
    // 첫 업데이트 시 게임 시작
    if (!myGame.dropTimer && room.status === 'playing') {
        startBattle();
    }
    
    // 상대방 게임 상태 업데이트
    updateOpponents(room);
    
    // 게임 종료 체크
    checkGameEnd(room);
}

// ============================================
// 상대방 화면 업데이트
// ============================================

function updateOpponents(room) {
    const players = room.players || {};
    const gameStates = room.gameStates || {};
    const eliminations = room.eliminations || {};
    
    let opponentIndex = 1;
    
    Object.keys(players).forEach(playerId => {
        if (playerId === myPlayerId) return;
        
        const player = players[playerId];
        const state = gameStates[playerId];
        const elimination = eliminations[playerId];
        
        const opponentDiv = document.getElementById(`opponent${opponentIndex}`);
        if (!opponentDiv) return;
        
        opponentDiv.style.display = 'flex';
        
        const canvas = opponentDiv.querySelector('.opponent-canvas');
        const nameDiv = opponentDiv.querySelector('.opponent-name');
        const scoreDiv = opponentDiv.querySelector('.opponent-score');
        const rankDiv = opponentDiv.querySelector('.opponent-rank');
        
        // 플레이어 이름
        nameDiv.textContent = player.name;
        
        // 게임 오버 상태
        if (elimination && elimination.eliminated) {
            scoreDiv.innerHTML = `<span class="game-over-badge">게임 오버</span><br>점수: ${elimination.finalScore}`;
            if (elimination.rank) {
                rankDiv.style.display = 'block';
                rankDiv.textContent = `${elimination.rank}위`;
            }
            
            // 게임판 어둡게
            drawOpponentBoard(canvas, null, true);
        } else if (state) {
            // 점수 표시
            scoreDiv.textContent = `점수: ${state.score || 0}`;
            
            // 게임판 그리기
            drawOpponentBoard(canvas, state.board);
        }
        
        opponentIndex++;
    });
}

function drawOpponentBoard(canvas, board, gameOver = false) {
    const ctx = canvas.getContext('2d');
    const blockSize = 15;
    
    // 배경
    ctx.fillStyle = gameOver ? '#0a0a0a' : '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!board) return;
    
    // 게임판 그리기 (축소판)
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x]) {
                ctx.fillStyle = gameOver 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : board[y][x];
                ctx.fillRect(
                    x * blockSize + 1,
                    y * blockSize + 1,
                    blockSize - 2,
                    blockSize - 2
                );
            }
        }
    }
}

// ============================================
// 게임 상태 동기화
// ============================================

function startStateSyncTimer() {
    setInterval(() => {
        if (myGame && !myGame.gameOver) {
            const state = myGame.getState();
            updateGameState(roomCode, state);
        }
    }, 200); // 200ms마다 동기화 (초당 5회)
}

// ============================================
// 게임 종료 체크
// ============================================

function checkGameEnd(room) {
    const eliminations = room.eliminations || {};
    const players = room.players || {};
    
    const totalPlayers = Object.keys(players).length;
    const eliminatedCount = Object.keys(eliminations).length;
    
    // 1명만 남았거나 모두 탈락
    if (eliminatedCount >= totalPlayers - 1 || eliminatedCount === totalPlayers) {
        calculateRanks(room);
    }
}

// ============================================
// 순위 계산 및 결과 표시
// ============================================

function calculateRanks(room) {
    const eliminations = room.eliminations || {};
    const players = room.players || {};
    
    // 탈락 정보를 배열로 변환
    const eliminationArray = Object.entries(eliminations).map(([playerId, data]) => ({
        playerId,
        ...data
    }));
    
    // 타임스탬프로 정렬 (늦게 탈락할수록 높은 순위)
    eliminationArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // 순위 부여
    const rankings = [];
    eliminationArray.forEach((elim, index) => {
        const player = players[elim.playerId];
        rankings.push({
            rank: index + 1,
            playerId: elim.playerId,
            name: player ? player.name : '알 수 없음',
            score: elim.finalScore || 0
        });
    });
    
    // 아직 안 탈락한 플레이어 (1등)
    Object.keys(players).forEach(playerId => {
        if (!eliminations[playerId]) {
            const player = players[playerId];
            const gameState = room.gameStates && room.gameStates[playerId];
            rankings.unshift({
                rank: 1,
                playerId: playerId,
                name: player.name,
                score: gameState ? gameState.score : 0
            });
        }
    });
    
    // 결과 모달 표시
    showGameResults(rankings);
}

function showGameResults(rankings) {
    // 내 순위 찾기
    const myRanking = rankings.find(r => r.playerId === myPlayerId);
    
    if (myRanking) {
        if (myRanking.rank === 1) {
            resultTitle.textContent = '🏆 승리!';
        } else {
            resultTitle.textContent = `${myRanking.rank}위`;
        }
    }
    
    // 순위표 생성
    resultsTable.innerHTML = '';
    rankings.forEach(ranking => {
        const tr = document.createElement('tr');
        
        const isMe = ranking.playerId === myPlayerId;
        if (isMe) {
            tr.style.background = 'rgba(102, 126, 234, 0.2)';
        }
        
        let rankClass = '';
        if (ranking.rank === 1) rankClass = 'rank-1';
        else if (ranking.rank === 2) rankClass = 'rank-2';
        else if (ranking.rank === 3) rankClass = 'rank-3';
        
        tr.innerHTML = `
            <td class="${rankClass}">${ranking.rank}위</td>
            <td>${ranking.name}${isMe ? ' (나)' : ''}</td>
            <td>${ranking.score.toLocaleString()}</td>
        `;
        
        resultsTable.appendChild(tr);
    });
    
    // 모달 표시
    setTimeout(() => {
        gameResultModal.classList.add('active');
    }, 1000);
    
    console.log('게임 종료! 최종 순위:', rankings);
}

// ============================================
// 페이지 로드 시 실행
// ============================================

// Firebase 초기화
if (typeof firebase !== 'undefined') {
    initFirebase();
}

window.addEventListener('load', init);
