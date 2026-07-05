import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  UNINSTANTIATED = -1,
}

export interface HeartbeatOptions {
  message?: string | ArrayBuffer | Blob;
  interval?: number; // interval in ms
}

export interface UseWebSocketOptions {
  enabled?: boolean;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number; // interval in ms
  heartbeat?: boolean | HeartbeatOptions;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
}

export interface UseWebSocketReturn {
  readyState: ReadyState;
  lastMessage: MessageEvent | null;
  sendMessage: (data: string | ArrayBuffer | ArrayBufferView | Blob | Record<string, any>) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(
  url: string | null | undefined,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    enabled = true,
    reconnect = true,
    reconnectAttempts = 10,
    reconnectInterval = 5000,
    heartbeat = false,
    onOpen,
    onClose,
    onMessage,
    onError,
  } = options;

  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.UNINSTANTIATED);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isManuallyDisconnectedRef = useRef(false);

  // Keep latest callbacks in refs to avoid restarting WebSocket connection when callbacks change
  const callbacksRef = useRef({ onOpen, onClose, onMessage, onError });
  useEffect(() => {
    callbacksRef.current = { onOpen, onClose, onMessage, onError };
  }, [onOpen, onClose, onMessage, onError]);

  // Clean up all timers and WebSocket connection silently
  const closeSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Heartbeat keep-alive sender
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    if (!heartbeat) return;

    const hbConfig = typeof heartbeat === 'boolean' ? {} : heartbeat;
    const message = hbConfig.message ?? 'ping';
    const interval = hbConfig.interval ?? 30000;

    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          // If message is an object/record, stringify it
          const payload = typeof message === 'object' && !(message instanceof ArrayBuffer) && !(message instanceof Blob)
            ? JSON.stringify(message)
            : message as string | ArrayBuffer | Blob;
          wsRef.current.send(payload);
        } catch (error) {
          console.error('[useWebSocket] Heartbeat sending failed:', error);
        }
      }
    }, interval);
  }, [heartbeat]);

  // Core connection initiator
  const connect = useCallback(() => {
    if (!url) return;

    // Reset manual disconnect flag on intentional connection request
    isManuallyDisconnectedRef.current = false;
    closeSocket();
    setReadyState(ReadyState.CONNECTING);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        // Reset reconnect attempts on successful connection
        reconnectCountRef.current = 0;
        setReadyState(ReadyState.OPEN);
        startHeartbeat();
        callbacksRef.current.onOpen?.(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        callbacksRef.current.onMessage?.(event);
      };

      ws.onerror = (event) => {
        callbacksRef.current.onError?.(event);
      };

      ws.onclose = (event) => {
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }
        setReadyState(ReadyState.CLOSED);
        callbacksRef.current.onClose?.(event);

        // Only auto-reconnect if closure was unexpected (not manual)
        if (!isManuallyDisconnectedRef.current && enabled && reconnect) {
          if (reconnectCountRef.current < reconnectAttempts) {
            reconnectCountRef.current += 1;
            reconnectTimerRef.current = setTimeout(() => {
              connect();
            }, reconnectInterval);
          }
        }
      };
    } catch (error) {
      setReadyState(ReadyState.CLOSED);

      // Simulate error event for standard handler support
      const errorEvent = new Event('error');
      callbacksRef.current.onError?.(errorEvent);

      if (!isManuallyDisconnectedRef.current && enabled && reconnect) {
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      }
    }
  }, [url, enabled, reconnect, reconnectAttempts, reconnectInterval, startHeartbeat, closeSocket]);

  // Handle URL change or enabled state change
  useEffect(() => {
    if (enabled && url) {
      connect();
    } else {
      closeSocket();
      setReadyState(ReadyState.UNINSTANTIATED);
    }

    return () => {
      closeSocket();
    };
  }, [url, enabled, connect, closeSocket]);

  // AppState listener to handle reconnecting on app foregrounding
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const isClosed = !wsRef.current || wsRef.current.readyState === WebSocket.CLOSED;
        if (enabled && url && !isManuallyDisconnectedRef.current && isClosed) {
          // Reset reconnect attempts to try freshly when active again
          reconnectCountRef.current = 0;
          connect();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [url, enabled, connect]);

  // TODO: Format the code to fit the WebSocket format
  // Send message utility
  const sendMessage = useCallback((data: string | ArrayBuffer | ArrayBufferView | Blob | Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const payload = typeof data === 'object' && !(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data) && !(data instanceof Blob)
          ? JSON.stringify(data)
          : data as string | ArrayBuffer | ArrayBufferView | Blob;
        wsRef.current.send(payload);
      } catch (error) {
        console.error('[useWebSocket] Failed to send message:', error);
      }
    } else {
      console.warn('[useWebSocket] Socket is not OPEN. Message not sent.');
    }
  }, []);

  // Manual trigger to disconnect
  const disconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = true;
    closeSocket();
    setReadyState(ReadyState.CLOSED);
  }, [closeSocket]);

  return {
    readyState,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}
