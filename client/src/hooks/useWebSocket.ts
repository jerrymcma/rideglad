import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketProps {
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket({ onMessage }: UseWebSocketProps = {}) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Use wss for secure connections in production, ws for development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Identify user type to server
        if (user.userType === 'driver') {
          wsRef.current?.send(JSON.stringify({
            type: 'driver_online',
            driverId: user.id
          }));
        } else {
          wsRef.current?.send(JSON.stringify({
            type: 'rider_connected',
            riderId: user.id
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (user) {
            connect();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      if (user?.userType === 'driver') {
        wsRef.current.send(JSON.stringify({
          type: 'driver_offline',
          driverId: user.id
        }));
      }
      wsRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const sendLocationUpdate = (location: { lat: number; lng: number }) => {
    if (user?.userType === 'driver') {
      sendMessage({
        type: 'location_update',
        userType: 'driver',
        driverId: user.id,
        location: location
      });
    }
  };

  useEffect(() => {
    if (user) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [user]);

  return {
    isConnected,
    sendMessage,
    sendLocationUpdate,
    connect,
    disconnect
  };
}