// ============================================
// Firebase 설정 (새 프로젝트: tetris-battle-602ec)
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyAethUVhBXjlgTEw_jyT4Mxj33EWBTptWU",
    authDomain: "tetris-battle-602ec.firebaseapp.com",
    databaseURL: "https://tetris-battle-602ec-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "tetris-battle-602ec",
    storageBucket: "tetris-battle-602ec.firebasestorage.app",
    messagingSenderId: "932101718212",
    appId: "1:932101718212:web:bb850090307ba78c8dc991"
};

// Firebase 초기화
let app = null;
let auth = null;
let database = null;
let currentUserId = null;
window.firebaseReady = false;

function initFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK가 로드되지 않았습니다.');
            return;
        }

        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        database = firebase.database();
        
        console.log('✅ Firebase 초기화 성공 - tetris-battle-602ec');
        console.log('✅ Database 위치: asia-southeast1 (Singapore)');
        
        signInAnonymously();
    } catch (error) {
        console.error('❌ Firebase 초기화 실패:', error);
    }
}

// ============================================
// 익명 인증
// ============================================

function signInAnonymously() {
    auth.signInAnonymously()
        .then((userCredential) => {
            currentUserId = userCredential.user.uid;
            console.log('✅ 익명 로그인 성공:', currentUserId);
            
            window.firebaseReady = true;
            setupPresence();
        })
        .catch((error) => {
            console.error('❌ 익명 로그인 실패:', error);
        });
}

// ============================================
// 연결 상태 관리
// ============================================

function setupPresence() {
    const presenceRef = database.ref('.info/connected');
    
    presenceRef.on('value', (snapshot) => {
        if (snapshot.val()) {
            console.log('✅ Firebase 연결됨');
        } else {
            console.log('⚠️ Firebase 연결 끊김');
        }
    });
}

// ============================================
// 현재 사용자 ID 가져오기
// ============================================

window.getCurrentUserId = function() {
    return currentUserId;
};

// ============================================
// 방 관리
// ============================================

// 방 생성
window.createRoomFirebase = function(maxPlayers, hostName) {
    return new Promise((resolve, reject) => {
        if (!window.firebaseReady) {
            reject(new Error('Firebase가 아직 준비되지 않았습니다.'));
            return;
        }
        
        const roomCode = generateRoomCode();
        const roomRef = database.ref(`rooms/${roomCode}`);
        
        const roomData = {
            roomCode: roomCode,
            maxPlayers: maxPlayers,
            currentPlayers: 1,
            host: currentUserId,
            hostName: hostName,
            status: 'waiting',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            players: {
                [currentUserId]: {
                    name: hostName,
                    slot: 1,
                    ready: true,
                    isHost: true
                }
            }
        };
        
        roomRef.set(roomData)
            .then(() => {
                console.log('✅ 방 생성 성공:', roomCode);
                
                // 방장이 나가면 방 삭제
                roomRef.onDisconnect().remove();
                
                resolve(roomCode);
            })
            .catch((error) => {
                console.error('❌ 방 생성 실패:', error);
                reject(error);
            });
    });
};

// 방 참가
window.joinRoomFirebase = function(roomCode, playerName) {
    return new Promise((resolve, reject) => {
        if (!window.firebaseReady) {
            reject(new Error('Firebase가 아직 준비되지 않았습니다.'));
            return;
        }
        
        const roomRef = database.ref(`rooms/${roomCode}`);
        
        roomRef.once('value')
            .then((snapshot) => {
                if (!snapshot.exists()) {
                    reject(new Error('존재하지 않는 방입니다.'));
                    return;
                }
                
                const room = snapshot.val();
                
                if (room.currentPlayers >= room.maxPlayers) {
                    reject(new Error('방이 가득 찼습니다.'));
                    return;
                }
                
                if (room.status !== 'waiting') {
                    reject(new Error('이미 게임이 시작되었습니다.'));
                    return;
                }
                
                const updates = {};
                updates[`rooms/${roomCode}/currentPlayers`] = room.currentPlayers + 1;
                updates[`rooms/${roomCode}/players/${currentUserId}`] = {
                    name: playerName,
                    slot: room.currentPlayers + 1,
                    ready: false,
                    isHost: false
                };
                
                database.ref().update(updates)
                    .then(() => {
                        console.log('✅ 방 참가 성공:', roomCode);
                        
                        database.ref(`rooms/${roomCode}/players/${currentUserId}`)
                            .onDisconnect().remove();
                        
                        database.ref(`rooms/${roomCode}/currentPlayers`)
                            .onDisconnect().transaction((count) => {
                                return (count || 1) - 1;
                            });
                        
                        resolve(roomCode);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
};

// 방 나가기
window.leaveRoom = function(roomCode) {
    if (!window.firebaseReady || !currentUserId) {
        return Promise.reject(new Error('Firebase가 준비되지 않았습니다.'));
    }
    
    const updates = {};
    updates[`rooms/${roomCode}/players/${currentUserId}`] = null;
    
    return database.ref().update(updates)
        .then(() => {
            return database.ref(`rooms/${roomCode}/currentPlayers`).transaction((count) => {
                return (count || 1) - 1;
            });
        });
};

// 방 정보 실시간 감시
window.watchRoom = function(roomCode, callback) {
    if (!window.firebaseReady) {
        console.error('❌ Firebase가 준비되지 않았습니다.');
        return null;
    }
    
    const roomRef = database.ref(`rooms/${roomCode}`);
    
    roomRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });
    
    return roomRef;
};

// 방 감시 중단
window.unwatchRoom = function(roomRef) {
    if (roomRef) {
        roomRef.off();
    }
};

// ============================================
// 게임 상태 동기화
// ============================================

// 게임 시작 신호
window.startGameFirebase = function(roomCode) {
    if (!window.firebaseReady) {
        return Promise.reject(new Error('Firebase가 준비되지 않았습니다.'));
    }
    
    const startTime = Date.now() + 5000;
    
    return database.ref(`rooms/${roomCode}`).update({
        status: 'playing',
        startTime: startTime
    });
};

// 게임 상태 업데이트
window.updateGameState = function(roomCode, state) {
    if (!window.firebaseReady || !currentUserId) {
        return Promise.resolve();
    }
    
    return database.ref(`rooms/${roomCode}/gameStates/${currentUserId}`).set(state);
};

// 공격 전송
window.sendAttack = function(roomCode, lines) {
    if (!window.firebaseReady || !currentUserId) {
        return Promise.resolve();
    }
    
    const attackData = {
        from: currentUserId,
        lines: lines,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    return database.ref(`rooms/${roomCode}/attacks`).push(attackData);
};

// 공격 받기 감시
window.watchAttacks = function(roomCode, callback) {
    if (!window.firebaseReady || !currentUserId) {
        console.error('❌ Firebase가 준비되지 않았습니다.');
        return null;
    }
    
    const attacksRef = database.ref(`rooms/${roomCode}/attacks`);
    
    attacksRef.on('child_added', (snapshot) => {
        const attack = snapshot.val();
        if (attack.from !== currentUserId) {
            callback(attack);
            snapshot.ref.remove();
        }
    });
    
    return attacksRef;
};

// 탈락 기록
window.recordElimination = function(roomCode, finalScore) {
    if (!window.firebaseReady || !currentUserId) {
        return Promise.resolve();
    }
    
    return database.ref(`rooms/${roomCode}/eliminations/${currentUserId}`).set({
        eliminated: true,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        finalScore: finalScore
    });
};

// ============================================
// 리더보드
// ============================================

window.saveScore = function(playerName, score, won) {
    if (!window.firebaseReady) {
        return Promise.resolve();
    }
    
    const playerId = playerName.replace('#', '_');
    const playerRef = database.ref(`leaderboard/${playerId}`);
    
    return playerRef.transaction((current) => {
        if (!current) {
            return {
                displayName: playerName,
                bestScore: score,
                totalGames: 1,
                totalWins: won ? 1 : 0,
                winRate: won ? 100 : 0,
                lastPlayed: new Date().toISOString().split('T')[0]
            };
        }
        
        current.totalGames++;
        if (won) current.totalWins++;
        current.winRate = Math.round((current.totalWins / current.totalGames) * 100);
        if (score > current.bestScore) current.bestScore = score;
        current.lastPlayed = new Date().toISOString().split('T')[0];
        
        return current;
    });
};

window.getLeaderboard = function(type = 'bestScore', limit = 10) {
    if (!window.firebaseReady) {
        return Promise.resolve([]);
    }
    
    return database.ref('leaderboard')
        .orderByChild(type)
        .limitToLast(limit)
        .once('value')
        .then((snapshot) => {
            const data = [];
            snapshot.forEach((child) => {
                data.push(child.val());
            });
            return data.reverse();
        });
};

// ============================================
// 유틸리티
// ============================================

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

console.log('🔥 Firebase 설정 완료');
console.log('📍 프로젝트: tetris-battle-602ec');
console.log('🌏 위치: asia-southeast1 (Singapore)');
console.log('✅ 모든 함수 준비 완료');
