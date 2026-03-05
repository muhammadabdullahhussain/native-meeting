import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/authService";
import { useSocket } from "../../context/SocketContext";
import { ModernPlaceholder } from "../../components/common/ModernPlaceholder";
import { EmptyState } from "../../components/common/EmptyState";
import PremiumModal from "../../components/PremiumModal";
import PremiumBadge from "../../components/PremiumBadge";
import { Share, Clipboard } from "react-native";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Component ────────────────────────────────────────────────────────────────
export default function Connections({ navigation, route }) {
  const { user: authUser, blockedUserIds, addToBlocked } = useAuth();
  const myInterests = authUser?.interests || [];

  const INTEREST_GROUP_MATCH = (group, interests) =>
    (group.tags || []).some((t) =>
      (interests || []).some(
        (i) =>
          t.toLowerCase().includes(i.toLowerCase()) ||
          i.toLowerCase().includes(t.toLowerCase()),
      ),
    );
  const insets = useSafeAreaInsets();
  const { showToast, confirmAction } = useToast();
  const { on } = useSocket();

  // Cascading ID check for React keys
  const getSafeId = (item, suffix = "") => {
    if (!item) return `null-${Math.random()}${suffix}`;
    if (typeof item === "string") return item + suffix;
    const raw =
      item._id ||
      item.id ||
      item.user?._id ||
      item.user?.id ||
      item.user ||
      item;
    if (typeof raw === "string") return raw + suffix;
    if (raw && typeof raw === "object") {
      const str = raw.toString();
      if (str && str !== "[object Object]") return str + suffix;
      const deep = raw._id || raw.id;
      if (deep) return deep.toString() + suffix;
    }
    return `fb-${Math.random()}${suffix}`;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [requests, setRequests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("Messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalType, setPremiumModalType] = useState("generic");
  const [inviteCount, setInviteCount] = useState(authUser?.referralCount || 0);
  const [unlockedPasses, setUnlockedPasses] = useState(
    authUser?.unlockedGroupPasses || 0,
  );

  const fetchData = async () => {
    try {
      const [
        friendsData,
        pendingData,
        groupsData,
        myGroupsData,
        onlineData,
        meData,
      ] = await Promise.all([
        authService.getConnections(),
        authService.getPendingRequests(),
        authService.getGroups(),
        authService.getMyGroups(),
        authService.getOnlineUsers(10),
        authService.getMe(),
      ]);

      if (meData?.success) {
        setInviteCount(meData.data.user.referralCount || 0);
        setUnlockedPasses(meData.data.user.unlockedGroupPasses || 0);
      }

      // Format friends into chats
      const formattedFriends = friendsData.map((f) => ({
        id: f.connectionId, // ← was f._id (undefined). API returns connectionId
        user: f.user,
        lastMessage: f.lastMessage?.text || "Say hello! 👋",
        timestamp: f.lastMessage?.createdAt
          ? new Date(f.lastMessage.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
          : f.connectedAt
            ? new Date(f.connectedAt).toLocaleDateString()
            : "",
        unreadCount: f.unreadCount || 0,
        type: "direct",
      }));

      // Format groups into chats
      const formattedGroups = myGroupsData.map((g) => ({
        id: g._id,
        user: { name: g.name, avatar: g.emoji || "👥" },
        lastMessage: "Group Chat",
        timestamp: "",
        unreadCount: 0,
        type: "group",
        groupData: g,
      }));

      setChats(
        [...formattedFriends, ...formattedGroups].filter(
          (c) =>
            c.type === "group" ||
            !blockedUserIds.includes(c.user?._id || c.user?.id),
        ),
      );

      // Only show requests where the current user is the RECEIVER (incoming requests)
      // Only show requests where the current user is the RECEIVER (incoming requests)
      const myId = String(authUser?._id || authUser?.id || "");
      setRequests(
        pendingData.filter((r) => {
          const recId = String(r.receiver?._id || r.receiver?.id || "");
          const isIncoming = recId === myId;
          const senderId = String(r.requester?._id || r.requester?.id || "");
          const isNotBlocked = !blockedUserIds.includes(senderId);
          return isIncoming && isNotBlocked;
        }),
      );
      setGroups(groupsData);
      setMyGroups(myGroupsData);
      setOnlineUsers(
        onlineData.filter((u) => !blockedUserIds.includes(u.id || u._id)),
      );
      setMyJoinedGroups(myGroupsData.map((g) => g._id));
      const meId = String(authUser?._id || authUser?.id || "");
      const pendingGroupIds =
        (groupsData || [])
          .filter((g) =>
            (g.pendingRequests || []).some(
              (uid) => String(uid?._id || uid || "") === meId,
            ),
          )
          .map((g) => g._id || g.id) || [];
      setRequestedGroups(pendingGroupIds);
    } catch (err) {
      console.error("[Connections] Fetch Error:", err);
      showToast("Error", "Failed to load connections", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const off1 = on("connect_request", () => fetchData());
    const off2 = on("new_message", () => fetchData());
    const off3 = on("notification", () => fetchData());

    const offPresence = on("user_presence", (data) => {
      // Update individual chat online status in the list
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.user?._id === data.userId || chat.user?.id === data.userId) {
            return {
              ...chat,
              user: { ...chat.user, isOnline: data.status === "online" },
            };
          }
          return chat;
        }),
      );

      // Update the "People Online" / "People Nearby" horizontal strip
      setOnlineUsers((prev) => {
        const exists = prev.find((u) => (u.id || u._id) === data.userId);
        if (data.status === "online") {
          // Instead of fetching, we wait for next refresh to get full object if needed
          // or just update local flag if it exists
          return prev;
        } else {
          return prev.filter((u) => (u.id || u._id) !== data.userId);
        }
      });
    });

    return () => {
      off1();
      off2();
      off3();
      offPresence();
    };
  }, [on, blockedUserIds]);

  const [requestedGroups, setRequestedGroups] = useState([]);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [mutedChats, setMutedChats] = useState([]);
  const [filterMode, setFilterMode] = useState("All");
  const [chatOptionsVisible, setChatOptionsVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [myJoinedGroups, setMyJoinedGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  const MAX_FREE_CONVOS = 30;
  const isPremium = authUser?.isPremium || false;
  const isNearLimit = !isPremium && chats.length >= 25;
  const isAtLimit = !isPremium && chats.length >= MAX_FREE_CONVOS;

  // Derived lists
  const pinnedList = chats.filter((c) => pinnedChats.includes(c.id));
  const unpinnedList = chats.filter((c) => !pinnedChats.includes(c.id));

  const totalUnread = chats.reduce((a, c) => a + (c.unreadCount || 0), 0);

  const filteredChats = (list) => {
    let base = list.filter((c) => {
      const name =
        c.user?.name || (c.type === "group" ? c.groupData?.name : "Unknown");
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    if (filterMode === "Unread") return base.filter((c) => c.unreadCount > 0);
    if (filterMode === "Online") return base.filter((c) => c.user?.isOnline);
    return base;
  };

  const openChatOptions = (chat) => {
    setSelectedChat(chat);
    setChatOptionsVisible(true);
  };
  const togglePin = () => {
    if (!selectedChat) return;
    setPinnedChats((p) =>
      p.includes(selectedChat.id)
        ? p.filter((id) => id !== selectedChat.id)
        : [...p, selectedChat.id],
    );
    setChatOptionsVisible(false);
  };
  const toggleMute = () => {
    if (!selectedChat) return;
    setMutedChats((m) =>
      m.includes(selectedChat.id)
        ? m.filter((id) => id !== selectedChat.id)
        : [...m, selectedChat.id],
    );
    setChatOptionsVisible(false);
  };

  const blockUser = () => {
    if (!selectedChat) return;
    confirmAction({
      title: "Block User? 🚫",
      message: `Are you sure you want to block ${selectedChat.user.name}? They won't be able to message you or see your profile.`,
      onConfirm: async () => {
        try {
          const blockId = selectedChat.user._id || selectedChat.user.id;
          await authService.blockUser(blockId);
          addToBlocked(blockId); // Sync with context
          setChats((c) => c.filter((x) => x.id !== selectedChat.id));
          setChatOptionsVisible(false);
          showToast(
            "User Blocked",
            `${selectedChat.user.name} has been restricted.`,
            "success",
          );
          fetchData();
        } catch (err) {
          showToast("Error", err.message || "Failed to block user", "error");
        }
      },
      confirmText: "Block",
      confirmStyle: "destructive",
    });
  };

  const acceptRequest = async (req) => {
    try {
      await authService.resolveConnectionRequest(req._id, "accepted");
      showToast(
        "✅ Accepted!",
        `You are now connected with ${req.requester.name}.`,
        "success",
      );
      fetchData();
    } catch (err) {
      showToast("Error", "Failed to accept request", "error");
    }
  };

  const declineRequest = async (req) => {
    confirmAction({
      title: "Decline Request?",
      message: `Remove the message request from ${req.requester.name}?`,
      onConfirm: async () => {
        try {
          await authService.resolveConnectionRequest(req._id, "rejected");
          fetchData();
        } catch (err) {
          showToast("Error", "Failed to decline request", "error");
        }
      },
      confirmText: "Decline",
      confirmStyle: "destructive",
    });
  };

  const requestToJoinGroup = async (groupId) => {
    try {
      await authService.joinGroup(groupId);
      showToast(
        "Request Sent! ✉️",
        "Your request to join the group has been sent.",
        "success",
      );
      const me = await authService.getMe();
      if (me?.success) {
        setInviteCount(me.data.user.referralCount || 0);
        setUnlockedPasses(me.data.user.unlockedGroupPasses || 0);
        // If pass consumed (0) and still not premium, prompt invite modal again
        if (!isPremium && (me.data.user.unlockedGroupPasses || 0) === 0) {
          setPremiumModalType("limit");
          setShowPremiumModal(true);
        }
      }
      fetchData();
    } catch (err) {
      showToast("Error", err.message || "Failed to send request", "error");
    }
  };

  const toggleGroupMember = (userId) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      showToast("Group Name", "Please enter a group name.", "info");
      return;
    }
    if (selectedGroupMembers.length < 1) {
      showToast("Add Members", "Add at least one member.", "info");
      return;
    }

    try {
      const groupData = {
        name: groupName.trim(),
        description: `Group chat for ${groupName.trim()}`,
        interest: "General",
        members: selectedGroupMembers,
      };

      const response = await authService.createGroup(groupData);
      if (response.success) {
        setShowCreateGroup(false);
        setGroupName("");
        setSelectedGroupMembers([]);
        showToast("Success! 🚀", "Group created successfully", "success");
        fetchData();
        navigation.navigate("GroupChat", { group: response.data });
      }
    } catch (err) {
      showToast("Error", err.message || "Failed to create group", "error");
    }
  };

  const copyInviteLink = async () => {
    const inviteUrl = `https://bondus.vercel.app/join?ref=${authUser?.referralCode || authUser?.id}`;
    try {
      if (Platform.OS === "web") {
        await Clipboard.setString(inviteUrl);
      } else {
        await Share.share({
          message: `Hey! Join me on BondUs to find people with shared interests. Use my link: ${inviteUrl}`,
        });
      }
      showToast(
        "Invite Link Copied!",
        "Share this with your friends.",
        "success",
      );
    } catch (err) {
      showToast("Error", "Failed to share invite link", "error");
    }
  };

  const renderSkeletonChat = () => (
    <View style={[s.chatRow, { opacity: 0.6 }]}>
      <Skeleton
        width={56}
        height={56}
        borderRadius={18}
        style={{ marginRight: 15 }}
      />
      <View style={{ flex: 1 }}>
        <Skeleton
          width="40%"
          height={14}
          borderRadius={4}
          style={{ marginBottom: 8 }}
        />
        <Skeleton width="80%" height={10} borderRadius={4} />
      </View>
    </View>
  );

  const renderChat = ({ item }) => {
    const isPinned = pinnedChats.includes(item.id);
    const isUnread = item.unreadCount > 0;
    const isGroup = item.type === "group";
    const name =
      item.user?.name || (isGroup ? item.groupData?.name : "Unknown");
    const lastMsg =
      item.lastMessage || (isGroup ? "No messages yet" : "Say hello! 👋");
    const tags = item.user?.interests || [];

    return (
      <TouchableOpacity
        style={[s.chatRow, isPinned && s.chatRowPinned]}
        activeOpacity={0.7}
        onPress={() => {
          if (isGroup) {
            navigation.navigate("GroupChat", { group: item.groupData });
          } else {
            navigation.navigate("ChatRoom", { user: item.user });
          }
        }}
        onLongPress={() => openChatOptions(item)}
      >
        <View style={s.avatarWrap}>
          {isGroup ? (
            <View
              style={[
                s.avatar,
                {
                  backgroundColor: "#EEF2FF",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Feather name="users" size={24} color="#6366F1" />
            </View>
          ) : item.user?.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={s.avatar} />
          ) : (
            <ModernPlaceholder
              name={item.user?.name}
              size={54}
              style={{ borderRadius: 18 }}
            />
          )}
          {!isGroup && item.user?.isOnline && <View style={s.onlineDot} />}
        </View>

        <View style={s.chatBody}>
          <View style={s.chatTopRow}>
            <Text
              style={[s.chatName, isUnread && s.chatNameBold]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text style={s.chatTime}>{item.timestamp || "Now"}</Text>
          </View>

          <View style={s.chatBottomRow}>
            <Text
              style={[s.chatPreview, isUnread && s.chatPreviewBold]}
              numberOfLines={1}
            >
              {lastMsg}
            </Text>
            {isUnread && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>

          {tags.length > 0 && (
            <View style={s.sharedRow}>
              <Feather name="zap" size={10} color="#6366F1" />
              <Text style={s.sharedText}>{tags[0]}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRequest = ({ item }) => {
    const requesterInterests = item.requester?.interests || [];
    const sharedInterests = requesterInterests.filter((i) =>
      myInterests.includes(i),
    );

    return (
      <View style={s.reqCard}>
        {/* Header */}
        <View style={s.reqHeader}>
          {item.requester?.avatar ? (
            <Image
              source={{ uri: item.requester.avatar }}
              style={s.reqAvatar}
            />
          ) : (
            <ModernPlaceholder
              name={item.requester?.name}
              size={46}
              style={{ borderRadius: 14, marginRight: 12 }}
            />
          )}
          <View style={s.reqInfo}>
            <Text style={s.reqName}>{item.requester?.name}</Text>
            <Text style={s.reqTime}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={s.reqInterestBadge}>
            <Feather
              name="zap"
              size={10}
              color="#6366F1"
              style={{ marginRight: 3 }}
            />
            <Text style={s.reqInterestText}>
              {sharedInterests.length} shared
            </Text>
          </View>
        </View>

        {/* Message preview */}
        <View style={s.reqMessageBubble}>
          <Text style={s.reqMessageText}>
            {item.message || "Hey, let's connect!"}
          </Text>
        </View>

        {/* Shared interests chips */}
        <View style={s.reqChipsRow}>
          {sharedInterests.map((i) => (
            <View key={i} style={s.reqChip}>
              <Text style={s.reqChipText}>{i}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.reqActions}>
          <TouchableOpacity
            style={s.declineBtn}
            onPress={() => declineRequest(item)}
            activeOpacity={0.8}
          >
            <Feather
              name="x"
              size={16}
              color="#64748B"
              style={{ marginRight: 6 }}
            />
            <Text style={s.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.acceptBtn}
            onPress={() => acceptRequest(item)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#6366F1", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.acceptBtnGrad}
            >
              <Feather
                name="check"
                size={16}
                color="#FFF"
                style={{ marginRight: 6 }}
              />
              <Text style={s.acceptBtnText}>Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderGroup = ({ item }) => {
    const isMatched = INTEREST_GROUP_MATCH(item, myInterests);
    const gid = item._id || item.id;
    const hasRequested =
      requestedGroups.includes(gid) ||
      (item.pendingRequests || []).some(
        (uid) =>
          (uid?._id || uid)?.toString() ===
          String(authUser?._id || authUser?.id || ""),
      );
    const isJoined = (myJoinedGroups || []).includes(gid);
    const isFull = (item.members?.length || 0) >= (item.maxMembers || 50);
    return (
      <View style={[s.groupCard, isMatched && s.groupCardMatched]}>
        {/* Creator premium badge */}
        {item.creatorPremium && (
          <View style={s.premiumGroupBadge}>
            <Text style={s.premiumGroupBadgeText}>👑 Premium Group</Text>
          </View>
        )}

        {/* Top */}
        <View style={s.groupCardTop}>
          <View style={s.groupEmojiBox}>
            <Text style={{ fontSize: 28 }}>{item.emoji || "👥"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.groupCardName}>{item.name}</Text>
            <View style={s.groupMemberRow}>
              <Feather name="users" size={11} color="#94A3B8" />
              <Text style={s.groupMemberCount}>
                {" "}
                {item.members?.length || 0}/{item.maxMembers || 50} members
              </Text>
              {isFull && <Text style={s.groupFullBadge}> · Full</Text>}
            </View>
          </View>
          {isMatched && (
            <View style={s.matchedBadge}>
              <Feather name="zap" size={10} color="#6366F1" />
            </View>
          )}
        </View>

        <Text style={s.groupDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Tags */}
        <View style={s.groupTagsRow}>
          {(item.tags || []).map((t) => (
            <View key={t} style={s.groupTag}>
              <Text style={s.groupTagText}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Join button / Joined / Pending */}
        {isJoined ? (
          <View style={s.requestedBadge}>
            <Feather
              name="check"
              size={13}
              color="#22C55E"
              style={{ marginRight: 6 }}
            />
            <Text style={s.requestedBadgeText}>Joined</Text>
          </View>
        ) : hasRequested ? (
          <View style={s.requestedBadge}>
            <Feather
              name="clock"
              size={13}
              color="#6366F1"
              style={{ marginRight: 6 }}
            />
            <Text style={s.requestedBadgeText}>Request Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.joinBtn, isFull && { opacity: 0.5 }]}
            onPress={() => requestToJoinGroup(gid)}
            disabled={isFull}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#6366F1", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.joinBtnGrad}
            >
              <Feather
                name="send"
                size={14}
                color="#FFF"
                style={{ marginRight: 7 }}
              />
              <Text style={s.joinBtnText}>
                {isFull ? "Group Full" : "Request to Join"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const GroupsTab = () => {
    const joinedGroupIds = myJoinedGroups || [];
    const joinedGroups = groups.filter((g) =>
      joinedGroupIds.includes(g._id || g.id),
    );

    const notJoinedGroups = groups.filter(
      (g) => !joinedGroupIds.includes(g._id || g.id),
    );
    const myMatchedGroups = notJoinedGroups.filter((g) =>
      INTEREST_GROUP_MATCH(g, myInterests),
    );
    const otherGroups = notJoinedGroups.filter(
      (g) => !INTEREST_GROUP_MATCH(g, myInterests),
    );

    if (!isPremium && unlockedPasses === 0) {
      // Show locked state with referral CTA
      return (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Referral unlock card */}
          <View style={s.referralCard}>
            <LinearGradient
              colors={["#6366F1", "#7C3AED"]}
              style={s.referralGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={s.referralTitle}>Unlock Group Discovery 🎁</Text>
              <Text style={s.referralSub}>
                Invite 3 friends and get access to browse all groups and send 1
                join request — for free!
              </Text>

              {/* Progress dots */}
              <View style={s.referralProgress}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      s.referralDot,
                      i < inviteCount % 3 && s.referralDotFilled,
                    ]}
                  >
                    {i < inviteCount % 3 ? (
                      <Feather name="check" size={12} color="#6366F1" />
                    ) : (
                      <Text style={s.referralDotNum}>{i + 1}</Text>
                    )}
                  </View>
                ))}
              </View>
              <Text style={s.referralProgressText}>
                {inviteCount % 3}/3 for next Group Pass
              </Text>

              <TouchableOpacity
                style={s.referralInviteBtn}
                onPress={copyInviteLink}
                activeOpacity={0.85}
              >
                <Feather
                  name="user-plus"
                  size={16}
                  color="#6366F1"
                  style={{ marginRight: 8 }}
                />
                <Text style={s.referralInviteBtnText}>Invite a Friend</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Preview (blurred effect) */}
          <Text style={s.sectionLabel}>Groups You Might Like</Text>
          {groups.length > 0 ? (
            groups.slice(0, 3).map((g) => (
              <View
                key={g._id || g.id}
                style={[s.groupCard, { opacity: 0.35 }]}
                pointerEvents="none"
              >
                <View style={s.groupCardTop}>
                  <View style={s.groupEmojiBox}>
                    <Text style={{ fontSize: 28 }}>{g.emoji || "👥"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.groupCardName}>{g.name}</Text>
                    <Text style={s.groupMemberCount}>
                      {g.members?.length || 0} members
                    </Text>
                  </View>
                </View>
                <Text style={s.groupDesc} numberOfLines={1}>
                  {g.description}
                </Text>
              </View>
            ))
          ) : (
            <EmptyState
              compact
              icon="users"
              title="No groups available"
              description="Check back later for new communities."
            />
          )}

          {/* Premium upgrade CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Premium")}
            style={s.premiumGroupCta}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#7C3AED", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.premiumGroupCtaGrad}
            >
              <Text style={s.premiumGroupCtaText}>
                👑 Go Premium for unlimited group access → $3.99/mo
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    const hasData =
      joinedGroups.length > 0 ||
      myMatchedGroups.length > 0 ||
      otherGroups.length > 0;

    return (
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Referral partial unlock banner */}
        {!isPremium && inviteCount >= 3 && (
          <View style={s.referralUnlockedBanner}>
            <Feather
              name="gift"
              size={18}
              color="#6366F1"
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.referralUnlockedTitle}>
                🎉 Groups Unlocked via Referral!
              </Text>
              <Text style={s.referralUnlockedSub}>
                You can join up to 1 group for free. Upgrade for unlimited.
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Premium")}>
              <Text style={s.referralUnlockedUpgrade}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* My Groups (Already joined) */}
        {joinedGroups.length > 0 && (
          <>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionLabel}>My Groups</Text>
              {isPremium && (
                <TouchableOpacity onPress={() => setShowCreateGroup(true)}>
                  <Text style={s.sectionActionText}>+ Create</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={joinedGroups}
              keyExtractor={(g) => g._id || g.id}
              renderItem={renderGroup}
              scrollEnabled={false}
            />
          </>
        )}

        {/* My interest-matched groups */}
        {myMatchedGroups.length > 0 && (
          <>
            <Text style={s.sectionLabel}>✨ Matching Your Interests</Text>
            <FlatList
              data={myMatchedGroups}
              keyExtractor={(g) => g._id || g.id}
              renderItem={renderGroup}
              scrollEnabled={false}
            />
          </>
        )}

        {/* All other groups */}
        {otherGroups.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Explore Communities</Text>
            <FlatList
              data={otherGroups}
              keyExtractor={(g) => g._id || g.id}
              renderItem={renderGroup}
              scrollEnabled={false}
            />
          </>
        )}

        {!hasData && (
          <EmptyState
            icon="users"
            title="No groups found"
            description="Be the first to create a community around your interests!"
            actionLabel={isPremium ? "Create Group" : "Go Premium"}
            onAction={() =>
              isPremium
                ? setShowCreateGroup(true)
                : navigation.navigate("Premium")
            }
          />
        )}

        {/* Premium create group CTA */}
        {!isPremium && (
          <TouchableOpacity
            onPress={() => navigation.navigate("Premium")}
            style={s.premiumGroupCta}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#7C3AED", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.premiumGroupCtaGrad}
            >
              <Text style={s.premiumGroupCtaText}>
                👑 Premium: Make your group discoverable by interest → $3.99/mo
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  // Render People Nearby (Reuse logic)
  const renderPeople = () => {
    // We reuse the same logic as Discover but filter locally for nearby
    // In a real app, this might be a dedicated endpoint
    const nearbyPeople = onlineUsers.filter(
      (u) => u.distanceKm && u.distanceKm < 50,
    );

    if (isLoading) {
      return (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[s.userCard, { opacity: 0.6 }]}>
              <Skeleton width={50} height={50} borderRadius={16} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Skeleton width="60%" height={12} borderRadius={4} />
                <Skeleton
                  width="40%"
                  height={10}
                  borderRadius={4}
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }

    if (nearbyPeople.length === 0) {
      return (
        <EmptyState
          icon="map-pin"
          title="No one nearby"
          description="Try increasing your search radius in Discover."
          actionLabel="Go to Discover"
          onAction={() => navigation.navigate("Explore")}
        />
      );
    }

    return (
      <FlatList
        data={nearbyPeople}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.userCard}
            onPress={() => navigation.navigate("UserProfile", { user: item })}
          >
            <View style={s.userAvatarWrap}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={s.userAvatar} />
              ) : (
                <ModernPlaceholder
                  name={item.name}
                  size={50}
                  style={{ borderRadius: 16 }}
                />
              )}
              {item.isOnline && <View style={s.onlineDot} />}
            </View>
            <View style={s.userInfo}>
              <Text style={s.userName}>{item.name}</Text>
              <Text style={s.userDist}>
                {item.distanceKm ? `${item.distanceKm} km away` : "Nearby"}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      />
    );
  };

  const TABS = [
    { id: "Messages", label: "Messages", badge: totalUnread },
    { id: "Requests", label: "Requests", badge: requests.length },
    { id: "Groups", label: "Groups", badge: myJoinedGroups?.length || 0 },
    { id: "People", label: "People", badge: 0 },
  ];

  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#0F172A", "#1D3461", "#6366F1"]}
        style={[s.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Messages</Text>
            <Text style={s.headerSub}>
              {chats.length}/30 conversations
              {totalUnread > 0 ? ` · ${totalUnread} unread` : ""}
            </Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity
              style={s.headerIconBtn}
              onPress={() => {
                if (authUser?.isPremium) {
                  setShowCreateGroup(true);
                } else {
                  setPremiumModalType("limit");
                  setShowPremiumModal(true);
                }
              }}
              activeOpacity={0.8}
            >
              <Feather name="users" size={17} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.composeBtn}
              onPress={() => navigation.navigate("Discover")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.1)"]}
                style={s.composeBtnGrad}
              >
                <Feather name="edit" size={15} color="#FFF" />
                <Text style={s.composeBtnText}>New</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Limit banner */}
        {isNearLimit && (
          <TouchableOpacity
            onPress={() => navigation.navigate("Premium")}
            style={s.limitBanner}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={
                isAtLimit ? ["#DC2626", "#EF4444"] : ["#7C3AED", "#A855F7"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.limitBannerGrad}
            >
              <Text style={s.limitBannerText}>
                {isAtLimit
                  ? "🚫 30/30 limit reached. Go Premium for unlimited!"
                  : `⚡ ${chats.length}/30 used. Upgrade for unlimited.`}
              </Text>
              <Feather name="chevron-right" size={14} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <View style={s.searchBar}>
          <Feather
            name="search"
            size={15}
            color="#94A3B8"
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={s.searchInput}
            placeholder="Search..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x-circle" size={15} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabBar}
          style={{ marginBottom: 0 }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[s.tabPill, activeTab === tab.id && s.tabPillActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.75}
            >
              <Text
                style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}
              >
                {tab.label}
              </Text>
              {tab.badge > 0 && (
                <View
                  style={[s.tabBadge, activeTab === tab.id && s.tabBadgeActive]}
                >
                  <Text
                    style={[
                      s.tabBadgeText,
                      activeTab === tab.id && { color: "#6366F1" },
                    ]}
                  >
                    {tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {activeTab === "Messages" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={s.messagesContent}
        >
          {/* People Nearby Strip */}
          <View style={s.suggestSection}>
            <Text style={s.suggestLabel}>People Nearby</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.suggestStrip}
            >
              {onlineUsers.length > 0 ? (
                onlineUsers.map((u, i) => (
                  <TouchableOpacity
                    key={u.id || u._id || i}
                    style={s.suggestItem}
                    onPress={() =>
                      navigation.navigate("UserProfile", { user: u })
                    }
                  >
                    <View style={s.suggestAvatarWrap}>
                      {u.avatar ? (
                        <Image
                          source={{ uri: u.avatar }}
                          style={s.suggestAvatar}
                        />
                      ) : (
                        <ModernPlaceholder
                          name={u.name}
                          size={52}
                          style={{ borderRadius: 16 }}
                        />
                      )}
                      {u.isOnline && <View style={s.suggestOnlineDot} />}
                    </View>
                    <Text style={s.suggestName} numberOfLines={1}>
                      {u.name.split(" ")[0]}
                    </Text>
                    <Text style={s.suggestDist}>
                      {u.distanceKm ? `${u.distanceKm} km` : "Nearby"}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <EmptyState
                  compact
                  icon="radio"
                  title="No one nearby"
                  description="Expand your radius to find people"
                  actionLabel="Discover"
                  onAction={() => navigation.navigate("Discover")}
                  style={{ width: SCREEN_WIDTH - 40, marginHorizontal: 2 }}
                />
              )}
            </ScrollView>
          </View>

          {/* Filter Bubbles */}
          <View style={s.filterRow}>
            {["All", "Unread", "Online"].map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.filterChip, filterMode === f && s.filterChipActive]}
                onPress={() => setFilterMode(f)}
              >
                <Text
                  style={[
                    s.filterChipText,
                    filterMode === f && s.filterChipTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ flex: 1 }} />
            <Text style={s.filterCount}>
              {filteredChats([...pinnedList, ...unpinnedList]).length} chats
            </Text>
          </View>

          {isLoading ? (
            [1, 2, 3].map((_, i) => (
              <View key={i} style={{ padding: 20 }}>
                {renderSkeletonChat()}
              </View>
            ))
          ) : (
            <>
              {filteredChats(pinnedList).length > 0 && (
                <>
                  <View style={s.sectionDivider}>
                    <Feather
                      name="bookmark"
                      size={10}
                      color="#94A3B8"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={s.sectionDividerText}>PINNED</Text>
                  </View>
                  {filteredChats(pinnedList).map((item, i) => (
                    <View key={getSafeId(item, `pin-${i}`)}>
                      {renderChat({ item })}
                    </View>
                  ))}
                </>
              )}

              <View style={s.sectionDivider}>
                <Text style={s.sectionDividerText}>ALL MESSAGES</Text>
              </View>

              {filteredChats(unpinnedList).map((item, i) => (
                <View key={getSafeId(item, `all-${i}`)}>
                  {renderChat({ item })}
                </View>
              ))}

              {filteredChats(chats).length === 0 && (
                <EmptyState
                  icon="message-circle"
                  title="No conversations yet"
                  description="Connect with people to start meaningful conversations."
                  actionLabel="Find People to Chat"
                  onAction={() => navigation.navigate("Discover")}
                />
              )}
            </>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {activeTab === "Requests" && (
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              {[1, 2, 3].map((_, i) => (
                <View key={i} style={{ marginBottom: 16 }}>
                  {renderSkeletonChat()}
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item, i) => getSafeId(item, `req-${i}`)}
              renderItem={renderRequest}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <EmptyState
                  icon="inbox"
                  title="No pending requests"
                  description="When someone messages you for the first time, it'll appear here."
                  actionLabel="Discover People"
                  onAction={() => navigation.navigate("Discover")}
                />
              )}
            />
          )}
        </View>
      )}

      {activeTab === "Groups" && <GroupsTab />}

      {activeTab === "People" && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={onlineUsers}
            keyExtractor={(item) => item.id || item._id}
            contentContainerStyle={
              onlineUsers.length === 0 ? { flexGrow: 1 } : s.listContent
            }
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            renderItem={({ item }) => {
              const common = (item.interests || []).filter((i) =>
                myInterests.includes(i),
              );
              return (
                <TouchableOpacity
                  style={s.peopleRow}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("UserProfile", { user: item })
                  }
                >
                  <View style={s.avatarWrap}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={s.avatar} />
                    ) : (
                      <ModernPlaceholder
                        name={item.name}
                        size={54}
                        style={{ borderRadius: 18 }}
                      />
                    )}
                    {item.isOnline && <View style={s.onlineDot} />}
                  </View>
                  <View style={s.peopleBody}>
                    <Text style={s.peopleName}>{item.name}</Text>
                    <Text style={s.peopleCity}>{item.city || "Nearby"}</Text>
                    {common.length > 0 && (
                      <View style={s.sharedRow}>
                        <Feather name="zap" size={10} color="#6366F1" />
                        <Text style={s.sharedText}>
                          {common.slice(0, 2).join(" · ")}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={s.sendReqBtn}
                    onPress={() =>
                      navigation.navigate("UserProfile", { user: item })
                    }
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#6366F1", "#7C3AED"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={s.sendReqBtnGrad}
                    >
                      <Feather name="send" size={13} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <EmptyState
                icon="users"
                title="No one nearby yet"
                description="Looks like there's no one online in your immediate vicinity. Try expanding your search!"
                actionLabel="Explore More People"
                onAction={() => navigation.navigate("Discover")}
              />
            )}
          />
        </View>
      )}

      <Modal visible={chatOptionsVisible} animationType="slide" transparent>
        <TouchableOpacity
          style={s.overlayDark}
          activeOpacity={1}
          onPress={() => setChatOptionsVisible(false)}
        >
          <View style={s.optionsSheet}>
            <View style={s.sheetHandle} />
            {selectedChat && (
              <View style={s.optionsUserRow}>
                <Image
                  source={{
                    uri:
                      selectedChat.type === "group"
                        ? selectedChat.groupData?.avatar
                        : selectedChat.user?.avatar,
                  }}
                  style={s.optionsUserAvatar}
                />
                <View>
                  <Text style={s.optionsUserName}>
                    {selectedChat.type === "group"
                      ? selectedChat.groupData?.name
                      : selectedChat.user?.name}
                  </Text>
                  <Text style={s.optionsUserSub} numberOfLines={1}>
                    {selectedChat.lastMessage}
                  </Text>
                </View>
              </View>
            )}
            {[
              {
                icon: "bookmark",
                label: pinnedChats.includes(selectedChat?.id) ? "Unpin" : "Pin",
                action: togglePin,
                color: "#6366F1",
              },
              {
                icon: "bell-off",
                label: mutedChats.includes(selectedChat?.id)
                  ? "Unmute"
                  : "Mute",
                action: toggleMute,
                color: "#0EA5E9",
              },
              {
                icon: "slash",
                label: "Block",
                action: blockUser,
                color: "#EF4444",
              },
            ].map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={s.optionRow}
                onPress={opt.action}
              >
                <Feather name={opt.icon} size={18} color={opt.color} />
                <Text style={[s.optionLabel, { color: opt.color }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={s.optionsCancelBtn}
              onPress={() => setChatOptionsVisible(false)}
            >
              <Text style={s.optionsCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Premium Modal */}
      <PremiumModal
        isVisible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        type={premiumModalType}
        onInvite={() => {
          setShowPremiumModal(false);
          navigation.navigate("Invite");
        }}
        onUpgrade={() => {
          setShowPremiumModal(false);
          navigation.navigate("Premium");
        }}
      />

      <Modal visible={showCreateGroup} animationType="slide" transparent>
        <View style={s.overlayDark}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetTitleRow}>
              <Text style={s.sheetTitle}>New Group Chat</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateGroup(false);
                  setGroupName("");
                  setSelectedGroupMembers([]);
                }}
              >
                <Feather name="x" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            {!isPremium && (
              <TouchableOpacity
                onPress={() => {
                  setShowCreateGroup(false);
                  navigation.navigate("Premium");
                }}
                style={s.premiumModalBanner}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={["#7C3AED", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.premiumModalBannerGrad}
                >
                  <Text style={s.premiumModalBannerText}>
                    👑 Premium: Make your group publicly discoverable by
                    interest → $3.99/mo
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <View style={s.groupNameWrap}>
              <Feather
                name="users"
                size={16}
                color="#94A3B8"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={s.groupNameInput}
                placeholder="Group name (e.g. Chess Masters ♟️)"
                placeholderTextColor="#94A3B8"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={40}
              />
            </View>
            <Text style={s.membersLabel}>
              Add Members ({selectedGroupMembers.length} selected)
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 280 }}
            >
              {chats
                .filter((c) => c.type === "direct")
                .map((c) => {
                  const u = c.user;
                  if (!u) return null;
                  const sel = selectedGroupMembers.includes(u.id || u._id);
                  return (
                    <TouchableOpacity
                      key={u.id || u._id}
                      style={[s.memberRow, sel && s.memberRowSel]}
                      onPress={() => toggleGroupMember(u.id || u._id)}
                      activeOpacity={0.75}
                    >
                      {u.avatar ? (
                        <Image
                          source={{ uri: u.avatar }}
                          style={s.memberRowAvatar}
                        />
                      ) : (
                        <ModernPlaceholder
                          name={u.name}
                          size={46}
                          style={{ borderRadius: 14 }}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.memberRowName}>{u.name}</Text>
                        <Text style={s.memberRowSub} numberOfLines={1}>
                          {u.interests?.slice(0, 3).join(" · ") ||
                            "No interests shared"}
                        </Text>
                      </View>
                      <View
                        style={[s.selectCircle, sel && s.selectCircleActive]}
                      >
                        {sel && <Feather name="check" size={13} color="#FFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              {chats.filter((c) => c.type === "direct").length === 0 && (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text
                    style={{
                      color: "#94A3B8",
                      fontFamily: theme.typography.fontFamily.medium,
                    }}
                  >
                    No connections found to add.
                  </Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[
                s.createGroupBtn,
                (!groupName.trim() || selectedGroupMembers.length === 0) && {
                  opacity: 0.45,
                },
              ]}
              onPress={createGroup}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#6366F1", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.createGroupGrad}
              >
                <Feather
                  name="users"
                  size={16}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={s.createGroupText}>Create Group</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  // HEADER
  header: { paddingHorizontal: 20, paddingBottom: 0 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 2,
  },
  headerBtns: { flexDirection: "row", gap: 10, alignItems: "center" },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  composeBtn: { borderRadius: 14, overflow: "hidden" },
  composeBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  composeBtnText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },

  limitBanner: { borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  limitBannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  limitBannerText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#FFF",
    flex: 1,
    marginRight: 8,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.medium,
  },

  // TAB BAR
  tabBar: { flexDirection: "row", gap: 6, paddingBottom: 0, marginBottom: 0 },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 5,
  },
  tabPillActive: { borderBottomColor: "#FFF" },
  tabLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: "rgba(255,255,255,0.55)",
  },
  tabLabelActive: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
  },
  tabBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeActive: { backgroundColor: "#FFF" },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },

  // CHAT LIST
  listContent: { paddingBottom: 80, flexGrow: 1, backgroundColor: "#FFF" },
  sep: { height: 1, backgroundColor: "#F8FAFC", marginLeft: 88 },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  avatarWrap: { position: "relative", marginRight: 14 },
  avatar: { width: 54, height: 54, borderRadius: 18 },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  chatBody: { flex: 1 },
  chatTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#334155",
  },
  chatNameBold: {
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },
  chatTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  chatBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 13,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    flex: 1,
  },
  chatPreviewBold: {
    color: "#475569",
    fontFamily: theme.typography.fontFamily.bold,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  sharedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  sharedText: {
    fontSize: 11,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.medium,
  },

  // REQUEST CARDS
  reqCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0px 2px 10px rgba(99, 102, 241, 0.06)" },
    }),
  },
  reqHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  reqAvatar: { width: 46, height: 46, borderRadius: 14 },
  reqInfo: { flex: 1 },
  reqName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 2,
  },
  reqTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  reqInterestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  reqInterestText: {
    fontSize: 11,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.bold,
  },
  reqMessageBubble: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  reqMessageText: {
    fontSize: 14,
    color: "#334155",
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: 21,
  },
  reqChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 14,
  },
  reqChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reqChipText: {
    fontSize: 12,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.bold,
  },
  reqActions: { flexDirection: "row", gap: 10 },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingVertical: 13,
  },
  declineBtnText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#64748B",
  },
  acceptBtn: { flex: 2, borderRadius: 14, overflow: "hidden" },
  acceptBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  acceptBtnText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  reqInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  reqInfoText: {
    fontSize: 12,
    color: "#4338CA",
    fontFamily: theme.typography.fontFamily.medium,
    flex: 1,
  },

  // GROUPS TAB
  sectionLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  groupCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0px 2px 10px rgba(15, 23, 42, 0.05)" },
    }),
  },
  groupCardMatched: { borderColor: "#C7D2FE" },
  premiumGroupBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  premiumGroupBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#92400E",
  },
  groupCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  groupEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  groupCardName: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 4,
  },
  groupMemberRow: { flexDirection: "row", alignItems: "center" },
  groupMemberCount: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  groupFullBadge: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: theme.typography.fontFamily.bold,
  },
  matchedBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  groupDesc: {
    fontSize: 13,
    color: "#64748B",
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: 20,
    marginBottom: 12,
  },
  groupTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 14,
  },
  groupTag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  groupTagText: {
    fontSize: 11,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.bold,
  },
  joinBtn: { borderRadius: 14, overflow: "hidden" },
  joinBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  joinBtnText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  requestedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
  },
  requestedBadgeText: {
    fontSize: 14,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.bold,
  },
  premiumGroupCta: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  premiumGroupCtaGrad: { padding: 16, alignItems: "center" },
  premiumGroupCtaText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    textAlign: "center",
  },

  // REFERRAL CARD
  referralCard: { borderRadius: 22, overflow: "hidden", marginBottom: 20 },
  referralGrad: { padding: 22 },
  referralTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    marginBottom: 8,
  },
  referralSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: 21,
    marginBottom: 20,
  },
  referralProgress: { flexDirection: "row", gap: 12, marginBottom: 10 },
  referralDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  referralDotFilled: { backgroundColor: "#FFF" },
  referralDotNum: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  referralProgressText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 16,
  },
  referralInviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 14,
  },
  referralInviteBtnText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#6366F1",
  },
  referralUnlockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  referralUnlockedTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#4338CA",
    marginBottom: 2,
  },
  referralUnlockedSub: {
    fontSize: 12,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.medium,
  },
  referralUnlockedUpgrade: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#7C3AED",
    paddingLeft: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionActionText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    marginTop: 10,
  },
  // PEOPLE TAB
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  peopleBody: { flex: 1 },
  peopleName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 2,
  },
  peopleCity: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 3,
  },
  sendReqBtn: { borderRadius: 12, overflow: "hidden" },
  sendReqBtnGrad: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // EMPTY
  empty: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    backgroundColor: "#FFF",
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#334155",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },

  // CREATE GROUP MODAL
  overlayDark: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },
  premiumModalBanner: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
  },
  premiumModalBannerGrad: { padding: 14 },
  premiumModalBannerText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#FFF",
    textAlign: "center",
  },
  groupNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontFamily: theme.typography.fontFamily.medium,
  },
  membersLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    gap: 12,
    marginBottom: 4,
  },
  memberRowSel: { backgroundColor: "#EEF2FF" },
  memberRowAvatar: { width: 46, height: 46, borderRadius: 14 },
  memberRowName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 2,
  },
  memberRowSub: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  selectCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  selectCircleActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  createGroupBtn: { borderRadius: 16, overflow: "hidden", marginTop: 14 },
  createGroupGrad: {
    flexDirection: "row",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  createGroupText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },

  // PINNED CHAT
  chatRowPinned: {
    backgroundColor: "#FAFAFF",
    borderLeftWidth: 3,
    borderLeftColor: "#6366F1",
  },

  // SUGGESTED USERS STRIP
  suggestSection: {
    backgroundColor: "#FFF",
    paddingTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  suggestLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  suggestStrip: { paddingHorizontal: 18, gap: 18, paddingBottom: 12 },
  suggestItem: { alignItems: "center", width: 60 },
  suggestAvatarWrap: { position: "relative", marginBottom: 6 },
  suggestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#EEF2FF",
  },
  suggestOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  suggestName: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    textAlign: "center",
  },
  suggestDist: {
    fontSize: 10,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: "center",
  },

  // FILTER CHIPS
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: { backgroundColor: "#EEF2FF", borderColor: "#6366F1" },
  filterChipText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#94A3B8",
  },
  filterChipTextActive: {
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.bold,
  },
  filterCount: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },

  // SECTION DIVIDERS
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionDividerText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // CHAT OPTIONS MODAL
  optionsSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  optionsUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 8,
  },
  optionsUserAvatar: { width: 44, height: 44, borderRadius: 14 },
  optionsUserName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 2,
  },
  optionsUserSub: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  optionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.medium,
  },
  optionsCancelBtn: {
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionsCancelText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#64748B",
  },
});
