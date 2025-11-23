# 네트워크 장치 깜빡임 수정 가이드

## 문제 설명

대시보드에서 네트워크 장치 목록이 주기적으로 새로고침될 때 깜빡이는 현상이 발생합니다. 이는 사용자 경험을 해치고 데이터를 읽기 어렵게 만듭니다.

## 해결 방법

이 디렉토리에는 깜빡임 문제를 해결하기 위한 완전한 구현 예제가 포함되어 있습니다.

## 파일 설명

### 1. `useNetworkDevices.ts` (React Query 버전) ⭐ 권장
- React Query를 사용한 캐싱 구현
- 가장 간단하고 효과적인 방법
- 자동 캐싱, 재시도, 백그라운드 갱신 지원

### 2. `useNetworkDevicesNoQuery.ts` (순수 React 버전)
- React Query 없이 구현한 버전
- 기존 프로젝트에 큰 변경 없이 적용 가능
- 수동으로 캐싱 로직 구현

### 3. `NetworkDeviceList.tsx`
- 완전한 컴포넌트 구현 예제
- 메모이제이션 적용
- 로딩/에러 상태 처리

### 4. `NetworkDeviceList.css`
- 부드러운 전환 효과
- 반응형 디자인
- 상태별 시각적 피드백

## 적용 방법

### 옵션 1: React Query 사용 (권장)

#### 1단계: React Query 설치

```bash
cd frontend
npm install @tanstack/react-query
# 또는
yarn add @tanstack/react-query
```

#### 2단계: QueryClient 설정

`frontend/src/main.tsx` 또는 `App.tsx`에 추가:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 기존 앱 컴포넌트 */}
    </QueryClientProvider>
  );
}
```

#### 3단계: Hook 및 컴포넌트 복사

```bash
# frontend 디렉토리에서
cp ../frontend-fix-examples/useNetworkDevices.ts ./src/hooks/
cp ../frontend-fix-examples/NetworkDeviceList.tsx ./src/components/
cp ../frontend-fix-examples/NetworkDeviceList.css ./src/components/
```

#### 4단계: API 엔드포인트 수정

`useNetworkDevices.ts`에서 실제 API 엔드포인트로 수정:

```typescript
const fetchNetworkDevices = async (): Promise<NetworkDevice[]> => {
  const response = await fetch('/api/devices'); // 실제 엔드포인트로 변경
  if (!response.ok) {
    throw new Error('Failed to fetch network devices');
  }
  return response.json();
};
```

#### 5단계: 기존 컴포넌트 교체

기존의 네트워크 장치 컴포넌트를 새로운 `NetworkDeviceList`로 교체하세요.

### 옵션 2: React Query 없이 적용

React Query를 사용하고 싶지 않은 경우:

#### 1단계: Hook 복사

```bash
cp ../frontend-fix-examples/useNetworkDevicesNoQuery.ts ./src/hooks/useNetworkDevices.ts
```

#### 2단계: 나머지 파일 복사 및 적용

나머지는 옵션 1과 동일합니다.

## 핵심 개념

### 1. placeholderData (React Query)

```typescript
placeholderData: (previousData) => previousData
```

새 데이터를 가져오는 동안 이전 데이터를 계속 표시하여 깜빡임 방지

### 2. 안정적인 Key 값

```typescript
// ❌ 나쁜 예
{devices.map((device, index) => (
  <DeviceCard key={index} device={device} />
))}

// ✅ 좋은 예
{devices.map((device) => (
  <DeviceCard key={device.id} device={device} />
))}
```

### 3. 메모이제이션

```typescript
const DeviceCard = memo(({ device }) => {
  // ...
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.device) === JSON.stringify(nextProps.device);
});
```

불필요한 재렌더링 방지

### 4. CSS 전환 효과

```css
.device-card {
  transition: all 0.3s ease;
}
```

변경사항이 부드럽게 전환되도록 함

## 테스트

적용 후 다음을 확인하세요:

1. **깜빡임 제거**: 10초마다 데이터가 갱신되지만 목록이 깜빡이지 않음
2. **로딩 상태**: 첫 로딩 시에만 로딩 스피너 표시
3. **백그라운드 갱신**: 작은 "갱신 중" 표시만 나타남
4. **에러 처리**: 에러 발생 시에도 기존 데이터 유지

## 디버깅

### React DevTools Profiler 사용

1. Chrome DevTools → Profiler 탭 열기
2. 녹화 시작
3. 데이터 갱신 대기
4. 어떤 컴포넌트가 재렌더링되는지 확인

### Console 로그로 확인

```typescript
const DeviceCard = memo(({ device }) => {
  console.log(`DeviceCard ${device.id} rendered`);
  return <div>...</div>;
});
```

같은 장치가 반복적으로 렌더링되면 메모이제이션이 작동하지 않는 것입니다.

## 추가 최적화

### React Query DevTools 설치 (개발 환경)

```bash
npm install @tanstack/react-query-devtools
```

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

캐시 상태, 쿼리 실행 상황 등을 실시간으로 확인할 수 있습니다.

## 설정 커스터마이징

### 갱신 주기 변경

```typescript
const { data: devices } = useNetworkDevices({
  refetchInterval: 5000, // 5초마다 갱신
});
```

### Stale 시간 조정

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000, // 10초간 fresh로 유지
    },
  },
});
```

## 문제 해결

### Q: 여전히 깜빡입니다

**A:** 다음을 확인하세요:
1. `placeholderData` 옵션이 설정되어 있는지
2. 장치의 `key`가 안정적인 ID를 사용하는지
3. `DeviceCard`가 `memo`로 감싸져 있는지

### Q: 데이터가 갱신되지 않습니다

**A:**
1. `refetchInterval` 설정 확인
2. `staleTime`이 너무 길지 않은지 확인
3. 네트워크 탭에서 API 호출이 발생하는지 확인

### Q: 첫 로딩이 너무 오래 걸립니다

**A:**
1. API 응답 시간 확인
2. 백엔드 쿼리 최적화
3. 페이지네이션 고려

## 참고 자료

- [React Query 공식 문서](https://tanstack.com/query/latest)
- [React.memo 문서](https://react.dev/reference/react/memo)
- [React 성능 최적화](https://react.dev/learn/render-and-commit)

## 지원

문제가 계속되면 다음 정보와 함께 문의하세요:
- 브라우저 콘솔 에러
- 네트워크 탭 스크린샷
- 현재 사용 중인 코드
