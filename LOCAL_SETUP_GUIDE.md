# 로컬 환경에서 작업하기

## 현재 상황

원격 브랜치 `claude/fix-network-device-flicker-015jNmdN1z2jvscUBUZJeZmx`에 다음 커밋들이 푸시되어 있습니다:
- 백엔드 서브모듈 업데이트
- 네트워크 장치 깜빡임 수정 솔루션

## 로컬로 가져오기

### 1. 로컬의 변경사항 확인 및 정리

```bash
cd ~/dashboard

# 현재 브랜치와 상태 확인
git status

# 변경사항이 있다면 커밋 또는 stash
git stash  # 임시 저장
# 또는
git add .
git commit -m "작업 중인 변경사항"
```

### 2. 원격 브랜치 가져오기

```bash
# 원격 정보 업데이트
git fetch origin

# 브랜치 체크아웃
git checkout claude/fix-network-device-flicker-015jNmdN1z2jvscUBUZJeZmx

# 또는 이미 해당 브랜치에 있다면 pull
git pull origin claude/fix-network-device-flicker-015jNmdN1z2jvscUBUZJeZmx
```

### 3. 파일 확인

```bash
# 새로 추가된 파일들 확인
ls -la NETWORK_DEVICE_FLICKER_FIX.md
ls -la frontend-fix-examples/

# 문서 읽기
cat NETWORK_DEVICE_FLICKER_FIX.md
cat frontend-fix-examples/README.md
```

## 프론트엔드 서브모듈 초기화

프론트엔드 코드를 수정하려면 서브모듈을 초기화해야 합니다:

```bash
# 서브모듈 초기화
git submodule update --init --recursive

# 또는 frontend만
git submodule update --init frontend
```

서브모듈 인증 문제가 발생하면:

```bash
# SSH 키가 설정되어 있는 경우
git config --file .gitmodules submodule.frontend.url git@github.com:BoB14th-SLiMe/frontend.git
git submodule sync
git submodule update --init frontend
```

## 솔루션 적용하기

### React Query 방식 (권장)

```bash
cd frontend

# React Query 설치
npm install @tanstack/react-query

# 예제 파일 복사
cp ../frontend-fix-examples/useNetworkDevices.ts ./src/hooks/
cp ../frontend-fix-examples/NetworkDeviceList.tsx ./src/components/
cp ../frontend-fix-examples/NetworkDeviceList.css ./src/components/
```

그 다음 `frontend-fix-examples/README.md`의 가이드를 따라 적용하세요.

### 순수 React 방식

```bash
cd frontend

# React Query 없이 사용하는 Hook 복사
cp ../frontend-fix-examples/useNetworkDevicesNoQuery.ts ./src/hooks/useNetworkDevices.ts
cp ../frontend-fix-examples/NetworkDeviceList.tsx ./src/components/
cp ../frontend-fix-examples/NetworkDeviceList.css ./src/components/
```

## 현재 네트워크 장치 컴포넌트 찾기

프론트엔드에서 현재 사용 중인 컴포넌트를 찾으려면:

```bash
cd frontend

# 네트워크 장치 관련 파일 검색
find src -type f -name "*device*" -o -name "*network*" -o -name "*Device*" -o -name "*Network*"

# 또는 코드 검색
grep -r "network.*device" src/ --include="*.tsx" --include="*.ts"
grep -r "fetch.*device" src/ --include="*.tsx" --include="*.ts"
```

## API 엔드포인트 확인

백엔드 API를 확인하려면:

```bash
cd backend

# 장치 관련 컨트롤러 찾기
find . -name "*Device*" -o -name "*Asset*"

# API 엔드포인트 확인
grep -r "@GetMapping.*device" src/ --include="*.java"
grep -r "@GetMapping.*asset" src/ --include="*.java"
```

## 테스트

```bash
# Docker로 전체 스택 실행
cd ~/dashboard
docker-compose up -d

# 로그 확인
docker-compose logs -f frontend
docker-compose logs -f backend

# 브라우저에서 확인
# http://localhost:80 또는 http://localhost:5173
```

## Stash한 변경사항 복구

작업 전에 stash했다면:

```bash
# stash 목록 확인
git stash list

# 가장 최근 stash 복구
git stash pop

# 특정 stash 복구
git stash apply stash@{0}
```

## 문제 해결

### teleport 에러가 계속 발생하면

```bash
# 모든 변경사항 상태 확인
git status

# 추적되지 않은 파일 포함 모든 변경사항 확인
git status --ignored

# 서브모듈 상태 확인
git submodule status

# 서브모듈 변경사항 확인
cd backend
git status
cd ../frontend
git status
cd ..
```

서브모듈에 변경사항이 있다면:

```bash
# 서브모듈 변경사항 되돌리기
git submodule foreach 'git reset --hard'

# 서브모듈을 원래 커밋으로
git submodule update --init --recursive
```

## 다음 단계

1. ✅ 로컬로 브랜치 체크아웃
2. ✅ 파일 확인 (NETWORK_DEVICE_FLICKER_FIX.md, frontend-fix-examples/)
3. ✅ 프론트엔드 서브모듈 초기화
4. ✅ 현재 네트워크 장치 컴포넌트 찾기
5. ✅ 예제 코드 복사 및 적용
6. ✅ API 엔드포인트 수정
7. ✅ 테스트

도움이 필요하면 언제든 물어보세요!
