import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { authService } from "../api/authService";
import * as Haptics from "expo-haptics";

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const { user, token, blockedUserIds, logout } = useAuth();
  const { on } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const count = await authService.getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (err) {
      console.warn(
        "[NotificationContext] Failed to fetch unread count:",
        err.message,
      );
      if (
        err.message?.includes("401") ||
        err.message?.toLowerCase().includes("not authorized")
      ) {
        logout();
      }
    }
  }, [token, logout]);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    refreshUnreadCount();

    // Real-time listener
    const off = on("notification", (notif) => {
      // Only increment if not from a blocked user
      const senderId = notif.sender?._id || notif.sender?.id;
      if (senderId && blockedUserIds.includes(senderId)) return;

      setUnreadCount((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    return () => off();
  }, [token, blockedUserIds, on, refreshUnreadCount]);

  const decrementUnread = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        decrementUnread,
        clearUnread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  return ctx;
};

export default NotificationContext;
