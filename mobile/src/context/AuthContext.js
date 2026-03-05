import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { authService, setUnauthorizedHandler } from "../api/authService";
import { registerForPushNotificationsAsync } from "../utils/notifications";

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

const AUTH_TOKEN_KEY = "@bondus_auth_token";
const AUTH_USER_KEY = "@bondus_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedUserIds, setBlockedUserIds] = useState([]);

  // ── Logout: Clear both token and user ─────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      console.log("[AuthContext] Logging out...");
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);
    } catch (e) {
      console.warn("[AuthContext] Logout clear failed:", e);
    } finally {
      setToken(null);
      setUser(null);
      setBlockedUserIds([]);
      console.log("[AuthContext] Session cleared.");
    }
  }, []);

  // ── Boot: Check if user is already logged in ───────────────────────────────
  useEffect(() => {
    // Register global 401 handler to force logout on invalid session
    setUnauthorizedHandler(() => logout);

    const restoreSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Fetch fresh profile from server...
          try {
            const freshData = await authService.getMe();
            if (freshData?.success) {
              const freshUser = freshData.data.user;
              setUser(freshUser);
              await AsyncStorage.setItem(
                AUTH_USER_KEY,
                JSON.stringify(freshUser),
              );
            }
          } catch (syncErr) {
            console.warn("[AuthContext] Profile sync failed:", syncErr.message);
            // If 401 Unauthorized or any auth error, clear session
            if (
              syncErr.message?.includes("401") ||
              syncErr.message?.toLowerCase().includes("not authorized") ||
              syncErr.message?.toLowerCase().includes("token failed")
            ) {
              console.log(
                "[AuthContext] Invalid session detected, logging out...",
              );
              await logout();
            }
          }

          // Sync Push Token (Only if still logged in)
          if (storedToken) {
            try {
              const pushToken = await registerForPushNotificationsAsync();
              if (pushToken && pushToken !== parsedUser.expoPushToken) {
                await authService.updateMe({ expoPushToken: pushToken });
              }
            } catch (pushErr) {
              console.warn(
                "[AuthContext] Push token registration failed:",
                pushErr.message,
              );
            }
          }
        }
      } catch (e) {
        console.warn("[AuthContext] Session restore failed:", e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [logout]);

  const lastSyncRef = useRef(0);

  // ── GPS: Sync location with backend ──────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    const syncLocation = async () => {
      const now = Date.now();
      if (now - lastSyncRef.current < 5 * 60 * 1000) return; // Throttle: 5 mins

      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (loc?.coords) {
          const { latitude, longitude } = loc.coords;
          await authService.updateLocation(latitude, longitude);

          // Update local user state immediately so UI reflects it
          setUser((prev) => ({
            ...prev,
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          }));

          lastSyncRef.current = now;
        }
      } catch (e) {
        console.warn("[GPS] Sync failed:", e);
      }
    };

    const syncBlocked = async () => {
      try {
        const data = await authService.getBlockedUsers();
        setBlockedUserIds(data || []);
      } catch (e) {
        console.warn("[AuthContext] Blocked list sync failed:", e.message);
        if (e.message?.includes("401") || e.response?.status === 401) {
          await logout();
        }
      }
    };

    syncLocation();
    syncBlocked();
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

      // Register for push notifications after login
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await authService.updateMe({ expoPushToken: pushToken });
        }
      } catch (pushErr) {
        console.warn(
          "[AuthContext] Push registration on login failed:",
          pushErr.message,
        );
      }
    } catch (e) {
      console.warn("[AuthContext] Login save failed:", e);
      throw e;
    }
  }, []);

  // ── Update user profile in storage ────────────────────────────────────────
  const updateUser = useCallback(
    async (updatedFields) => {
      try {
        const updated = { ...user, ...updatedFields };
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
        setUser(updated);
      } catch (e) {
        console.warn("[AuthContext] User update failed:", e);
      }
    },
    [user],
  );

  const isAuthenticated = !!token && !!user;

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (loc?.coords) {
          const { latitude, longitude } = loc.coords;
          await authService.updateLocation(latitude, longitude);
          // Also update local user object to reflect new location immediately
          updateUser({
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          });
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Manual location request failed:", e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        requestLocationPermission,
        blockedUserIds,
        addToBlocked: (id) =>
          setBlockedUserIds((prev) => [...new Set([...prev, id])]),
        removeFromBlocked: (id) =>
          setBlockedUserIds((prev) => prev.filter((bid) => bid !== id)),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
