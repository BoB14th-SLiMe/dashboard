/**
 * 네트워크 장치 데이터를 캐싱하여 깜빡임 없이 가져오는 Hook
 * React Query 없이 순수 React Hook으로 구현
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  mac?: string;
  status: 'online' | 'offline' | 'warning';
  type?: string;
  lastSeen?: string;
}

interface UseNetworkDevicesOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export const useNetworkDevices = (options: UseNetworkDevicesOptions = {}) => {
  const { refetchInterval = 10000, enabled = true } = options;

  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 캐시된 데이터를 ref로 보관 - 깜빡임 방지
  const cacheRef = useRef<NetworkDevice[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDevices = useCallback(async (isInitialLoad = false) => {
    if (!enabled) return;

    try {
      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // 첫 로딩이 아니면 백그라운드 페칭 표시
      if (cacheRef.current.length > 0 && !isInitialLoad) {
        setIsFetching(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch('/api/devices', {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newDevices: NetworkDevice[] = await response.json();

      // 데이터가 실제로 변경된 경우만 상태 업데이트
      // 이렇게 하면 불필요한 재렌더링 방지
      const hasChanged = JSON.stringify(newDevices) !== JSON.stringify(cacheRef.current);

      if (hasChanged) {
        cacheRef.current = newDevices;
        setDevices(newDevices);
      }

      setError(null);
      setIsLoading(false);
      setIsFetching(false);
    } catch (err) {
      // AbortError는 무시 (의도적인 취소)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Failed to fetch network devices:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsFetching(false);

      // 에러 발생 시에도 첫 로딩이 아니면 기존 캐시 데이터 유지
      if (cacheRef.current.length > 0) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  // 초기 로드 및 폴링
  useEffect(() => {
    if (!enabled) return;

    fetchDevices(true);

    // 주기적 갱신
    const interval = setInterval(() => {
      fetchDevices(false);
    }, refetchInterval);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDevices, refetchInterval, enabled]);

  // 수동 갱신 함수
  const refetch = useCallback(() => {
    return fetchDevices(false);
  }, [fetchDevices]);

  return {
    devices,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

// 사용 예제:
// const { devices, isLoading, isFetching, error, refetch } = useNetworkDevices({ refetchInterval: 10000 });
