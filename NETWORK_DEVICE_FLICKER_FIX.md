# 네트워크 장치 깜빡임 문제 해결 방법

## 문제 원인

네트워크 장치 목록이 깜빡이는 주요 원인:

1. **불필요한 재렌더링**: 데이터 폴링 시 전체 컴포넌트가 다시 렌더링
2. **키 값 불안정**: 배열 아이템의 key가 매번 변경
3. **참조 동일성 문제**: 객체 참조가 매번 새로 생성되어 React가 변경으로 인식
4. **상태 초기화**: 로딩 상태 전환 시 기존 데이터가 사라짐

## 해결 방법

### 1. React Query를 사용한 캐싱 (권장)

```typescript
// hooks/useNetworkDevices.ts
import { useQuery } from '@tanstack/react-query';
import { fetchNetworkDevices } from '../api/devices';

export const useNetworkDevices = () => {
  return useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchNetworkDevices,

    // 중요: 캐싱 및 리페치 설정
    staleTime: 5000,              // 5초간 데이터를 fresh로 간주
    gcTime: 10 * 60 * 1000,       // 10분간 캐시 유지 (구 cacheTime)
    refetchInterval: 10000,        // 10초마다 자동 갱신

    // 깜빡임 방지: 새 데이터 로드 중에도 이전 데이터 유지
    placeholderData: (previousData) => previousData,

    // 또는
    // keepPreviousData: true,  // React Query v4 이하
  });
};

// 컴포넌트에서 사용
const NetworkDeviceList = () => {
  const { data: devices, isLoading, isFetching } = useNetworkDevices();

  // 첫 로딩만 로딩 UI 표시
  if (isLoading && !devices) {
    return <LoadingSpinner />;
  }

  return (
    <div className="device-list">
      {isFetching && <RefreshIndicator />} {/* 작은 새로고침 표시만 */}
      {devices?.map(device => (
        <DeviceCard
          key={device.id}  // 안정적인 ID 사용
          device={device}
        />
      ))}
    </div>
  );
};
```

### 2. 커스텀 Hook으로 캐싱 구현

React Query 사용이 어려운 경우:

```typescript
// hooks/useCachedDevices.ts
import { useState, useEffect, useRef } from 'react';

export const useCachedDevices = (refetchInterval = 10000) => {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const cacheRef = useRef([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // 첫 로딩이 아니면 백그라운드 페칭
        if (cacheRef.current.length > 0) {
          setIsFetching(true);
        }

        const response = await fetch('/api/devices');
        const newDevices = await response.json();

        // 데이터가 실제로 변경된 경우만 업데이트
        if (JSON.stringify(newDevices) !== JSON.stringify(cacheRef.current)) {
          cacheRef.current = newDevices;
          setDevices(newDevices);
        }

        setIsLoading(false);
        setIsFetching(false);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
        setIsFetching(false);
        // 에러 발생 시에도 기존 캐시 데이터 유지
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval]);

  return { devices, isLoading, isFetching };
};
```

### 3. 메모이제이션으로 불필요한 재렌더링 방지

```typescript
import { memo, useMemo } from 'react';

// 개별 장치 카드 메모이제이션
export const DeviceCard = memo(({ device }) => {
  return (
    <div className="device-card">
      <h3>{device.name}</h3>
      <p>IP: {device.ip}</p>
      <p>Status: {device.status}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // 장치 데이터가 실제로 변경된 경우만 재렌더링
  return JSON.stringify(prevProps.device) === JSON.stringify(nextProps.device);
});

// 부모 컴포넌트
const NetworkDeviceList = () => {
  const { devices } = useCachedDevices();

  // 정렬된 장치 목록 메모이제이션
  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => a.name.localeCompare(b.name));
  }, [devices]);

  return (
    <div>
      {sortedDevices.map(device => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
};
```

### 4. 안정적인 Key 사용

```typescript
// ❌ 나쁜 예 - 인덱스나 불안정한 값 사용
devices.map((device, index) => (
  <DeviceCard key={index} device={device} />
))

// ❌ 나쁜 예 - 매번 변경되는 값
devices.map((device) => (
  <DeviceCard key={Math.random()} device={device} />
))

// ✅ 좋은 예 - 안정적인 고유 ID 사용
devices.map((device) => (
  <DeviceCard key={device.id} device={device} />
))

// ✅ 좋은 예 - ID가 없는 경우 고유 속성 조합
devices.map((device) => (
  <DeviceCard key={`${device.ip}-${device.mac}`} device={device} />
))
```

### 5. CSS 애니메이션으로 부드러운 전환

깜빡임 대신 부드러운 전환:

```css
/* devices.css */
.device-card {
  transition: all 0.3s ease;
  opacity: 1;
}

.device-card.updating {
  opacity: 0.7;
}

.device-list {
  position: relative;
}

/* 새로운 장치가 추가될 때 페이드인 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.device-card.new {
  animation: fadeIn 0.3s ease;
}
```

## 완전한 예제 코드

### React Query 설치 (권장)

```bash
npm install @tanstack/react-query
# 또는
yarn add @tanstack/react-query
```

### 전체 구현 예제

```typescript
// App.tsx 또는 index.tsx
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
      <Dashboard />
    </QueryClientProvider>
  );
}

// components/NetworkDeviceList.tsx
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

const fetchDevices = async () => {
  const response = await fetch('/api/devices');
  if (!response.ok) throw new Error('Failed to fetch devices');
  return response.json();
};

const DeviceCard = memo(({ device }) => (
  <div className="device-card">
    <div className="device-name">{device.name}</div>
    <div className="device-ip">{device.ip}</div>
    <div className={`device-status ${device.status}`}>
      {device.status}
    </div>
  </div>
));

export const NetworkDeviceList = () => {
  const { data: devices = [], isLoading, isFetching } = useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchDevices,
    refetchInterval: 10000,
    placeholderData: (previousData) => previousData,
  });

  if (isLoading) {
    return <div className="loading">장치 목록 로딩 중...</div>;
  }

  return (
    <div className="network-devices">
      <div className="header">
        <h2>네트워크 장치</h2>
        {isFetching && <span className="refresh-indicator">🔄</span>}
      </div>
      <div className="device-grid">
        {devices.map(device => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
};
```

## SSE(Server-Sent Events) 사용 시

만약 백엔드에서 SSE를 통해 실시간 업데이트를 보내는 경우:

```typescript
import { useState, useEffect } from 'react';

export const useDeviceSSE = () => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/devices/stream');

    eventSource.onmessage = (event) => {
      const newDevice = JSON.parse(event.data);

      // 기존 장치 업데이트 또는 새 장치 추가
      setDevices(prev => {
        const index = prev.findIndex(d => d.id === newDevice.id);
        if (index >= 0) {
          // 불변성 유지하며 업데이트
          const updated = [...prev];
          updated[index] = newDevice;
          return updated;
        }
        return [...prev, newDevice];
      });
    };

    return () => eventSource.close();
  }, []);

  return devices;
};
```

## 적용 순서

1. **React Query 설치 및 설정** (가장 효과적)
2. **placeholderData 옵션 활성화**
3. **안정적인 key 값 확인**
4. **DeviceCard 컴포넌트 메모이제이션**
5. **CSS 전환 효과 추가** (선택사항)

## 디버깅

깜빡임이 여전히 발생하면:

```typescript
// React DevTools Profiler 사용
// 또는 console.log로 재렌더링 추적

const DeviceCard = ({ device }) => {
  console.log(`DeviceCard ${device.id} rendered`);
  return <div>...</div>;
};
```

불필요한 재렌더링이 발생하는지 확인하고, 해당 컴포넌트에 `memo`를 적용하세요.
