// ============================================
// 인증 및 닉네임 시스템
// ============================================

let currentUser = null;

// DOM 요소
const nicknameSection = document.getElementById('nicknameSection');
const welcomeSection = document.getElementById('welcomeSection');
const nicknameInput = document.getElementById('nicknameInput');
const setNicknameBtn = document.getElementById('setNicknameBtn');
const changeNicknameBtn = document.getElementById('changeNicknameBtn');
const displayNickname = document.getElementById('displayNickname');

const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');

const createRoomModal = document.getElementById('createRoomModal');
const joinRoomModal = document.getElementById('joinRoomModal');
const roomCodeInput = document.getElementById('roomCodeInput');

const totalGames = document.getElementById('totalGames');
const totalWins = document.getElementById('totalWins');
const winRate = document.getElementById('winRate');

// ============================================
// 초기화
// ============================================

function init() {
    // 저장된 사용자 정보 불러오기
    loadUser();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 전적 표시
    displayStats();
    
    console.log('메인 화면 초기화 완료');
}

// ============================================
// 사용자 관리
// ============================================

function loadUser() {
    const saved = localStorage.getItem('tetris_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        showWelcome();
    } else {
        showNicknameInput();
    }
}

function saveUser(user) {
    currentUser = user;
    localStorage.setItem('tetris_user', JSON.stringify(user));
}

function generateUserTag() {
    // 4자리 랜덤 번호 생성
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function setNickname() {
    const nickname = nicknameInput.value.trim();
    
    if (!nickname) {
        alert('닉네임을 입력해주세요!');
        return;
    }
    
    if (nickname.length < 2) {
        alert('닉네임은 최소 2자 이상이어야 합니다!');
        return;
    }
    
    // 사용자 객체 생성
    const user = {
        nickname: nickname,
        tag: generateUserTag(),
        fullName: `${nickname}#${generateUserTag()}`,
        createdAt: Date.now(),
        stats: {
            totalGames: 0,
            totalWins: 0,
            bestScore: 0
        }
    };
    
    // tag를 다시 생성하지 않도록 수정
    user.fullName = `${nickname}#${user.tag}`;
    
    saveUser(user);
    showWelcome();
    
    console.log('사용자 생성:', user.fullName);
}

function changeNickname() {
    if (confirm('닉네임을 변경하시겠습니까?\n(랜덤 번호도 새로 부여됩니다)')) {
        currentUser = null;
        localStorage.removeItem('tetris_user');
        showNicknameInput();
        nicknameInput.value = '';
    }
}

function showNicknameInput() {
    nicknameSection.style.display = 'block';
    welcomeSection.style.display = 'none';
}

function showWelcome() {
    nicknameSection.style.display = 'none';
    welcomeSection.style.display = 'block';
    displayNickname.textContent = currentUser.fullName;
}

// ============================================
// 전적 표시
// ============================================

function displayStats() {
    if (!currentUser || !currentUser.stats) {
        totalGames.textContent = '0';
        totalWins.textContent = '0';
        winRate.textContent = '0%';
        return;
    }
    
    const stats = currentUser.stats;
    totalGames.textContent = stats.totalGames || 0;
    totalWins.textContent = stats.totalWins || 0;
    
    const rate = stats.totalGames > 0 
        ? Math.round((stats.totalWins / stats.totalGames) * 100) 
        : 0;
    winRate.textContent = rate + '%';
}

function updateStats(won) {
    if (!currentUser) return;
    
    if (!currentUser.stats) {
        currentUser.stats = {
            totalGames: 0,
            totalWins: 0,
            bestScore: 0
        };
    }
    
    currentUser.stats.totalGames++;
    if (won) {
        currentUser.stats.totalWins++;
    }
    
    saveUser(currentUser);
    displayStats();
}

// ============================================
// 이벤트 리스너
// ============================================

function setupEventListeners() {
    setNicknameBtn.addEventListener('click', setNickname);
    changeNicknameBtn.addEventListener('click', changeNickname);
    
    // Enter 키로 닉네임 설정
    nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            setNickname();
        }
    });
    
    // 메뉴 버튼들
    createRoomBtn.addEventListener('click', () => {
        if (!checkUser()) return;
        openModal('createRoomModal');
    });
    
    joinRoomBtn.addEventListener('click', () => {
        if (!checkUser()) return;
        openModal('joinRoomModal');
    });
    
    leaderboardBtn.addEventListener('click', () => {
        alert('순위표 기능은 멀티플레이 완성 후 활성화됩니다!');
        // TODO: 순위표 페이지로 이동
        // window.location.href = 'leaderboard.html';
    });
}

function checkUser() {
    if (!currentUser) {
        alert('먼저 닉네임을 설정해주세요!');
        nicknameInput.focus();
        return false;
    }
    return true;
}

// ============================================
// 모달 제어
// ============================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ============================================
// 방 생성/참가 (Firebase 연동 전 임시)
// ============================================

function createRoom(maxPlayers) {
    if (!currentUser) {
        alert('먼저 닉네임을 설정해주세요!');
        return;
    }
    
    closeModal('createRoomModal');
    
    // Firebase가 초기화될 때까지 대기
    const waitForFirebase = setInterval(() => {
        if (typeof window.firebaseReady !== 'undefined' && window.firebaseReady) {
            clearInterval(waitForFirebase);
            
            // Firebase 방 생성 함수 호출
            if (typeof window.createRoomFirebase === 'function') {
                window.createRoomFirebase(maxPlayers, currentUser.fullName)
                    .then((roomCode) => {
                        window.location.href = `waiting.html?room=${roomCode}&host=true`;
                    })
                    .catch((error) => {
                        console.error('방 생성 실패:', error);
                        alert('방 생성에 실패했습니다: ' + error.message);
                    });
            } else {
                alert('Firebase 초기화 중입니다. 잠시 후 다시 시도해주세요.');
            }
        }
    }, 100);
    
    // 5초 후에도 Firebase가 준비되지 않으면 타임아웃
    setTimeout(() => {
        clearInterval(waitForFirebase);
    }, 5000);
}

function joinRoom() {
    if (!currentUser) {
        alert('먼저 닉네임을 설정해주세요!');
        return;
    }
    
    const code = roomCodeInput.value.trim().toUpperCase();
    
    if (!code) {
        alert('방 코드를 입력해주세요!');
        return;
    }
    
    if (code.length !== 6) {
        alert('방 코드는 6자리입니다!');
        return;
    }
    
    closeModal('joinRoomModal');
    
    // Firebase가 초기화될 때까지 대기
    const waitForFirebase = setInterval(() => {
        if (typeof window.firebaseReady !== 'undefined' && window.firebaseReady) {
            clearInterval(waitForFirebase);
            
            if (typeof window.joinRoomFirebase === 'function') {
                window.joinRoomFirebase(code, currentUser.fullName)
                    .then(() => {
                        window.location.href = `waiting.html?room=${code}`;
                    })
                    .catch((error) => {
                        console.error('방 참가 실패:', error);
                        alert('방 참가에 실패했습니다: ' + error.message);
                    });
            } else {
                alert('Firebase 초기화 중입니다. 잠시 후 다시 시도해주세요.');
            }
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(waitForFirebase);
    }, 5000);
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ============================================
// 페이지 로드 시 실행
// ============================================

window.addEventListener('load', init);

// ============================================
// 전역 함수 (다른 파일에서 사용)
// ============================================

function getCurrentUser() {
    return currentUser;
}
