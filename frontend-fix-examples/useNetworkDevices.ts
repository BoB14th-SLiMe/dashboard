/**
 * 네트워크 장치 데이터를 캐싱하여 깜빡임 없이 가져오는 Hook
 * React Query 사용 버전
 */

import { useQuery } from '@tanstack/react-query';

interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  mac?: string;
  status: 'online' | 'offline' | 'warning';
  type?: string;
  lastSeen?: string;
}

const fetchNetworkDevices = async (): Promise<NetworkDevice[]> => {
  const response = await fetch('/api/devices');
  if (!response.ok) {
    throw new Error('Failed to fetch network devices');
  }
  return response.json();
};

export const useNetworkDevices = (options = {}) => {
  return useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchNetworkDevices,

    // 캐싱 설정 - 깜빡임 방지의 핵심
    staleTime: 5000,                    // 5초간 데이터를 최신으로 간주
    gcTime: 10 * 60 * 1000,            // 10분간 캐시 유지
    refetchInterval: 10000,             // 10초마다 백그라운드 갱신

    // 가장 중요: 새 데이터 로드 중에도 이전 데이터 표시
    placeholderData: (previousData) => previousData,

    // 윈도우 포커스 시 자동 갱신 비활성화 (선택사항)
    refetchOnWindowFocus: false,

    // 재시도 설정
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    ...options,
  });
};

// 사용 예제:
// const { data: devices = [], isLoading, isFetching, error } = useNetworkDevices();
