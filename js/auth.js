// ============================================
// 인증 및 메인 화면 관리 (완벽 버전)
// ============================================

let currentUser = null;

// ============================================
// 페이지 로드 시 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('auth.js 로드 완료');
    loadUser();
    updateUI();
});

// ============================================
// 사용자 관리
// ============================================

function loadUser() {
    const saved = localStorage.getItem('tetris_user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            console.log('사용자 로드:', currentUser.nickname);
        } catch (e) {
            console.error('사용자 로드 실패:', e);
            currentUser = null;
        }
    }
}

function saveUser() {
    if (currentUser) {
        localStorage.setItem('tetris_user', JSON.stringify(currentUser));
    }
}

function generateRandomTag() {
    return Math.floor(1000 + Math.random() * 9000);
}

// ============================================
// 닉네임 설정
// ============================================

window.setNickname = function() {
    const input = document.getElementById('nicknameInput');
    const nickname = input.value.trim();
    
    if (nickname.length < 2) {
        alert('닉네임은 2자 이상이어야 합니다.');
        return;
    }
    
    if (nickname.length > 10) {
        alert('닉네임은 10자 이하여야 합니다.');
        return;
    }
    
    const tag = generateRandomTag();
    currentUser = {
        nickname: nickname,
        tag: tag,
        fullName: `${nickname}#${tag}`,
        createdAt: Date.now()
    };
    
    saveUser();
    input.value = '';
    updateUI();
    
    console.log('닉네임 설정:', currentUser.fullName);
};

// ============================================
// UI 업데이트
// ============================================

function updateUI() {
    const nicknameSection = document.getElementById('nicknameSection');
    const welcomeSection = document.getElementById('welcomeSection');
    const currentNickname = document.getElementById('currentNickname');
    const welcomeName = document.getElementById('welcomeName');
    
    if (currentUser) {
        if (nicknameSection) nicknameSection.style.display = 'none';
        if (welcomeSection) welcomeSection.style.display = 'block';
        if (currentNickname) currentNickname.textContent = currentUser.fullName;
        if (welcomeName) welcomeName.textContent = currentUser.nickname;
    } else {
        if (nicknameSection) nicknameSection.style.display = 'block';
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (currentNickname) currentNickname.textContent = '설정되지 않음';
    }
}

// ============================================
// 페이지 이동
// ============================================

window.goToPractice = function() {
    if (!currentUser) {
        alert('닉네임을 먼저 설정해주세요!');
        return;
    }
    
    window.location.href = 'practice.html';
};

// ============================================
// 모달 관리
// ============================================

window.openCreateRoomModal = function() {
    if (!currentUser) {
        alert('닉네임을 먼저 설정해주세요!');
        return;
    }
    
    const modal = document.getElementById('createRoomModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.openJoinRoomModal = function() {
    if (!currentUser) {
        alert('닉네임을 먼저 설정해주세요!');
        return;
    }
    
    const modal = document.getElementById('joinRoomModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.openLeaderboardModal = function() {
    const modal = document.getElementById('leaderboardModal');
    if (modal) {
        modal.style.display = 'flex';
        loadLeaderboard('bestScore');
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// ============================================
// 방 만들기
// ============================================

window.createRoom = function(maxPlayers) {
    if (!currentUser) {
        alert('닉네임을 먼저 설정해주세요!');
        return;
    }
    
    console.log(`방 만들기 시도: ${maxPlayers}명`);
    
    if (!window.firebaseReady) {
        alert('Firebase가 준비 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    window.createRoomFirebase(maxPlayers, currentUser.fullName)
        .then((roomCode) => {
            console.log('방 생성 완료:', roomCode);
            window.location.href = `waiting.html?room=${roomCode}&host=true`;
        })
        .catch((error) => {
            console.error('방 생성 실패:', error);
            alert('방 생성에 실패했습니다: ' + error.message);
        });
};

// ============================================
// 방 참가하기
// ============================================

window.joinRoom = function() {
    if (!currentUser) {
        alert('닉네임을 먼저 설정해주세요!');
        return;
    }
    
    const input = document.getElementById('roomCodeInput');
    const roomCode = input.value.trim().toUpperCase();
    
    if (roomCode.length !== 6) {
        alert('방 코드는 6자리여야 합니다.');
        return;
    }
    
    console.log('방 참가 시도:', roomCode);
    
    if (!window.firebaseReady) {
        alert('Firebase가 준비 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    window.joinRoomFirebase(roomCode, currentUser.fullName)
        .then(() => {
            console.log('방 참가 완료:', roomCode);
            window.location.href = `waiting.html?room=${roomCode}&host=false`;
        })
        .catch((error) => {
            console.error('방 참가 실패:', error);
            alert('방 참가에 실패했습니다: ' + error.message);
        });
};

// ============================================
// 순위표
// ============================================

window.switchLeaderboard = function(type) {
    // 탭 버튼 활성화
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        if (tab.textContent.includes('최고 점수') && type === 'bestScore') {
            tab.classList.add('active');
        } else if (tab.textContent.includes('총 승리') && type === 'totalWins') {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    loadLeaderboard(type);
};

function loadLeaderboard(type) {
    const content = document.getElementById('leaderboardContent');
    if (!content) return;
    
    content.innerHTML = '<div class="loading">불러오는 중...</div>';
    
    if (!window.firebaseReady) {
        content.innerHTML = '<p style="text-align: center; padding: 20px;">Firebase 연결 중...</p>';
        return;
    }
    
    window.getLeaderboard(type, 10)
        .then((data) => {
            if (data.length === 0) {
                content.innerHTML = '<p style="text-align: center; padding: 20px;">아직 기록이 없습니다.</p>';
                return;
            }
            
            let html = '<table class="leaderboard-table"><thead><tr>';
            html += '<th>순위</th><th>플레이어</th>';
            
            if (type === 'bestScore') {
                html += '<th>최고 점수</th><th>게임 수</th>';
            } else {
                html += '<th>승리</th><th>승률</th>';
            }
            
            html += '</tr></thead><tbody>';
            
            data.forEach((player, index) => {
                html += '<tr>';
                html += `<td>${index + 1}</td>`;
                html += `<td>${player.displayName}</td>`;
                
                if (type === 'bestScore') {
                    html += `<td>${player.bestScore.toLocaleString()}</td>`;
                    html += `<td>${player.totalGames}</td>`;
                } else {
                    html += `<td>${player.totalWins}</td>`;
                    html += `<td>${player.winRate}%</td>`;
                }
                
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            content.innerHTML = html;
        })
        .catch((error) => {
            console.error('순위표 로드 실패:', error);
            content.innerHTML = '<p style="text-align: center; padding: 20px;">순위표를 불러오지 못했습니다.</p>';
        });
}

// ============================================
// Enter 키 처리
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // 닉네임 입력 Enter
    const nicknameInput = document.getElementById('nicknameInput');
    if (nicknameInput) {
        nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.setNickname();
            }
        });
    }
    
    // 방 코드 입력 Enter
    const roomCodeInput = document.getElementById('roomCodeInput');
    if (roomCodeInput) {
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.joinRoom();
            }
        });
    }
});

console.log('✅ auth.js 모든 함수 준비 완료');
