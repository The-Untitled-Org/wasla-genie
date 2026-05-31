import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ConnectionChangedMessage,
  ConnectionChangedResultMessage,
} from '#core/visualizer-types';

const requestTimeoutMs = 10000;

export function useVisualizerSocket(url?: string) {
  const socketUrl = useMemo(() => {
    if (url) return url;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }, [url]);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef(
    new Map<
      string,
      {
        resolve: () => void;
        reject: (error: Error) => void;
        timeout: ReturnType<typeof window.setTimeout>;
      }
    >()
  );
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      const result = JSON.parse(event.data as string) as Partial<ConnectionChangedResultMessage>;
      if (result.type !== 'CONNECTION_CHANGED_RESULT' || !result.requestId) return;
      const pending = pendingRef.current.get(result.requestId);
      if (!pending) return;
      window.clearTimeout(pending.timeout);
      pendingRef.current.delete(result.requestId);
      if (result.ok) {
        pending.resolve();
      } else {
        pending.reject(new Error(result.error || 'Visualizer update failed'));
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      for (const pending of pendingRef.current.values()) {
        window.clearTimeout(pending.timeout);
        pending.reject(new Error('Visualizer disconnected'));
      }
      pendingRef.current.clear();
    };
  }, [socketUrl]);

  const send = useCallback((payload: ConnectionChangedMessage['payload']): Promise<void> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Visualizer is disconnected'));
    }
    const requestId = crypto.randomUUID();
    const message: ConnectionChangedMessage = { type: 'CONNECTION_CHANGED', requestId, payload };
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        pendingRef.current.delete(requestId);
        reject(new Error('Visualizer update timed out'));
      }, requestTimeoutMs);
      pendingRef.current.set(requestId, { resolve, reject, timeout });
      wsRef.current?.send(JSON.stringify(message));
    });
  }, []);

  return { connected, send };
}
