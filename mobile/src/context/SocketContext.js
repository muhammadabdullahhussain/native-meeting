import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

const SocketContext = createContext({});

import { SOCKET_URL } from '../config';

export const SocketProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const queueRef = useRef([]);

    useEffect(() => {
        if (user && token) {
            const newSocket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
            });

            newSocket.on('connect', () => {
                setIsConnected(true);
                console.log('🔌 Socket connected:', newSocket.id);
                newSocket.emit('join', user.id);
                const pending = [...queueRef.current];
                queueRef.current = [];
                pending.forEach((item) => {
                    if (item.type === 'ack') {
                        newSocket.timeout(5000).emit(item.event, item.data, (err, res) => {
                            if (err) item.reject(err);
                            else item.resolve(res);
                        });
                    } else {
                        newSocket.emit(item.event, item.data);
                    }
                });
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
                console.log('❌ Socket disconnected');
            });
            newSocket.on('connect_error', (e) => {
                setIsConnected(false);
                console.warn('Socket connect_error:', e?.message || e);
            });
            newSocket.on('reconnect_attempt', (n) => {
                console.log('Socket reconnect_attempt:', n);
            });
            newSocket.on('reconnect', (n) => {
                setIsConnected(true);
                console.log('Socket reconnect:', n);
            });
            newSocket.on('reconnect_error', (e) => {
                console.warn('Socket reconnect_error:', e?.message || e);
            });
            newSocket.on('reconnect_failed', () => {
                console.warn('Socket reconnect_failed');
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user, token]);

    const emit = useCallback((event, data) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        } else {
            queueRef.current.push({ type: 'fire', event, data });
        }
    }, [socket, isConnected]);

    const emitWithAck = useCallback((event, data) => {
        return new Promise((resolve, reject) => {
            if (socket && isConnected) {
                socket.timeout(5000).emit(event, data, (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                });
            } else {
                queueRef.current.push({ type: 'ack', event, data, resolve, reject });
            }
        });
    }, [socket, isConnected]);

    const on = useCallback((event, callback) => {
        if (socket) {
            socket.on(event, callback);
            return () => socket.off(event, callback);
        }
        return () => { }; // Fallback no-op to prevent unmount crashes
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, emit, emitWithAck, on }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export default SocketContext;
