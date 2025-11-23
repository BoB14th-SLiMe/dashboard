/**
 * 네트워크 장치 목록 컴포넌트
 * 깜빡임 없이 장치 목록을 표시
 */

import { memo } from 'react';
import { useNetworkDevices } from './useNetworkDevices';

interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  mac?: string;
  status: 'online' | 'offline' | 'warning';
  type?: string;
  lastSeen?: string;
}

// 개별 장치 카드 - 메모이제이션으로 불필요한 재렌더링 방지
const DeviceCard = memo<{ device: NetworkDevice }>(({ device }) => {
  return (
    <div className={`device-card status-${device.status}`}>
      <div className="device-header">
        <h3 className="device-name">{device.name}</h3>
        <span className={`status-badge ${device.status}`}>
          {device.status === 'online' ? '🟢' : device.status === 'offline' ? '🔴' : '🟡'}
          {device.status}
        </span>
      </div>
      <div className="device-details">
        <div className="detail-row">
          <span className="label">IP:</span>
          <span className="value">{device.ip}</span>
        </div>
        {device.mac && (
          <div className="detail-row">
            <span className="label">MAC:</span>
            <span className="value">{device.mac}</span>
          </div>
        )}
        {device.type && (
          <div className="detail-row">
            <span className="label">Type:</span>
            <span className="value">{device.type}</span>
          </div>
        )}
        {device.lastSeen && (
          <div className="detail-row">
            <span className="label">Last Seen:</span>
            <span className="value">{new Date(device.lastSeen).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 장치 데이터가 실제로 변경된 경우만 재렌더링
  return JSON.stringify(prevProps.device) === JSON.stringify(nextProps.device);
});

DeviceCard.displayName = 'DeviceCard';

// 메인 네트워크 장치 목록 컴포넌트
export const NetworkDeviceList = () => {
  const { devices = [], isLoading, isFetching, error, refetch } = useNetworkDevices();

  // 첫 로딩만 로딩 UI 표시
  if (isLoading && devices.length === 0) {
    return (
      <div className="network-devices loading-state">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>네트워크 장치 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error && devices.length === 0) {
    return (
      <div className="network-devices error-state">
        <div className="error-message">
          <p>⚠️ 장치 목록을 불러올 수 없습니다.</p>
          <p className="error-detail">{error.message}</p>
          <button onClick={refetch} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="network-devices">
      <div className="devices-header">
        <h2>네트워크 장치</h2>
        <div className="header-actions">
          {isFetching && (
            <span className="refresh-indicator" title="데이터 갱신 중">
              🔄 갱신 중
            </span>
          )}
          <span className="device-count">
            총 {devices.length}개 장치
          </span>
          <button
            onClick={refetch}
            className="refresh-button"
            disabled={isFetching}
          >
            새로고침
          </button>
        </div>
      </div>

      {error && devices.length > 0 && (
        <div className="warning-banner">
          최신 데이터를 가져오는데 실패했습니다. 캐시된 데이터를 표시합니다.
        </div>
      )}

      <div className="device-grid">
        {devices.length === 0 ? (
          <div className="empty-state">
            <p>네트워크 장치가 없습니다.</p>
          </div>
        ) : (
          devices.map(device => (
            <DeviceCard
              key={device.id}  // 안정적인 ID 사용 - 매우 중요!
              device={device}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NetworkDeviceList;
