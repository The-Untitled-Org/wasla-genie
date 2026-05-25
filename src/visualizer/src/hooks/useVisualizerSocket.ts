import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ConnectionChangedMessage } from '../../../core/visualizer-types';

export function useVisualizerSocket(url?: string) {
  const socketUrl = useMemo(() => {
    if (url) return url;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }, [url]);

  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [socketUrl]);

  const send = useCallback((message: ConnectionChangedMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify(message));
  }, []);

  return { connected, send };
}
