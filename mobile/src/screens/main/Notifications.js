import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  RefreshControl,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { useToast } from "../../context/ToastContext";
import { ModernPlaceholder } from "../../components/common/ModernPlaceholder";
import { NotificationSkeleton } from "../../components/notifications/NotificationSkeleton";
import { authService } from "../../api/authService";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

export default function Notifications({ navigation }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { user: authUser, blockedUserIds } = useAuth();
  const { on } = useSocket();
  const { refreshUnreadCount, decrementUnread, clearUnread } =
    useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("All");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const tabs = ["All", "Requests", "Activity", "Messages"];

  const fetchNotifications = async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (pageNum === 1 && !shouldRefresh) setIsLoading(true);

      const response = await authService.getNotifications(pageNum, 20);
      const newNotifs = (response.data || []).filter(
        (n) => !blockedUserIds.includes(n.sender?._id || n.sender?.id),
      );

      if (shouldRefresh || pageNum === 1) {
        setNotifications(newNotifs);
        if (pageNum === 1) refreshUnreadCount(); // Sync badge on manual refresh/mount
      } else {
        setNotifications((prev) => [...prev, ...newNotifs]);
      }

      setHasMore(pageNum < (response.pages || 1));
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);

    // Listen for real-time notifications
    const off = on("notification", (notif) => {
      if (!blockedUserIds.includes(notif.sender?._id || notif.sender?.id)) {
        setNotifications((prev) => [notif, ...prev]);
      }
    });

    return () => off();
  }, [blockedUserIds]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && !isRefreshing && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedTab === "All") return true;
    if (selectedTab === "Requests")
      return n.type === "connect_request" || n.type === "group_request";
    if (selectedTab === "Activity")
      return [
        "interest_match",
        "nearby",
        "connected",
        "group_accepted",
        "referral_joined",
      ].includes(n.type);
    if (selectedTab === "Messages") return n.type === "message";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Helper for relative time
  const getRelativeTime = (date) => {
    if (!date) return "Just now";
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const markRead = async (id) => {
    try {
      await authService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => {
          if ((n._id === id || n.id === id) && !n.isRead) {
            decrementUnread();
            return { ...n, isRead: true };
          }
          return n;
        }),
      );
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await authService.markNotificationRead(); // Mark all
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      clearUnread();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      showToast("Error", "Failed to mark all as read", "error");
    }
  };

  const deleteNotification = async (id) => {
    try {
      const item = notifications.find((n) => (n._id || n.id) === id);
      await authService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== id));
      if (item && !item.isRead) decrementUnread();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      showToast("Error", "Failed to delete notification", "error");
    }
  };

  const clearAll = () => {
    Alert.alert("Clear all notifications?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          try {
            await authService.clearAllNotifications();
            setNotifications([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err) {
            showToast("Error", "Failed to clear notifications", "error");
          }
        },
      },
    ]);
  };

  const handlePress = async (item) => {
    const id = item._id || item.id;
    await markRead(id);

    switch (item.type) {
      case "message":
        if (item.sender?._id) {
          navigation.navigate("ChatRoom", { user: item.sender });
        }
        break;
      case "connect_request":
      case "connected":
      case "interest_match":
        if (item.sender?._id) {
          navigation.navigate("UserProfile", { user: item.sender });
        }
        break;
      case "group_accepted":
        if (item.data?.groupId) {
          navigation.navigate("GroupChat", {
            group: {
              _id: item.data.groupId,
              name: item.data.groupName || "Group",
            },
          });
        }
        break;
      case "referral_joined":
        navigation.navigate("Invite");
        break;
      default:
        // No navigation, just mark read
        break;
    }
  };

  const acceptRequest = async (id, name, originalId) => {
    try {
      // If it's a message_request (connection request)
      await authService.resolveConnectionRequest(originalId || id, "accepted");
      await markRead(id);
      showToast(
        "Accepted! ✅",
        `You are now connected with ${name}.`,
        "success",
      );
      fetchNotifications();
    } catch (err) {
      showToast("Error", "Failed to accept request", "error");
    }
  };

  const declineRequest = async (id, originalId) => {
    try {
      await authService.resolveConnectionRequest(originalId || id, "rejected");
      setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== id));
    } catch (err) {
      showToast("Error", "Failed to decline request", "error");
    }
  };

  const acceptGroupRequest = async (id, name, groupId) => {
    try {
      if (groupId) {
        await authService.joinGroup(groupId);
        showToast(
          "Joined! 👋",
          `You have successfully joined "${name}".`,
          "success",
        );
      }
      await markRead(id);
      fetchNotifications();
    } catch (err) {
      showToast("Error", err.message || "Failed to join group", "error");
    }
  };

  const declineGroupRequest = async (id) => {
    setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "connect_request":
        return { name: "send", bg: "#EEF2FF", color: "#6366F1" };
      case "group_request":
        return { name: "users", bg: "#FEF3C7", color: "#D97706" };
      case "interest_match":
        return { name: "heart", bg: "#FEE2E2", color: "#EF4444" };
      case "nearby":
        return { name: "map-pin", bg: "#ECFDF5", color: "#10B981" };
      case "message":
        return { name: "message-square", bg: "#E0F2FE", color: "#0EA5E9" };
      case "group_accepted":
        return { name: "check-circle", bg: "#D1FAE5", color: "#059669" };
      case "connected":
        return { name: "link", bg: "#DBEAFE", color: "#3B82F6" };
      case "referral_joined":
        return { name: "gift", bg: "#FDF2F8", color: "#DB2777" };
      default:
        return { name: "bell", bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const renderRightActions = (id) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteNotification(id)}
        activeOpacity={0.7}
      >
        <Animated.View style={styles.deleteActionContent}>
          <Feather name="trash-2" size={20} color="#FFF" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    const isActionable = item.type === "connect_request" && !item.isRead;
    const isGroupRequest = item.type === "group_request" && !item.isRead;

    const typeLabels = {
      connect_request: "Connection Request",
      group_request: "Group Invitation",
      interest_match: "New Match! 🔥",
      nearby: "Someone Nearby 📍",
      message: "New Message 💬",
      group_accepted: "Request Approved ✅",
      connected: "New Connection 👋",
      referral_joined: "Referral Reward 🎁",
    };

    const id = item._id || item.id;
    const title = typeLabels[item.type] || "New Update";
    const name = item.sender?.name || item.name || "User";
    const avatar = item.sender?.avatar || item.avatar;
    const message = item.message;
    const time = getRelativeTime(item.createdAt);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(id)}
        friction={2}
        rightThreshold={40}
        onSwipeableOpen={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
      >
        <TouchableOpacity
          style={[styles.notifCard, !item.isRead && styles.unreadCard]}
          onPress={() => handlePress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.notifLeft}>
            <View style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <ModernPlaceholder
                  name={name === "User" ? title : name}
                  size={52}
                  style={{ borderRadius: 26 }}
                />
              )}
              <View style={[styles.iconBadge, { backgroundColor: icon.bg }]}>
                <Feather name={icon.name} size={11} color={icon.color} />
              </View>
            </View>
          </View>
          <View style={styles.notifBody}>
            <Text style={styles.notifName} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.notifMessage} numberOfLines={3}>
              {message}
            </Text>
            <Text style={styles.notifTime}>{time}</Text>

            {isActionable && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.declineActionBtn}
                  onPress={() => declineRequest(id, item.data?.connectionId)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.declineActionBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptActionBtn}
                  onPress={() =>
                    acceptRequest(id, name, item.data?.connectionId)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptActionBtnText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}

            {isGroupRequest && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.declineActionBtn}
                  onPress={() => declineGroupRequest(id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.declineActionBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptActionBtn}
                  onPress={() =>
                    acceptGroupRequest(id, name, item.metadata?.groupId)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptActionBtnText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  if (isLoading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0F172A", "#1D3461", "#6366F1"]}
          style={[
            styles.header,
            { paddingTop: insets.top + 12, paddingBottom: 20 },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Notifications</Text>
        </LinearGradient>
        <NotificationSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* DARK GRADIENT HEADER */}
      <LinearGradient
        colors={["#1E1B4B", "#3730A3", "#6366F1"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} new updates`
                : "All caught up!"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearAll}
              >
                <Feather name="trash-2" size={14} color="#FECACA" />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}

            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={markAllRead}
              >
                <Feather name="check-circle" size={14} color="#FFF" />
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsRow}
        >
          {tabs.map((tab) => {
            const count =
              tab === "Requests"
                ? notifications.filter(
                    (n) =>
                      !n.isRead &&
                      (n.type === "connect_request" ||
                        n.type === "group_request"),
                  ).length
                : 0;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.activeTab]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
                {count > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#6366F1"
            colors={["#6366F1"]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() =>
          hasMore && notifications.length > 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 12,
                  color: "#94A3B8",
                  fontFamily: theme.typography.fontFamily.medium,
                }}
              >
                Loading more...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() =>
          !isLoading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="bell-off" size={40} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>
                No notifications in this category yet.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  clearAllText: {
    fontSize: 12,
    color: "#FECACA",
    fontFamily: theme.typography.fontFamily.bold,
  },
  markAllText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: theme.typography.fontFamily.bold,
  },
  tabsScroll: {
    marginHorizontal: -20,
    marginTop: 10,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#FFF",
  },
  tabText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: "rgba(255,255,255,0.5)",
  },
  activeTabText: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
  },
  tabBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "#FACC15",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 9,
    color: "#0F172A",
    fontFamily: theme.typography.fontFamily.bold,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  unreadCard: {
    backgroundColor: "#F8FBFF",
    borderColor: "#DBEAFE",
  },
  notifLeft: {
    marginRight: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E2E8F0",
  },
  iconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notifBody: {
    flex: 1,
  },
  notifName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: "center",
  },

  // ACTION BUTTONS (Accept / Decline)
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  declineActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  declineActionBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#64748B",
  },
  acceptActionBtn: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    alignItems: "center",
  },
  acceptActionBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },

  // SWIPE ACTIONS
  deleteAction: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "flex-end",
    width: 100,
    height: "88%", // Matches card height minus margin
    borderRadius: 20,
    marginBottom: 10,
    marginLeft: -20, // Overlap slightly for seamless feel
  },
  deleteActionContent: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteActionText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: 4,
  },
});
