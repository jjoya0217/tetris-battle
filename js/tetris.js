// ============================================
// 테트리스 게임 엔진 v1.0
// ============================================

// 1. 블록 타입 정의 (7가지)
const BLOCKS = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ]
};

// 2. 블록 색상 정의
const BLOCK_COLORS = {
    I: '#00f0f0',  // 하늘색
    O: '#f0f000',  // 노란색
    T: '#a000f0',  // 보라색
    S: '#00f000',  // 초록색
    Z: '#f00000',  // 빨간색
    J: '#0000f0',  // 파란색
    L: '#f0a000'   // 주황색
};

// 3. 블록 타입 배열 (랜덤 선택용)
const BLOCK_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// 4. 게임판 크기
const BOARD_WIDTH = 10;   // 가로 10칸
const BOARD_HEIGHT = 20;  // 세로 20칸
const BLOCK_SIZE = 30;    // 각 칸의 크기 (픽셀)

// 5. 레벨별 속도 (밀리초, 숫자가 작을수록 빠름)
const LEVEL_SPEEDS = [
    800,  // 레벨 1
    700,  // 레벨 2
    600,  // 레벨 3
    500,  // 레벨 4
    400,  // 레벨 5
    350,  // 레벨 6
    300,  // 레벨 7
    250,  // 레벨 8
    200,  // 레벨 9
    150   // 레벨 10+
];

// 6. 점수 계산 (제거한 줄 수에 따라)
const SCORE_VALUES = {
    1: 100,   // 1줄: 100점
    2: 300,   // 2줄: 300점
    3: 500,   // 3줄: 500점
    4: 800    // 4줄: 800점
};

// ============================================
// 메인 게임 클래스
// ============================================

class TetrisGame {
    constructor(canvasId) {
        // Canvas 설정
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas 크기 설정
        this.canvas.width = BOARD_WIDTH * BLOCK_SIZE;
        this.canvas.height = BOARD_HEIGHT * BLOCK_SIZE;
        
        // 게임 상태 변수들
        this.board = this.createEmptyBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        
        // 타이머 관련
        this.dropTimer = null;
        this.dropInterval = LEVEL_SPEEDS[0];
        
        // 콜백 함수들
        this.onScoreUpdate = null;
        this.onGameOver = null;
        this.onLinesClear = null;
    }
    
    // 빈 게임판 생성
    createEmptyBoard() {
        const board = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            board[y] = [];
            for (let x = 0; x < BOARD_WIDTH; x++) {
                board[y][x] = 0;
            }
        }
        return board;
    }
    
    // 게임 시작
    start() {
        this.board = this.createEmptyBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        
        this.nextPiece = this.createNewPiece();
        this.spawnPiece();
        
        this.startDropTimer();
        this.draw();
        
        console.log('게임 시작!');
    }
    
    // 새 블록 생성
    createNewPiece(type = null) {
        const blockType = type || BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
        
        return {
            type: blockType,
            shape: JSON.parse(JSON.stringify(BLOCKS[blockType])), // 깊은 복사
            color: BLOCK_COLORS[blockType],
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(BLOCKS[blockType][0].length / 2),
            y: 0
        };
    }
    
    // 새 블록을 게임판 상단에 배치
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createNewPiece();
        
        if (this.checkCollision(this.currentPiece)) {
            this.endGame();
        }
    }
    
    // ============================================
    // 블록 이동 및 회전
    // ============================================
    
    moveLeft() {
        if (this.gameOver || this.isPaused) return;
        
        this.currentPiece.x--;
        if (this.checkCollision(this.currentPiece)) {
            this.currentPiece.x++;
        }
        this.draw();
    }
    
    moveRight() {
        if (this.gameOver || this.isPaused) return;
        
        this.currentPiece.x++;
        if (this.checkCollision(this.currentPiece)) {
            this.currentPiece.x--;
        }
        this.draw();
    }
    
    moveDown() {
        if (this.gameOver || this.isPaused) return;
        
        this.currentPiece.y++;
        if (this.checkCollision(this.currentPiece)) {
            this.currentPiece.y--;
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
        }
        this.draw();
    }
    
    hardDrop() {
        if (this.gameOver || this.isPaused) return;
        
        while (!this.checkCollision(this.currentPiece)) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        
        this.lockPiece();
        this.clearLines();
        this.spawnPiece();
        this.draw();
    }
    
    rotate() {
        if (this.gameOver || this.isPaused) return;
        
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = this.rotateMatrix(originalShape);
        
        if (this.checkCollision(this.currentPiece)) {
            this.currentPiece.shape = originalShape;
        }
        
        this.draw();
    }
    
    rotateMatrix(matrix) {
        const N = matrix.length;
        const rotated = [];
        
        for (let i = 0; i < N; i++) {
            rotated[i] = [];
            for (let j = 0; j < N; j++) {
                rotated[i][j] = matrix[N - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    checkCollision(piece) {
        const shape = piece.shape;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;
                    
                    if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                        return true;
                    }
                    
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    lockPiece() {
        const shape = this.currentPiece.shape;
        const color = this.currentPiece.color;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = color;
                    }
                }
            }
        }
    }
    
    // ============================================
    // 줄 제거 및 점수 계산
    // ============================================
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            let isLineFull = true;
            
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (!this.board[y][x]) {
                    isLineFull = false;
                    break;
                }
            }
            
            if (isLineFull) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
            
            if (this.onLinesClear) {
                this.onLinesClear(linesCleared);
            }
        }
    }
    
    updateScore(linesCleared) {
        const points = SCORE_VALUES[linesCleared] || 0;
        this.score += points * this.level;
        this.lines += linesCleared;
        
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateSpeed();
        }
        
        if (this.onScoreUpdate) {
            this.onScoreUpdate({
                score: this.score,
                level: this.level,
                lines: this.lines
            });
        }
    }
    
    updateSpeed() {
        const speedIndex = Math.min(this.level - 1, LEVEL_SPEEDS.length - 1);
        this.dropInterval = LEVEL_SPEEDS[speedIndex];
        
        this.stopDropTimer();
        this.startDropTimer();
    }
    
    // ============================================
    // 타이머 관리
    // ============================================
    
    startDropTimer() {
        this.dropTimer = setInterval(() => {
            this.moveDown();
        }, this.dropInterval);
    }
    
    stopDropTimer() {
        if (this.dropTimer) {
            clearInterval(this.dropTimer);
            this.dropTimer = null;
        }
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.stopDropTimer();
        } else {
            this.startDropTimer();
        }
        
        this.draw();
    }
    
    // ============================================
    // 화면 그리기
    // ============================================
    
    draw() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBoard();
        
        if (this.currentPiece) {
            this.drawGhost();
            this.drawPiece(this.currentPiece);
        }
        
        this.drawGrid();
        
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('일시정지', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawBoard() {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * BLOCK_SIZE + 1,
                        y * BLOCK_SIZE + 1,
                        BLOCK_SIZE - 2,
                        BLOCK_SIZE - 2
                    );
                }
            }
        }
    }
    
    drawPiece(piece) {
        const shape = piece.shape;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.ctx.fillStyle = piece.color;
                    this.ctx.fillRect(
                        (piece.x + x) * BLOCK_SIZE + 1,
                        (piece.y + y) * BLOCK_SIZE + 1,
                        BLOCK_SIZE - 2,
                        BLOCK_SIZE - 2
                    );
                }
            }
        }
    }
    
    drawGhost() {
        const ghostPiece = JSON.parse(JSON.stringify(this.currentPiece));
        
        while (!this.checkCollision(ghostPiece)) {
            ghostPiece.y++;
        }
        ghostPiece.y--;
        
        const shape = ghostPiece.shape;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.ctx.fillRect(
                        (ghostPiece.x + x) * BLOCK_SIZE + 1,
                        (ghostPiece.y + y) * BLOCK_SIZE + 1,
                        BLOCK_SIZE - 2,
                        BLOCK_SIZE - 2
                    );
                }
            }
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = 120;
        canvas.height = 120;
        
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (this.nextPiece) {
            const shape = this.nextPiece.shape;
            const blockSize = 25;
            const offsetX = (canvas.width - shape[0].length * blockSize) / 2;
            const offsetY = (canvas.height - shape.length * blockSize) / 2;
            
            ctx.fillStyle = this.nextPiece.color;
            
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        ctx.fillRect(
                            offsetX + x * blockSize + 1,
                            offsetY + y * blockSize + 1,
                            blockSize - 2,
                            blockSize - 2
                        );
                    }
                }
            }
        }
    }
    
    // ============================================
    // 게임 종료
    // ============================================
    
    endGame() {
        this.gameOver = true;
        this.stopDropTimer();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('게임 오버', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`점수: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                level: this.level,
                lines: this.lines
            });
        }
        
        console.log('게임 오버! 최종 점수:', this.score);
    }
    
    // ============================================
    // 상태 가져오기 (멀티플레이용)
    // ============================================
    
    getState() {
        return {
            board: this.board,
            score: this.score,
            level: this.level,
            lines: this.lines,
            gameOver: this.gameOver
        };
    }
}
