import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [latestOrder, setLatestOrder] = useState(null);
  const { isAuthenticated } = useAuth();

  // Store isAuthenticated in a ref to avoid reconnecting socket when auth state changes
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO Client] Connected to server');
    });

    socketInstance.on('new_order_received', (order) => {
      if (isAuthenticatedRef.current) {
        console.log('[Socket.IO Client] Received new order notification:', order);
        setLatestOrder(order);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.IO Client] Disconnected from server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearLatestOrder = () => {
    setLatestOrder(null);
  };

  return (
    <SocketContext.Provider value={{ socket, latestOrder, clearLatestOrder }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
