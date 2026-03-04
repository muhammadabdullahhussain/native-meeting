import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  LayoutAnimation,
  UIManager,
  PanResponder,
  Switch,
  Dimensions,
  StatusBar,
  Alert,
  BackHandler,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { authService } from "../../api/authService";
import { ModernPlaceholder } from "../../components/common/ModernPlaceholder";
import { EmptyState } from "../../components/common/EmptyState";
import PremiumModal from "../../components/PremiumModal";
import PremiumBadge from "../../components/PremiumBadge";
import { INTEREST_CATEGORIES } from "../../data/interests";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Interest Communities ─────────────────────────────────
// Now sourced dynamically from the backend (groups)

// ── Premium Map Style ─ REMOVED (replaced with radar proximity view)

// ── Custom Slider (for filter) ────────────────────────────────────────────────
function RangeSlider({ value, min, max, onValueChange, label, formatValue }) {
  const containerRef = useRef(null);
  const containerX = useRef(0);
  const containerW = useRef(0);
  const calcValue = useCallback(
    (pageX) => {
      const ratio = Math.max(
        0,
        Math.min(1, (pageX - containerX.current) / containerW.current),
      );
      return Math.round(min + ratio * (max - min));
    },
    [min, max],
  );
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => onValueChange(calcValue(e.nativeEvent.pageX)),
      onPanResponderMove: (e) => onValueChange(calcValue(e.nativeEvent.pageX)),
    }),
  ).current;
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={sliderSt.wrapper}>
      <View style={sliderSt.row}>
        <Text style={sliderSt.label}>{label}</Text>
        <View style={sliderSt.pill}>
          <Text style={sliderSt.pillText}>
            {formatValue ? formatValue(value) : value}
          </Text>
        </View>
      </View>
      <View
        ref={containerRef}
        style={sliderSt.track}
        onLayout={(e) => {
          containerW.current = e.nativeEvent.layout.width;
          if (containerRef.current)
            containerRef.current.measure((fx, fy, w, h, px) => {
              containerX.current = px;
              containerW.current = w;
            });
        }}
        {...panResponder.panHandlers}
      >
        <View style={[sliderSt.fill, { width: `${pct}%` }]} />
        <View style={[sliderSt.thumb, { left: `${pct}%` }]}>
          <View style={sliderSt.thumbDot} />
        </View>
        <View style={sliderSt.edgeRow}>
          <Text style={sliderSt.edge}>
            {min}
            {label === "Distance" ? " km" : ""}
          </Text>
          <Text style={sliderSt.edge}>
            {max}
            {label === "Distance" ? " km" : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}
const sliderSt = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },
  pill: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  pillText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  track: { height: 48, justifyContent: "center", paddingBottom: 18 },
  fill: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
    top: 22,
    backgroundColor: theme.colors.primary,
  },
  thumb: {
    position: "absolute",
    marginLeft: -14,
    top: 11,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  thumbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  edgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  edge: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
});

export default function Discover({ navigation }) {
  const {
    user: authUser,
    blockedUserIds,
    isAuthenticated,
    token,
    requestLocationPermission,
  } = useAuth();
  const { on } = useSocket();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const myInterests = authUser?.interests || [];

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("All");
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [requestedGroups, setRequestedGroups] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState([]);
  const [filterDistance, setFilterDistance] = useState(
    authUser?.settings?.discovery?.maxDistance || 50,
  );
  const [filterLookingFor, setFilterLookingFor] = useState("Anyone");
  const [filterAvailability, setFilterAvailability] = useState([]);
  const [filterInterests, setFilterInterests] = useState([]);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterAgeMin, setFilterAgeMin] = useState(18);
  const [filterAgeMax, setFilterAgeMax] = useState(60);
  const [filterLanguages, setFilterLanguages] = useState([]);
  const [filterGender, setFilterGender] = useState("Anyone");
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'nearby'
  const [isLoading, setIsLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalType, setPremiumModalType] = useState("generic");

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("distance"); // 'distance' | 'newest' | 'online' | 'match'
  const isMoreLoadingRef = useRef(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false); // For UI only

  const LOOKING_FOR = [
    "Anyone",
    "Coffee Chat",
    "Study Buddy",
    "Collab Partner",
    "Networking",
    "Mentorship",
    "Friendship",
    "Travel Buddy",
    "Workout Partner",
    "Language Exchange",
  ];
  const AVAILABILITY = [
    "Weekdays",
    "Weekends",
    "Mornings",
    "Evenings",
    "Nights",
    "Flexible",
  ];
  const LANGUAGES = useMemo(() => {
    const langCat = INTEREST_CATEGORIES.find((c) => c.id === "languages");
    return langCat ? langCat.subInterests : ["English"];
  }, []);
  const GENDER_OPTIONS = ["Anyone", "Men", "Women", "Non-binary"];
  const QUICK_INTERESTS = useMemo(() => {
    return INTEREST_CATEGORIES.flatMap((c) => c.subInterests.slice(0, 1));
  }, []);
  const INTEREST_TABS = useMemo(() => {
    return ["All", ...INTEREST_CATEGORIES.map((c) => c.name)];
  }, []);

  const fetchData = useCallback(
    async (refresh = false, loadMore = false) => {
      if (!isAuthenticated || !authUser?.id) {
        return;
      }
      try {
        if (refresh) {
          setIsRefreshing(true);
          setPage(1);
          setHasMore(true);
        } else if (loadMore) {
          if (!hasMore || isMoreLoadingRef.current) return;
          isMoreLoadingRef.current = true;
          setIsMoreLoading(true);
        } else {
          setIsLoading(true);
          setPage(1);
          setHasMore(true);
        }

        // Only fetch auxiliary data (online, groups, etc.) on fresh load or pull-to-refresh
        if (!loadMore) {
          const [online, fetchedGroups, myFriends, myGroupIds, pendingReqs] =
            await Promise.all([
              authService.getOnlineUsers(100),
              authService.getGroups(),
              authService.getConnections(),
              authService.getMyGroups(),
              authService.getPendingRequests(),
            ]);

          const connectedIds = myFriends.map((f) => f.user?._id || f.user?.id);
          const joinedIds = myGroupIds.map((g) => g._id || g.id);

          // Accurately map all pending interaction IDs whether we sent them or received them
          const pendingIds = pendingReqs
            .map((r) => {
              const reqId = r.requester?._id || r.requester?.id;
              const recId = r.receiver?._id || r.receiver?.id;
              // Return whichever ID is NOT the current user's ID
              return reqId === authUser?.id || reqId === authUser?._id
                ? recId
                : reqId;
            })
            .filter(Boolean);

          const meId = authUser?.id || authUser?._id;
          const groupPendingIds = (fetchedGroups || [])
            .filter((g) =>
              (g.pendingRequests || []).some(
                (uid) =>
                  (uid?._id || uid)?.toString() === (meId || "").toString(),
              ),
            )
            .map((g) => g._id || g.id);

          setSentRequests(pendingIds);
          setRequestedGroups(groupPendingIds);
          setJoinedGroupIds(joinedIds);
          setGroups(fetchedGroups);
          setOnlineUsers(
            online.filter((u) => !blockedUserIds.includes(u.id || u._id)),
          );
        }

        let interestsParam =
          filterInterests.length > 0 ? [...filterInterests] : [];

        if (interestsParam.length === 0 && selectedInterest !== "All") {
          const category = INTEREST_CATEGORIES.find(
            (c) => c.name === selectedInterest,
          );
          if (category) {
            interestsParam = category.subInterests;
          }
        }

        // Use functional update to get current page safely if loadMore
        // We use setPage callback to access latest page state without adding it to dependency
        let currentPage = 1;
        if (loadMore) {
          await new Promise((resolve) => {
            setPage((prev) => {
              currentPage = prev + 1;
              resolve();
              return prev;
            });
          });
        }

        const params = {
          maxDistance: filterDistance,
          lookingFor:
            filterLookingFor !== "Anyone" ? filterLookingFor : undefined,
          gender: filterGender !== "Anyone" ? filterGender : undefined,
          isOnline: filterOnlineOnly || undefined,
          isVerified: filterVerifiedOnly || undefined,
          minAge: filterAgeMin,
          maxAge: filterAgeMax,
          availability:
            filterAvailability.length > 0
              ? filterAvailability.join(",")
              : undefined,
          languages:
            filterLanguages.length > 0 ? filterLanguages.join(",") : undefined,
          interests:
            interestsParam.length > 0 ? interestsParam.join(",") : undefined,
          page: currentPage,
          limit: 20,
          sortBy: sortBy,
        };
        const discovery = await authService.getNearbyUsers(params);

        // Filter out self and connected users locally (double safety)
        const filteredDiscovery = discovery.filter(
          (u) => u.id !== authUser?.id && !blockedUserIds.includes(u.id),
        );

        if (loadMore) {
          setUsers((prev) => [...prev, ...filteredDiscovery]);
          setPage(currentPage);
        } else {
          setUsers(filteredDiscovery);
          // Also setPage(1) was already done at start
        }

        if (filteredDiscovery.length < 20) {
          setHasMore(false);
        }
      } catch (error) {
        console.error("[Discover] Fetch failed:", error);
        if (!(error?.message || "").toLowerCase().includes("not authorized")) {
          showToast("Error", "Could not load data", "error");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsMoreLoading(false);
        isMoreLoadingRef.current = false;
      }
    },
    [
      filterDistance,
      selectedInterest,
      filterLookingFor,
      filterOnlineOnly,
      filterVerifiedOnly,
      filterGender,
      filterAgeMin,
      filterAgeMax,
      filterAvailability,
      filterLanguages,
      filterInterests,
      authUser?.id,
      blockedUserIds,
      showToast,
      isAuthenticated,
      sortBy,
      // Removed page, hasMore, isMoreLoading
    ],
  );

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchData(true);
      }
    }, [fetchData, isAuthenticated])
  );

  // 📍 Auto-request location if missing
  useEffect(() => {
    if (isAuthenticated && authUser && !authUser.location?.coordinates) {
      requestLocationPermission();
    }
  }, [isAuthenticated, authUser?.id]);

  // 🔄 Refetch when location becomes available/changes
  useEffect(() => {
    if (authUser?.location?.coordinates) {
      fetchData(true);
    }
  }, [
    authUser?.location?.coordinates?.[0],
    authUser?.location?.coordinates?.[1],
  ]);

  // 🔄 Sync filterDistance when user updates settings elsewhere (e.g. Settings page)
  useEffect(() => {
    const savedMaxDistance = authUser?.settings?.discovery?.maxDistance;
    if (savedMaxDistance && savedMaxDistance !== filterDistance) {
      setFilterDistance(savedMaxDistance);
    }
  }, [authUser?.settings?.discovery?.maxDistance]);

  // 📱 Track isFilterVisible in a ref so BackHandler always reads the latest value
  const isFilterVisibleRef = useRef(false);
  useEffect(() => {
    isFilterVisibleRef.current = isFilterVisible;
  }, [isFilterVisible]);

  const backPressedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (isFilterVisibleRef.current) {
          setFilterVisible(false);
          return true;
        }
        if (navigation?.canGoBack?.()) {
          navigation.goBack();
          return true;
        }
        if (backPressedOnce.current) {
          BackHandler.exitApp();
          return true;
        }
        backPressedOnce.current = true;
        showToast("", "Press back again to exit", "info");
        setTimeout(() => {
          backPressedOnce.current = false;
        }, 2000);
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBack,
      );
      return () => {
        subscription.remove();
      };
    }, [navigation, showToast]),
  );

  // Real-time Presence Listener
  useEffect(() => {
    const off = on("user_presence", (data) => {
      // Update main users list presence flags
      setUsers((prev) =>
        prev.map((u) =>
          (u.id || u._id || u) === data.userId
            ? { ...u, isOnline: data.status === "online" }
            : u,
        ),
      );

      // Update the "Active Now" horizontal strip list
      setOnlineUsers((prev) => {
        const exists = prev.find((u) => (u.id || u._id) === data.userId);
        if (data.status === "online") {
          // If they are online but not in list, we'll get them in the next full refresh
          // For now, if we have them in the main discovery list, we can add them to strip
          if (exists) return prev;
          const matchedUser = users.find(
            (u) => (u.id || u._id) === data.userId,
          );
          if (matchedUser) return [...prev, { ...matchedUser, isOnline: true }];
          return prev;
        } else {
          return prev.filter((u) => (u.id || u._id) !== data.userId);
        }
      });
    });
    return off;
  }, [on, users]);

  useEffect(() => {
    const offNotif = on("notification", () => {
      fetchData(true);
    });
    const offConnReq = on("connect_request", () => {
      fetchData(true);
    });
    return () => {
      offNotif();
      offConnReq();
    };
  }, [on, fetchData]);
  const handleJoinGroup = async (groupId, groupName) => {
    if (requestedGroups.includes(groupId)) return;
    try {
      await authService.joinGroup(groupId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRequestedGroups((prev) => [...prev, groupId]);
      showToast(
        "Request Sent! ✉️",
        `Your request to join "${groupName}" has been sent.`,
        "success",
      );
    } catch (err) {
      if (err.response?.status === 403 || err.message?.includes("Pass")) {
        setPremiumModalType("limit");
        setShowPremiumModal(true);
      } else {
        showToast("Error", err.message || "Failed to send request", "error");
      }
    }
  };

  const handleConnect = async (userId) => {
    if (sentRequests.includes(userId)) return;
    try {
      await authService.sendConnectionRequest(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSentRequests((prev) => [...prev, userId]);
      showToast("Request Sent! ✉️", "They will be notified.", "success");
    } catch (err) {
      showToast("Error", err.message || "Failed to send request", "error");
    }
  };

  const resetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterDistance(10);
    setFilterLookingFor("Anyone");
    setFilterOnlineOnly(false);
    setFilterVerifiedOnly(false);
    setFilterAvailability([]);
    setFilterLanguages([]);
    setFilterInterests([]);
    setFilterGender("Anyone");
    setFilterAgeMin(18);
    setFilterAgeMax(60);
    setSortBy("distance");
  };

  const applyFilters = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFilterVisible(false);
  };

  const toggleViewMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setViewMode((prev) => (prev === "list" ? "nearby" : "list"));
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.city || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderSkeletonCard = () => (
    <View style={[styles.userCard, { opacity: 0.6 }]}>
      <Skeleton
        width={64}
        height={64}
        borderRadius={20}
        style={{ marginRight: 14 }}
      />
      <View style={{ flex: 1 }}>
        <Skeleton
          width="50%"
          height={14}
          borderRadius={4}
          style={{ marginBottom: 8 }}
        />
        <Skeleton
          width="30%"
          height={10}
          borderRadius={4}
          style={{ marginBottom: 12 }}
        />
        <Skeleton
          width="100%"
          height={12}
          borderRadius={4}
          style={{ marginBottom: 6 }}
        />
        <Skeleton width="80%" height={12} borderRadius={4} />
      </View>
    </View>
  );

  const renderUserCard = ({ item }) => {
    // Match score is now calculated by backend, fallback to local estimate if missing
    const matchPct = item.matchScore || 0;

    const isShared = (tag) => myInterests.includes(tag);
    const sharedCount = (item.interests || []).filter((tag) =>
      isShared(tag),
    ).length;

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("UserProfile", { user: item })}
      >
        <View style={styles.userCardAvatarWrap}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.userCardAvatar}
            />
          ) : (
            <ModernPlaceholder
              name={item.name}
              size={64}
              style={{ borderRadius: 20 }}
            />
          )}
          {item.isOnline && <View style={styles.avatarOnlineDot} />}
        </View>
        <View style={styles.userCardBody}>
          <View style={styles.userCardTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.userCardName}>{item.name}</Text>
                {item.isPremium && (
                  <PremiumBadge size={14} style={{ marginLeft: 4 }} />
                )}
                {item.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Feather name="check" size={8} color="#FFF" />
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={11} color="#94A3B8" />
                <Text style={styles.locationText}>
                  {item.city || "Nearby"} •{" "}
                  {item.distanceKm ? `${item.distanceKm} km` : "Nearby"}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              {matchPct > 0 && (
                <View style={styles.matchBadge}>
                  <Text style={styles.matchPct}>{matchPct}%</Text>
                  <Text style={styles.matchLabel}>match</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={() => handleConnect(item.id || item._id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    sentRequests.includes(item.id || item._id)
                      ? ["#22C55E", "#16A34A"]
                      : ["#6366F1", "#7C3AED"]
                  }
                  style={styles.connectBtnGrad}
                >
                  <Feather
                    name={
                      sentRequests.includes(item.id || item._id)
                        ? "check"
                        : "send"
                    }
                    size={15}
                    color="#FFF"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.userCardBio} numberOfLines={2}>
            {item.bio}
          </Text>

          <View style={styles.interestRow}>
            {(item.interests || []).slice(0, 3).map((tag, i) => (
              <View
                key={i}
                style={[styles.tag, isShared(tag) && styles.tagShared]}
              >
                <Text
                  style={[
                    styles.tagText,
                    isShared(tag) && styles.tagTextShared,
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
            {sharedCount > 0 && (
              <View style={styles.sharedNote}>
                <Feather name="zap" size={10} color="#6366F1" />
                <Text style={styles.sharedNoteText}>{sharedCount} shared</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleManualLocationRequest = async () => {
    const success = await requestLocationPermission();
    if (success) {
      showToast("Location Updated", "We found your location!", "success");
      fetchData(true);
    } else {
      Alert.alert(
        "Location Required",
        "Please enable location services in your device settings to discover people nearby.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ],
      );
    }
  };

  const hasLocation =
    authUser?.location?.coordinates &&
    authUser.location.coordinates[0] !== 0 &&
    authUser.location.coordinates[1] !== 0;

  const renderGroupItem = (g, idx = 0) => {
    const gid = g.id || g._id;
    const hasRequested = requestedGroups.includes(gid);
    const isJoined = joinedGroupIds.includes(gid);

    const groupGradients = [
      ["#EEF2FF", "#E0E7FF"],
      ["#F5F3FF", "#EDE9FE"],
      ["#F0FDF4", "#DCFCE7"],
      ["#FFF7ED", "#FFEDD5"],
    ];
    const cardBg = groupGradients[idx % groupGradients.length];

    return (
      <View key={g.id || g._id} style={styles.discoverGroupCard}>
        <LinearGradient
          colors={cardBg}
          style={styles.discoverGroupGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.discoverGroupTop}>
            <View style={styles.discoverGroupEmojiWrap}>
              <Text style={styles.discoverGroupEmoji}>{g.emoji || "👥"}</Text>
            </View>
            {isJoined ? (
              <View style={styles.discoverGroupPending}>
                <Feather name="check" size={12} color="#22C55E" />
              </View>
            ) : hasRequested ? (
              <View style={styles.discoverGroupPending}>
                <Feather name="clock" size={12} color="#6366F1" />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.discoverJoinBtn}
                onPress={() => handleJoinGroup(gid, g.name)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#6366F1", "#4F46E5"]}
                  style={styles.discoverJoinGrad}
                >
                  <Feather name="plus" size={12} color="#FFF" />
                  <Text style={styles.discoverJoinText}>Join</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.discoverGroupBody}>
            <Text style={styles.discoverGroupName} numberOfLines={1}>
              {g.name}
            </Text>
            <View style={styles.discoverGroupMeta}>
              <View style={styles.discoverGroupIconBox}>
                <Feather name="users" size={10} color="#64748B" />
              </View>
              <Text style={styles.discoverGroupCount}>
                {g.members?.length || 0} / {g.maxMembers || 50}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1D3461", "#6366F1"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>Good morning 👋</Text>
            <Text style={styles.headerTitle}>Find Your People</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.modeToggle,
                viewMode === "nearby" && styles.modeToggleActive,
              ]}
              onPress={toggleViewMode}
              activeOpacity={0.8}
            >
              <Feather
                name={viewMode === "nearby" ? "list" : "radio"}
                size={18}
                color={viewMode === "nearby" ? "#FFF" : "#6366F1"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setFilterVisible(true)}
            >
              <Feather name="sliders" size={18} color="#6366F1" />
              {(filterOnlineOnly ||
                filterVerifiedOnly ||
                filterAvailability.length > 0 ||
                filterLanguages.length > 0 ||
                filterInterests.length > 0 ||
                filterLookingFor !== "Anyone" ||
                filterGender !== "Anyone") && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Feather
            name="search"
            size={16}
            color="#94A3B8"
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, city or interest..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

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

      {viewMode === "list" ? (
        <FlatList
          data={isLoading ? [1, 2, 3] : filteredUsers}
          keyExtractor={(item, index) =>
            isLoading ? `skeleton-${index}` : item.id || item._id || index
          }
          renderItem={isLoading ? renderSkeletonCard : renderUserCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          onRefresh={() => fetchData(true)}
          refreshing={isRefreshing}
          onEndReached={() => {
            if (hasMore && !isMoreLoading && !isLoading) {
              fetchData(false, true);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isMoreLoading && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Skeleton width={100} height={10} borderRadius={4} />
              </View>
            )
          }
          ListHeaderComponent={
            <>
              <View style={styles.sectionHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#22C55E",
                    }}
                  />
                  <Text style={styles.sectionTitle}>Active Now</Text>
                </View>
                {!isLoading && (
                  <Text style={styles.sectionSub}>
                    {onlineUsers.length} online
                  </Text>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeStrip}
              >
                {isLoading ? (
                  [1, 2, 3, 4].map((_, i) => (
                    <View key={i} style={[styles.activeItem, { opacity: 0.6 }]}>
                      <Skeleton
                        width={54}
                        height={54}
                        borderRadius={18}
                        style={{ marginBottom: 6 }}
                      />
                      <Skeleton width="70%" height={10} borderRadius={4} />
                    </View>
                  ))
                ) : onlineUsers.length > 0 ? (
                  onlineUsers.map((u) => (
                    <TouchableOpacity
                      key={u.id || u._id}
                      style={styles.activeItem}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate("UserProfile", { user: u })
                      }
                    >
                      <View style={styles.activeAvatarWrap}>
                        {u.avatar ? (
                          <Image
                            source={{ uri: u.avatar }}
                            style={styles.activeAvatar}
                          />
                        ) : (
                          <ModernPlaceholder
                            name={u.name}
                            size={54}
                            style={{ borderRadius: 18 }}
                          />
                        )}
                        <View style={styles.activeOnlineDot} />
                      </View>
                      <Text style={styles.activeName} numberOfLines={1}>
                        {u.name.split(" ")[0]}
                      </Text>
                      <Text style={styles.activeDist}>
                        {u.distanceKm ? `${u.distanceKm} km` : "Nearby"}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ width: SCREEN_WIDTH - 40, marginLeft: 20 }}>
                    <EmptyState
                      compact
                      icon="moon"
                      title="Quiet right now"
                      description="No users are currently online nearby."
                    />
                  </View>
                )}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Groups For You</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Connections", { tab: "Groups" })
                  }
                >
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupsScroll}
              >
                {isLoading ? (
                  [1, 2, 3].map((_, i) => (
                    <View
                      key={i}
                      style={[styles.discoverGroupCard, { opacity: 0.6 }]}
                    />
                  ))
                ) : groups.length > 0 ? (
                  groups.slice(0, 5).map((g, idx) => renderGroupItem(g, idx))
                ) : (
                  <View style={{ width: SCREEN_WIDTH - 40, marginLeft: 20 }}>
                    <EmptyState
                      compact
                      icon="users"
                      title="No groups found"
                      description="Join or create a community group."
                      actionLabel="Browse"
                      onAction={() =>
                        navigation.navigate("Connections", { tab: "Groups" })
                      }
                    />
                  </View>
                )}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Communities</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.communityScroll}
              >
                {INTEREST_CATEGORIES.map((cat, idx) => {
                  const presetColors = [
                    ["#7C3AED", "#A855F7"],
                    ["#92400E", "#D97706"],
                    ["#4C1D95", "#7C3AED"],
                    ["#1E3A5F", "#2563EB"],
                    ["#065F46", "#059669"],
                    ["#166534", "#16A34A"],
                    ["#0E7490", "#0EA5E9"],
                    ["#9F1239", "#E11D48"],
                  ];
                  const colorPair = presetColors[idx % presetColors.length];

                  return (
                    <TouchableOpacity
                      key={cat.id || cat.name}
                      style={styles.communityCard}
                      onPress={() => {
                        setSelectedInterest(cat.name);
                        fetchData(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={colorPair}
                        style={styles.communityGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.communityEmoji}>
                          {cat.emoji || "🏷️"}
                        </Text>
                        <Text style={styles.communityName} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        <Text style={styles.communityMembers}>
                          {cat.subInterests?.length || 0} topics
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                <Text style={styles.sectionTitle}>Discover People</Text>
                <Text style={styles.sectionSub}>
                  {filteredUsers.length} found
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsScroll}
              >
                {INTEREST_TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tabChip,
                      selectedInterest === tab && styles.tabChipActive,
                    ]}
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut,
                      );
                      setSelectedInterest(tab);
                    }}
                  >
                    <Text
                      style={[
                        styles.tabChipText,
                        selectedInterest === tab && styles.tabChipTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }
          ListEmptyComponent={
            <EmptyState
              icon={hasLocation ? "users" : "map-pin"}
              title={
                hasLocation
                  ? myInterests.length === 0
                    ? "Add your interests"
                    : "No people found"
                  : "Location Required"
              }
              description={
                hasLocation
                  ? myInterests.length === 0
                    ? "Add interests to your profile to find people who share your passions."
                    : "Try a different interest or expand your search radius."
                  : "Enable location services to discover people near you."
              }
              actionLabel={
                hasLocation
                  ? myInterests.length === 0
                    ? "Edit Profile"
                    : "Reset Filters"
                  : "Enable Location"
              }
              onAction={
                hasLocation
                  ? myInterests.length === 0
                    ? () => navigation.navigate("Profile")
                    : resetFilters
                  : handleManualLocationRequest
              }
            />
          }
        />
      ) : (
        // ── PROXIMITY / RADIUS VIEW ────────────────────────────────
        <View style={styles.radarContainer}>
          {/* Radius Visual Header */}
          <LinearGradient
            colors={["#6366F1", "#7C3AED", "#4F46E5"]}
            style={styles.radarHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                width: 32,
                height: 32,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
              onPress={toggleViewMode}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.radarCircleOuter}>
              <View style={styles.radarCircleMid}>
                <View style={styles.radarCircleInner}>
                  <Feather name="radio" size={26} color="#6366F1" />
                </View>
              </View>
            </View>
            <Text style={styles.radarTitle}>Within {filterDistance} km</Text>
            <Text style={styles.radarSub}>
              {filteredUsers.length} people nearby · Exact locations hidden for
              privacy
            </Text>
            <TouchableOpacity
              style={styles.radarChangeRadius}
              onPress={() => setFilterVisible(true)}
              activeOpacity={0.85}
            >
              <Feather name="sliders" size={14} color="#6366F1" />
              <Text style={styles.radarChangeRadiusText}>Change Radius</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Proximity Card List */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id || item._id}
            renderItem={({ item }) => {
              const dist = item.distanceKm;
              const proximityLabel =
                dist < 1
                  ? "Less than 1 km away"
                  : dist < 5
                    ? `About ${Math.round(dist)} km away`
                    : `Within ${Math.round(dist)} km`;
              return (
                <TouchableOpacity
                  style={styles.proximityCard}
                  onPress={() =>
                    navigation.navigate("UserProfile", { user: item })
                  }
                  activeOpacity={0.88}
                >
                  <View style={styles.proximityAvatarWrap}>
                    {item.avatar ? (
                      <Image
                        source={{ uri: item.avatar }}
                        style={styles.proximityAvatar}
                      />
                    ) : (
                      <ModernPlaceholder
                        name={item.name}
                        size={56}
                        style={{ borderRadius: 18 }}
                      />
                    )}
                    {item.isOnline && (
                      <View style={styles.proximityOnlineDot} />
                    )}
                  </View>
                  <View style={styles.proximityBody}>
                    <Text style={styles.proximityName}>{item.name}</Text>
                    <View style={styles.proximityDistRow}>
                      <Feather name="radio" size={11} color="#6366F1" />
                      <Text style={styles.proximityDistText}>
                        {proximityLabel}
                      </Text>
                    </View>
                    <View style={styles.proximityTags}>
                      {(item.interests || []).slice(0, 2).map((tag, i) => (
                        <View key={i} style={styles.proximityTag}>
                          <Text style={styles.proximityTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.proximityConnect}
                    onPress={() => handleConnect(item.id || item._id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        sentRequests.includes(item.id || item._id)
                          ? ["#22C55E", "#16A34A"]
                          : ["#6366F1", "#7C3AED"]
                      }
                      style={styles.proximityConnectGrad}
                    >
                      <Feather
                        name={
                          sentRequests.includes(item.id || item._id)
                            ? "check"
                            : "user-plus"
                        }
                        size={16}
                        color="#FFF"
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 100,
              paddingHorizontal: 16,
              paddingTop: 12,
            }}
            ListEmptyComponent={
              <EmptyState
                icon="map-pin"
                title="No neighbors found"
                description="Try increasing your radius or check if your location is shared."
                actionLabel="Expand search"
                onAction={() => setFilterVisible(true)}
              />
            }
            onRefresh={() => fetchData(true)}
            refreshing={isRefreshing}
          />
        </View>
      )}

      <Modal visible={isFilterVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setFilterVisible(false)}
          />
          <View style={[styles.sheet, { maxHeight: "85%" }]}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Filters</Text>
                <Text style={styles.sheetSubtitle}>
                  Refine who you discover
                </Text>
              </View>
              <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                <Text style={styles.sheetReset}>Reset All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetBody}
            >
              {/* ── TOGGLE ROW: Online & Verified ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterToggleRow}>
                  <View style={styles.filterToggleLeft}>
                    <View
                      style={[
                        styles.filterIcon,
                        { backgroundColor: "#DCFCE7" },
                      ]}
                    >
                      <Feather name="wifi" size={16} color="#16A34A" />
                    </View>
                    <View>
                      <Text style={styles.filterLabel}>Online Now</Text>
                      <Text style={styles.filterSub}>
                        Only show active users
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={filterOnlineOnly}
                    onValueChange={setFilterOnlineOnly}
                    trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
                    thumbColor={
                      filterOnlineOnly ? theme.colors.primary : "#94A3B8"
                    }
                  />
                </View>
                <View style={styles.filterDividerLight} />
                <View style={styles.filterToggleRow}>
                  <View style={styles.filterToggleLeft}>
                    <View
                      style={[
                        styles.filterIcon,
                        { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Feather name="check-circle" size={16} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={styles.filterLabel}>Verified Only</Text>
                      <Text style={styles.filterSub}>
                        Show verified profiles
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={filterVerifiedOnly}
                    onValueChange={setFilterVerifiedOnly}
                    trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
                    thumbColor={
                      filterVerifiedOnly ? theme.colors.primary : "#94A3B8"
                    }
                  />
                </View>
              </View>

              {/* ── SORT BY ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterSectionTitle}>
                  <View
                    style={[styles.filterIcon, { backgroundColor: "#F3E8FF" }]}
                  >
                    <Feather name="bar-chart-2" size={16} color="#9333EA" />
                  </View>
                  <Text style={styles.filterLabel}>Sort By</Text>
                </View>
                <View style={styles.chipRow}>
                  {[
                    { label: "Distance", value: "distance" },
                    { label: "Newest", value: "newest" },
                    { label: "Online", value: "online" },
                    { label: "Match %", value: "match" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.filterChip,
                        sortBy === opt.value && styles.filterChipActive,
                      ]}
                      onPress={() => setSortBy(opt.value)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          sortBy === opt.value && styles.filterChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── DISTANCE ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterSectionTitle}>
                  <View
                    style={[styles.filterIcon, { backgroundColor: "#EDE9FE" }]}
                  >
                    <Feather name="radio" size={16} color="#7C3AED" />
                  </View>
                  <Text style={styles.filterLabel}>Proximity Radius</Text>
                </View>
                <RangeSlider
                  label="Distance"
                  value={filterDistance}
                  min={1}
                  max={200}
                  onValueChange={setFilterDistance}
                  formatValue={(v) => `${v} km`}
                />
                <View style={styles.distancePresets}>
                  {[1, 5, 10, 25, 50, 100].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.distPreset,
                        filterDistance === d && styles.distPresetActive,
                      ]}
                      onPress={() => setFilterDistance(d)}
                    >
                      <Text
                        style={[
                          styles.distPresetText,
                          filterDistance === d && styles.distPresetTextActive,
                        ]}
                      >
                        {d}km
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── AGE RANGE ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterSectionTitle}>
                  <View
                    style={[styles.filterIcon, { backgroundColor: "#FEF3C7" }]}
                  >
                    <Feather name="user" size={16} color="#D97706" />
                  </View>
                  <Text style={styles.filterLabel}>Age Range</Text>
                  <Text style={styles.filterLabelBadge}>
                    {filterAgeMin}–{filterAgeMax} yrs
                  </Text>
                </View>
                <RangeSlider
                  label="Min Age"
                  value={filterAgeMin}
                  min={18}
                  max={filterAgeMax - 1}
                  onValueChange={setFilterAgeMin}
                  formatValue={(v) => `${v} yrs`}
                />
                <RangeSlider
                  label="Max Age"
                  value={filterAgeMax}
                  min={filterAgeMin + 1}
                  max={80}
                  onValueChange={setFilterAgeMax}
                  formatValue={(v) => `${v} yrs`}
                />
              </View>

              {/* ── SHOW ME (GENDER) ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterSectionTitle}>
                  <View
                    style={[styles.filterIcon, { backgroundColor: "#FCE7F3" }]}
                  >
                    <Feather name="users" size={16} color="#BE185D" />
                  </View>
                  <Text style={styles.filterLabel}>Show Me</Text>
                </View>
                <View style={styles.chipRow}>
                  {GENDER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.filterChip,
                        filterGender === opt && styles.filterChipActive,
                      ]}
                      onPress={() => setFilterGender(opt)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filterGender === opt && styles.filterChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── LOOKING FOR ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterSectionTitle}>
                  <View
                    style={[styles.filterIcon, { backgroundColor: "#D1FAE5" }]}
                  >
                    <Feather name="heart" size={16} color="#059669" />
                  </View>
                  <Text style={styles.filterLabel}>Looking For</Text>
                </View>
                <View style={styles.chipRow}>
                  {LOOKING_FOR.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.filterChip,
                        filterLookingFor === opt && styles.filterChipActive,
                      ]}
                      onPress={() => setFilterLookingFor(opt)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filterLookingFor === opt &&
                          styles.filterChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── AVAILABILITY ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterSectionTitle}>
                  <View
                    style={[styles.filterIcon, { backgroundColor: "#E0E7FF" }]}
                  >
                    <Feather name="clock" size={16} color="#4F46E5" />
                  </View>
                  <Text style={styles.filterLabel}>Availability</Text>
                  {filterAvailability.length > 0 && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>
                        {filterAvailability.length}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.chipRow}>
                  {AVAILABILITY.map((opt) => {
                    const active = filterAvailability.includes(opt);
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.filterChip,
                          active && styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setFilterAvailability((prev) =>
                            active
                              ? prev.filter((x) => x !== opt)
                              : [...prev, opt],
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            active && styles.filterChipTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── LANGUAGES ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterSectionTitle}>
                  <View
                    style={[styles.filterIcon, { backgroundColor: "#FEF9C3" }]}
                  >
                    <Feather name="globe" size={16} color="#CA8A04" />
                  </View>
                  <Text style={styles.filterLabel}>Languages</Text>
                  {filterLanguages.length > 0 && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>
                        {filterLanguages.length}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.chipRow}>
                  {LANGUAGES.map((lang) => {
                    const active = filterLanguages.includes(lang);
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={[
                          styles.filterChip,
                          active && styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setFilterLanguages((prev) =>
                            active
                              ? prev.filter((x) => x !== lang)
                              : [...prev, lang],
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            active && styles.filterChipTextActive,
                          ]}
                        >
                          {lang}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── INTERESTS ── */}
              <View style={styles.filterSectionCard}>
                <View style={styles.filterSectionTitle}>
                  <View
                    style={[styles.filterIcon, { backgroundColor: "#FFE4E6" }]}
                  >
                    <Feather name="zap" size={16} color="#E11D48" />
                  </View>
                  <Text style={styles.filterLabel}>Shared Interests</Text>
                  {filterInterests.length > 0 && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>
                        {filterInterests.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.filterSub, { marginBottom: 12 }]}>
                  Show people who share your passions
                </Text>
                <View style={styles.chipRow}>
                  {QUICK_INTERESTS.map((interest) => {
                    const active = filterInterests.includes(interest);
                    return (
                      <TouchableOpacity
                        key={interest}
                        style={[
                          styles.filterChip,
                          active && styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setFilterInterests((prev) =>
                            active
                              ? prev.filter((x) => x !== interest)
                              : [...prev, interest],
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            active && styles.filterChipTextActive,
                          ]}
                        >
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Footer Buttons moved inside ScrollView for better UX on small screens, 
                  or keep outside if you want them sticky. User asked to move them 'down'.
                  If they overlay content, adding padding to ScrollView is better.
                  Let's make them sticky at the bottom but ensure they are at the very bottom of the modal.
              */}
            </ScrollView>

            {/* Footer Buttons */}
            <View
              style={[
                styles.sheetFooter,
                { paddingBottom: insets.bottom + 20 },
              ]}
            >
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={applyFilters}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#6366F1", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyGrad}
                >
                  <Feather
                    name="check"
                    size={18}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.applyText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setFilterVisible(false)}
                activeOpacity={0.8}
              >
                <Feather
                  name="x"
                  size={18}
                  color="#64748B"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.closeModalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerGreeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeToggle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  modeToggleActive: { backgroundColor: "#6366F1", borderColor: "#4F46E5" },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    position: "relative",
  },
  filterDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.medium,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: 13,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  seeAll: {
    fontSize: 13,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },

  activeStrip: { paddingHorizontal: 20, gap: 16, paddingBottom: 4 },
  activeItem: { alignItems: "center", width: 62 },
  activeAvatarWrap: { position: "relative", marginBottom: 6 },
  activeAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: "#22C55E",
  },
  activeOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  activeName: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    textAlign: "center",
  },
  activeDist: {
    fontSize: 10,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },

  communityScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  communityCard: { borderRadius: 20, overflow: "hidden", width: 150 },
  communityGrad: { padding: 18, height: 120, justifyContent: "flex-end" },
  communityEmoji: { fontSize: 30, marginBottom: 6 },
  communityName: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    marginBottom: 3,
  },
  communityMembers: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontFamily: theme.typography.fontFamily.medium,
  },

  tabsScroll: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  tabChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: theme.colors.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#64748B",
  },
  tabChipTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },

  userCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    ...theme.shadows.small,
  },
  userCardAvatarWrap: { position: "relative", marginRight: 14 },
  userCardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  avatarOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userCardBody: { flex: 1 },
  userCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  userCardName: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  userCardBio: {
    fontSize: 13,
    color: "#64748B",
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: 18,
    marginBottom: 10,
  },
  interestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  tagShared: { backgroundColor: "#EFF6FF" },
  tagText: { fontSize: 11, color: "#64748B" },
  tagTextShared: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  sharedNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 6,
  },
  sharedNoteText: {
    fontSize: 11,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.bold,
  },
  cardActions: { alignItems: "center", gap: 8 },
  matchBadge: {
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchPct: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#6366F1",
  },
  matchLabel: { fontSize: 8, color: "#818CF8" },
  connectBtn: { width: 34, height: 34, borderRadius: 10, overflow: "hidden" },
  connectBtnGrad: { flex: 1, justifyContent: "center", alignItems: "center" },

  groupsScroll: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 16,
    paddingTop: 4,
  },
  discoverGroupCard: {
    width: 160,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    elevation: 2,
    ...theme.shadows.medium,
  },
  discoverGroupGrad: {
    padding: 14,
    height: 140,
    justifyContent: "space-between",
  },
  discoverGroupTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  discoverGroupEmojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  discoverGroupEmoji: { fontSize: 24 },
  discoverGroupBody: { marginTop: 10 },
  discoverGroupName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 4,
  },
  discoverGroupMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  discoverGroupIconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  discoverGroupCount: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: theme.typography.fontFamily.medium,
  },
  discoverGroupPending: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  discoverJoinBtn: {
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
    ...theme.shadows.small,
  },
  discoverJoinGrad: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  discoverJoinText: {
    fontSize: 12,
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
  },

  // ── PROXIMITY / RADAR VIEW
  radarContainer: { flex: 1 },
  radarHeader: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  radarCircleOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  radarCircleMid: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  radarCircleInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  radarTitle: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    marginBottom: 6,
  },
  radarSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  radarChangeRadius: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  radarChangeRadiusText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#6366F1",
  },

  proximityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    ...theme.shadows.small,
  },
  proximityAvatarWrap: { position: "relative", marginRight: 14 },
  proximityAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  proximityOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  proximityBody: { flex: 1 },
  proximityName: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 4,
  },
  proximityDistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  proximityDistText: {
    fontSize: 12,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.medium,
  },
  proximityTags: { flexDirection: "row", gap: 6 },
  proximityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  proximityTagText: {
    fontSize: 11,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.medium,
  },
  proximityConnect: { marginLeft: 8 },
  proximityConnectGrad: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "90%",
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: theme.typography.fontFamily.medium,
  },
  sheetReset: {
    fontSize: 14,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  resetBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sheetBody: { padding: 20 },

  // Filter Section Cards
  filterSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 1,
    ...theme.shadows.small,
  },
  filterSectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  filterIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },
  filterLabelBadge: {
    marginLeft: "auto",
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  filterSub: {
    fontSize: 13,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: 18,
  },

  // Toggle Styles
  filterToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  filterToggleLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  filterDividerLight: {
    height: 1.5,
    backgroundColor: "#F8FAFC",
    marginVertical: 14,
  },

  // Radius/Distance Presets
  distancePresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  distPreset: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  distPresetActive: {
    backgroundColor: "#EEF2FF",
    borderColor: theme.colors.primary,
  },
  distPresetText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#64748B",
  },
  distPresetTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },

  // Chip Styles
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontFamily: theme.typography.fontFamily.bold,
  },

  // Badges
  activeBadge: {
    backgroundColor: theme.colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
  },

  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  applyBtn: { borderRadius: 18, overflow: "hidden", ...theme.shadows.medium },
  applyGrad: {
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  applyText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  closeModalBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
  },
  closeModalBtnText: {
    color: "#64748B",
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
  },

  empty: { padding: 40, alignItems: "center", marginTop: 40 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  emptyAction: {
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyActionText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 15,
  },
});
