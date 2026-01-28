# 🎮 테트리스 배틀

중학생들이 즐길 수 있는 온라인 테트리스 배틀 게임입니다.

## ✨ 기능

### 1인 연습 모드
- 혼자서 연습할 수 있는 순수 테트리스
- 점수, 레벨, 제거한 줄 수 실시간 표시
- 다음 블록 미리보기
- 최고 점수 저장 (localStorage)
- 고스트 블록 (떨어질 위치 미리보기)

### 멀티플레이 배틀 모드 (2-4인)
- 실시간 온라인 대전
- 방 생성 및 참가 시스템
- 공격 시스템 (2줄 이상 제거 시 상대방 공격)
- 배틀로얄 방식 (마지막까지 생존)
- 실시간 순위 계산

## 🚀 설치 방법

### 1. 파일 다운로드
프로젝트의 모든 파일을 다운로드합니다.

```
tetris-battle/
├── index.html
├── practice.html
├── waiting.html
├── battle.html
├── css/
│   └── style.css
└── js/
    ├── tetris.js
    ├── auth.js
    ├── practice.js
    ├── firebase-config.js
    ├── waiting.js
    └── battle.js
```

### 2. Firebase 설정 (멀티플레이용)

#### 2.1 Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `tetris-battle` (또는 원하는 이름)
4. Google Analytics: 선택사항

#### 2.2 Realtime Database 활성화
1. 왼쪽 메뉴 > 빌드 > Realtime Database
2. "데이터베이스 만들기" 클릭
3. 위치: 가까운 지역 선택 (예: asia-northeast3 - Seoul)
4. 보안 규칙: "테스트 모드로 시작" 선택

#### 2.3 웹 앱 추가
1. 프로젝트 개요 > 앱 추가 > 웹 (</>) 클릭
2. 앱 닉네임: `tetris-battle-web`
3. Firebase SDK 구성 복사

#### 2.4 설정값 입력
`js/firebase-config.js` 파일을 열고 복사한 설정값을 붙여넣습니다:

```javascript
const firebaseConfig = {
    apiKey: "복사한_API_KEY",
    authDomain: "복사한_AUTH_DOMAIN",
    databaseURL: "복사한_DATABASE_URL",
    projectId: "복사한_PROJECT_ID",
    storageBucket: "복사한_STORAGE_BUCKET",
    messagingSenderId: "복사한_SENDER_ID",
    appId: "복사한_APP_ID"
};
```

### 3. GitHub Pages 배포

#### 3.1 GitHub 저장소 생성
1. [GitHub](https://github.com) 접속 및 로그인
2. "New repository" 클릭
3. Repository name: `tetris-battle`
4. Public 선택
5. "Create repository" 클릭

#### 3.2 파일 업로드
1. "uploading an existing file" 클릭
2. 모든 파일을 드래그 앤 드롭
3. "Commit changes" 클릭

#### 3.3 GitHub Pages 활성화
1. Settings > Pages
2. Source: "Deploy from a branch" 선택
3. Branch: "main" 선택, 폴더: "/ (root)"
4. "Save" 클릭

5분 정도 후 `https://your-username.github.io/tetris-battle/` 에서 접속 가능!

## 🎮 사용 방법

### 1인 연습 모드
1. 메인 화면에서 닉네임 입력
2. "1인 연습" 클릭
3. "게임 시작" 버튼 클릭

**조작법:**
- ← → : 좌우 이동
- ↑ : 회전
- ↓ : 빠르게 내리기
- Space : 바로 떨어뜨리기
- P : 일시정지

### 멀티플레이 배틀
1. 메인 화면에서 닉네임 입력

**방 만들기:**
1. "방 만들기" 클릭
2. 인원 선택 (2명/3명/4명)
3. 방 코드 복사하여 친구에게 공유
4. 친구들이 입장할 때까지 대기
5. "게임 시작" 클릭 (방장만 가능)

**방 참가하기:**
1. "방 참가하기" 클릭
2. 친구에게 받은 방 코드 입력
3. "참가" 클릭
4. 방장이 게임 시작할 때까지 대기

**게임 규칙:**
- 2줄 제거 → 모든 상대에게 1줄 공격
- 3줄 제거 → 모든 상대에게 2줄 공격
- 4줄 제거 → 모든 상대에게 3줄 공격
- 블록이 천장에 닿으면 탈락
- 마지막까지 살아남으면 1등!

## 🛠️ 기술 스택

- HTML5
- CSS3
- JavaScript (순수 JS, 라이브러리 없음)
- Firebase Realtime Database
- GitHub Pages

## 📱 지원 환경

- PC/태블릿 전용
- 최소 해상도: 1280x720
- 권장 브라우저: Chrome, Edge, Firefox

## ⚠️ 알려진 제한사항

- 모바일 미지원
- Firebase 무료 플랜 제한:
  - 동시 접속: 100명
  - 월 다운로드: 10GB
  - 저장 용량: 1GB

## 🔧 문제 해결

### "Firebase가 정의되지 않았습니다" 오류
- 인터넷 연결 확인
- Firebase SDK 스크립트가 올바르게 로드되는지 확인
- 브라우저 콘솔(F12)에서 오류 확인

### "방을 찾을 수 없습니다" 오류
- 방 코드가 정확한지 확인
- 방장이 나가면 방이 삭제됨
- Firebase 연결 상태 확인

### 게임이 동기화되지 않음
- 모든 플레이어의 인터넷 연결 확인
- Firebase Realtime Database 상태 확인
- 브라우저 새로고침 시도

## 📄 라이선스

이 프로젝트는 교육용으로 자유롭게 사용 가능합니다.

## 👨‍💻 개발자

중학교 정보 교사를 위한 프로젝트

## 📞 문의

문제가 발생하면 GitHub Issues에 등록해주세요.

---

**즐거운 테트리스 배틀 되세요! 🎮**
