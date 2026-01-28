// ============================================
// 대기실 (완벽한 버전)
// ============================================

const params = new URLSearchParams(window.location.search);
const roomCode = params.get('room');
const isHost = params.get('host') === 'true';

let roomRef = null;
let currentRoom = null;
let myUserId = null;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('대기실 로드 완료');
    console.log('방 코드:', roomCode);
    console.log('방장 여부:', isHost);
    
    // Firebase 준비 대기
    waitForFirebase();
});

// ============================================
// Firebase 초기화 대기
// ============================================

function waitForFirebase() {
    let attempts = 0;
    const maxAttempts = 50; // 5초 대기
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.firebaseReady) {
            clearInterval(checkInterval);
            console.log('✅ Firebase 준비 완료, 방 감시 시작');
            initWaitingRoom();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Firebase 초기화 타임아웃');
            showError('Firebase 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        } else {
            console.log(`Firebase 초기화 대기 중... (${attempts}/${maxAttempts})`);
        }
    }, 100);
}

// ============================================
// 대기실 초기화
// ============================================

function initWaitingRoom() {
    if (!roomCode) {
        showError('방 코드가 없습니다.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    myUserId = window.getCurrentUserId();
    
    if (!myUserId) {
        console.error('❌ 사용자 ID를 가져올 수 없습니다.');
        showError('로그인 정보가 없습니다. 메인 화면으로 돌아갑니다.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    console.log('내 사용자 ID:', myUserId);
    
    // 방 코드 표시
    document.getElementById('roomCode').textContent = roomCode;
    
    // 방 정보 실시간 감시
    roomRef = window.watchRoom(roomCode, onRoomUpdate);
    
    if (!roomRef) {
        console.error('❌ watchRoom 함수 실패');
        showError('방 감시를 시작할 수 없습니다.');
        return;
    }
    
    console.log('✅ 방 감시 시작됨');
}

// ============================================
// 방 정보 업데이트 처리
// ============================================

function onRoomUpdate(room) {
    console.log('방 정보 업데이트:', room);
    
    if (!room) {
        console.log('⚠️ 방이 삭제되었습니다.');
        showError('방장이 나가서 방이 종료되었습니다.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    currentRoom = room;
    
    // 방 정보 업데이트
    updateRoomInfo(room);
    
    // 플레이어 목록 업데이트
    updatePlayerList(room);
    
    // 게임 시작 체크
    if (room.status === 'playing') {
        console.log('🎮 게임 시작!');
        startCountdown(room.startTime);
    }
}

// ============================================
// 방 정보 업데이트
// ============================================

function updateRoomInfo(room) {
    // 현재 인원
    const playerCount = document.getElementById('playerCount');
    if (playerCount) {
        playerCount.textContent = `${room.currentPlayers}/${room.maxPlayers}`;
    }
    
    // 방장 이름
    const hostName = document.getElementById('hostName');
    if (hostName) {
        hostName.textContent = room.hostName || '방장';
    }
}

// ============================================
// 플레이어 목록 업데이트
// ============================================

function updatePlayerList(room) {
    const playerList = document.getElementById('playerList');
    if (!playerList) return;
    
    playerList.innerHTML = '';
    
    if (!room.players) {
        console.log('⚠️ 플레이어 정보 없음');
        return;
    }
    
    // 플레이어 정렬 (slot 순서대로)
    const players = Object.entries(room.players)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => a.slot - b.slot);
    
    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        if (player.id === myUserId) {
            playerItem.classList.add('me');
        }
        
        let badges = '';
        if (player.isHost) {
            badges += '<span class="badge badge-host">👑 방장</span>';
        }
        if (player.ready) {
            badges += '<span class="badge badge-ready">✅ 준비완료</span>';
        }
        
        playerItem.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${badges}
        `;
        
        playerList.appendChild(playerItem);
    });
    
    console.log(`플레이어 목록 업데이트: ${players.length}명`);
}

// ============================================
// 게임 시작 (방장만)
// ============================================

function startGame() {
    if (!currentRoom) {
        alert('방 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    if (!isHost) {
        alert('방장만 게임을 시작할 수 있습니다.');
        return;
    }
    
    if (currentRoom.currentPlayers < 2) {
        alert('최소 2명 이상의 플레이어가 필요합니다.');
        return;
    }
    
    console.log('🎮 게임 시작 요청');
    
    window.startGameFirebase(roomCode)
        .then(() => {
            console.log('✅ 게임 시작 신호 전송 완료');
        })
        .catch((error) => {
            console.error('❌ 게임 시작 실패:', error);
            alert('게임 시작에 실패했습니다: ' + error.message);
        });
}

// ============================================
// 카운트다운
// ============================================

function startCountdown(startTime) {
    const overlay = document.getElementById('countdownOverlay');
    const countdownText = document.getElementById('countdownText');
    
    if (!overlay || !countdownText) {
        console.error('❌ 카운트다운 요소를 찾을 수 없습니다.');
        goToBattle();
        return;
    }
    
    overlay.style.display = 'flex';
    
    const interval = setInterval(() => {
        const remaining = Math.ceil((startTime - Date.now()) / 1000);
        
        if (remaining <= 0) {
            clearInterval(interval);
            goToBattle();
        } else {
            countdownText.textContent = remaining;
        }
    }, 100);
}

// ============================================
// 배틀 화면으로 이동
// ============================================

function goToBattle() {
    if (roomRef) {
        window.unwatchRoom(roomRef);
    }
    
    window.location.href = `battle.html?room=${roomCode}`;
}

// ============================================
// 방 나가기
// ============================================

function leaveRoom() {
    if (confirm('방을 나가시겠습니까?')) {
        if (roomRef) {
            window.unwatchRoom(roomRef);
        }
        
        window.leaveRoom(roomCode)
            .then(() => {
                console.log('✅ 방 나가기 성공');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('❌ 방 나가기 실패:', error);
                window.location.href = 'index.html';
            });
    }
}

// ============================================
// 방 코드 복사
// ============================================

function copyRoomCode() {
    navigator.clipboard.writeText(roomCode)
        .then(() => {
            const btn = document.querySelector('.copy-btn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✅ 복사됨!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            }
        })
        .catch((error) => {
            console.error('복사 실패:', error);
            alert('클립보드 복사에 실패했습니다.');
        });
}

// ============================================
// 오류 표시
// ============================================

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff6b6b;
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 18px;
        text-align: center;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
}

// ============================================
// 페이지 언로드 시 정리
// ============================================

window.addEventListener('beforeunload', () => {
    if (roomRef) {
        window.unwatchRoom(roomRef);
    }
});

console.log('waiting.js 로드 완료');
