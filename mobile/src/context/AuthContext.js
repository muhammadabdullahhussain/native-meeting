import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { authService } from '../api/authService';

/**
 * AuthContext — Production-Grade Session Management
 *
 * Handles:
 *  - Persistent login (user stays logged in after app close)
 *  - User object storage
 *  - Token management
 *  - Loading state while checking stored session
 *
 * Usage:
 *   const { user, token, login, logout, isLoading } = useAuth();
 */

const AuthContext = createContext({});

const AUTH_TOKEN_KEY = '@interesta_auth_token';
const AUTH_USER_KEY = '@interesta_user';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // true until we know auth state

    // ── Boot: Check if user is already logged in ───────────────────────────────
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const [storedToken, storedUser] = await Promise.all([
                    AsyncStorage.getItem(AUTH_TOKEN_KEY),
                    AsyncStorage.getItem(AUTH_USER_KEY),
                ]);

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.warn('[AuthContext] Session restore failed:', e);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    // ── GPS: Sync location with backend ──────────────────────────────────────
    useEffect(() => {
        if (!user || !token) return;

        const syncLocation = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('[GPS] Permission to access location was denied');
                    return;
                }

                let loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                if (loc?.coords) {
                    const { latitude, longitude } = loc.coords;
                    console.log(`[GPS] Syncing location: ${latitude}, ${longitude}`);
                    await authService.updateLocation(latitude, longitude);
                }
            } catch (e) {
                // On web, location often fails in local dev or if blocked
                if (Platform.OS === 'web') {
                    console.log('[GPS] Location unavailable on web browser');
                } else {
                    console.warn('[GPS] Sync failed:', e);
                }
            }
        };

        // Sync on mount/login
        syncLocation();
    }, [user?.id, token]);

    // ── Login: Save token + user to AsyncStorage ───────────────────────────────
    const login = useCallback(async (userData, authToken) => {
        try {
            await Promise.all([
                AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken),
                AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData)),
            ]);
            setToken(authToken);
            setUser(userData);
        } catch (e) {
            console.warn('[AuthContext] Login save failed:', e);
            throw e;
        }
    }, []);

    // ── Update user profile in storage ────────────────────────────────────────
    const updateUser = useCallback(async (updatedFields) => {
        try {
            const updated = { ...user, ...updatedFields };
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
            setUser(updated);
        } catch (e) {
            console.warn('[AuthContext] User update failed:', e);
        }
    }, [user]);

    // ── Logout: Clear both token and user ─────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(AUTH_TOKEN_KEY),
                AsyncStorage.removeItem(AUTH_USER_KEY),
            ]);
        } catch (e) {
            console.warn('[AuthContext] Logout clear failed:', e);
        } finally {
            setToken(null);
            setUser(null);
        }
    }, []);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            isAuthenticated,
            login,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// ── Hook ───────────────────────────────────────────────────────────────────────
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

export default AuthContext;
