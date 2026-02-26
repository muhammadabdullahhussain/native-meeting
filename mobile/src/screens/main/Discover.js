import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    ScrollView, Modal, TextInput, Platform, LayoutAnimation,
    UIManager, PanResponder, Switch, Dimensions, StatusBar, Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { DUMMY_USERS, DUMMY_CHATS } from '../../data/dummy';
import { INTEREST_CATEGORIES } from '../../data/interests'; // Dynamic data
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────

// ── Interest Communities (from real categories) ─────────────────────────────────
const COMMUNITIES = [
    { id: 'c1', name: 'Tech Builders', interest: 'Software Dev', emoji: '💻', members: 1240, color: ['#7C3AED', '#A855F7'] },
    { id: 'c2', name: 'Coffee & Chat', interest: 'Coffee', emoji: '☕', members: 870, color: ['#92400E', '#D97706'] },
    { id: 'c3', name: 'Photographers', interest: 'Photography', emoji: '📸', members: 634, color: ['#4C1D95', '#7C3AED'] },
    { id: 'c4', name: 'Chess Club', interest: 'Chess', emoji: '♟️', members: 291, color: ['#1E3A5F', '#2563EB'] },
    { id: 'c5', name: 'Startup Founders', interest: 'Startups', emoji: '🚀', members: 512, color: ['#065F46', '#059669'] },
    { id: 'c6', name: 'Hiking Crew', interest: 'Hiking', emoji: '🏕️', members: 388, color: ['#166534', '#16A34A'] },
    { id: 'c7', name: 'AI Enthusiasts', interest: 'AI & ML', emoji: '🤖', members: 742, color: ['#0E7490', '#0EA5E9'] },
    { id: 'c8', name: 'Board Gamers', interest: 'Catan', emoji: '🎲', members: 210, color: ['#9F1239', '#E11D48'] },
];

// ── Custom Slider (for filter) ────────────────────────────────────────────────
function RangeSlider({ value, min, max, onValueChange, label, formatValue }) {
    const containerRef = useRef(null);
    const containerX = useRef(0);
    const containerW = useRef(0);
    const calcValue = useCallback((pageX) => {
        const ratio = Math.max(0, Math.min(1, (pageX - containerX.current) / containerW.current));
        return Math.round(min + ratio * (max - min));
    }, [min, max]);
    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => onValueChange(calcValue(e.nativeEvent.pageX)),
        onPanResponderMove: (e) => onValueChange(calcValue(e.nativeEvent.pageX)),
    })).current;
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <View style={sliderSt.wrapper}>
            <View style={sliderSt.row}>
                <Text style={sliderSt.label}>{label}</Text>
                <View style={sliderSt.pill}><Text style={sliderSt.pillText}>{formatValue ? formatValue(value) : value}</Text></View>
            </View>
            <View ref={containerRef} style={sliderSt.track}
                onLayout={e => { containerW.current = e.nativeEvent.layout.width; if (containerRef.current) containerRef.current.measure((fx, fy, w, h, px) => { containerX.current = px; containerW.current = w; }); }}
                {...panResponder.panHandlers}>
                <View style={[sliderSt.fill, { width: `${pct}% ` }]} />
                <View style={[sliderSt.thumb, { left: `${pct}% ` }]}><View style={sliderSt.thumbDot} /></View>
                <View style={sliderSt.edgeRow}>
                    <Text style={sliderSt.edge}>{min}{label === 'Distance' ? ' km' : ''}</Text>
                    <Text style={sliderSt.edge}>{max}{label === 'Distance' ? ' km' : ''}</Text>
                </View>
            </View>
        </View>
    );
}
const sliderSt = StyleSheet.create({
    wrapper: { marginBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    label: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    pill: { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#BFDBFE' },
    pillText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },
    track: { height: 48, justifyContent: 'center', paddingBottom: 18 },
    fill: { position: 'absolute', height: 4, borderRadius: 2, top: 22, backgroundColor: theme.colors.primary },
    thumb: { position: 'absolute', marginLeft: -14, top: 11, width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF', borderWidth: 2, borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    thumbDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
    edgeRow: { flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', bottom: 0, left: 0, right: 0 },
    edge: { fontSize: 11, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
});
// ── Premium Map Style ────────────────────────────────────────────────────────
const MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Discover({ navigation }) {
    const { user: authUser } = useAuth();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    // Safety Fallbacks
    const myInterests = authUser?.interests || [];
    const isPremium = authUser?.isPremium || false;

    const sharedInterests = (userInterests) => {
        return (userInterests || []).filter(i => myInterests.includes(i));
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInterest, setSelectedInterest] = useState('All');
    const [isFilterVisible, setFilterVisible] = useState(false);
    const [sentRequests, setSentRequests] = useState([]);
    const [requestedGroups, setRequestedGroups] = useState([]);
    const [filterDistance, setFilterDistance] = useState(10);
    const [filterLookingFor, setFilterLookingFor] = useState('Anyone');
    const [filterAvailability, setFilterAvailability] = useState([]);
    const [filterInterests, setFilterInterests] = useState([]);
    const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
    const [users, setUsers] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewMode] = useState('list'); // Map view removed for privacy
    const [showPremiumGate, setShowPremiumGate] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = useCallback(async (refresh = false) => {
        try {
            if (refresh) setIsRefreshing(true);
            else setIsLoading(true);

            const params = {
                maxDistance: filterDistance,
                interests: selectedInterest !== 'All' ? selectedInterest : undefined,
                lookingFor: filterLookingFor !== 'Anyone' ? filterLookingFor : undefined,
            };

            const data = await authService.getNearbyUsers(params);
            setUsers(data);
        } catch (error) {
            console.error('[Discover] Fetch failed:', error);
            showToast('Error', 'Could not load nearby users', 'error');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [filterDistance, selectedInterest, filterLookingFor, showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const DISCOVER_GROUPS = [
        { id: 'dg1', name: 'SF Coffee Lovers ☕', interest: 'Coffee', emoji: '☕', tags: ['Coffee', 'Meetups', 'Social'], members: 48, maxMembers: 50, isPremium: false, description: 'Meet fellow coffee lovers in SF every Saturday!' },
        { id: 'dg2', name: 'Tech Builders 💻', interest: 'Software Dev', emoji: '💻', tags: ['Tech', 'Coding', 'Startups'], members: 124, maxMembers: 200, isPremium: true, description: 'Build, ship, and network with fellow engineers.' },
        { id: 'dg3', name: 'Startup Founders 🚀', interest: 'Startups', emoji: '🚀', tags: ['Startups', 'Business'], members: 37, maxMembers: 60, isPremium: true, description: 'Founders helping founders — share, collaborate, grow.' },
        { id: 'dg4', name: 'Hiking Crew 🏕️', interest: 'Hiking', emoji: '🏕️', tags: ['Hiking', 'Outdoors'], members: 22, maxMembers: 30, isPremium: false, description: 'Weekend hikes around the Bay Area. All levels welcome!' },
    ];

    const handleJoinGroup = (groupId, groupName) => {
        if (requestedGroups.includes(groupId)) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRequestedGroups(prev => [...prev, groupId]);
        showToast('Request Sent! 🎉', `Applied to join "${groupName}".`, 'success');
    };

    const LOOKING_FOR = ['Anyone', 'Coffee Chat', 'Collab Partner', 'Networking', 'Mentorship'];
    const AVAILABILITY = ['Anytime', 'Weekdays', 'Weekends', 'Evenings', 'Mornings'];

    // Dynamically derive from the source of truth
    const ALL_INTERESTS = INTEREST_CATEGORIES.flatMap(c => c.subInterests).slice(0, 15);
    const INTEREST_TABS = ['All', ...INTEREST_CATEGORIES.slice(0, 6).map(c => c.name.split(' ')[0])];

    const activeFilterCount = [
        filterDistance !== 10,
        filterLookingFor !== 'Anyone',
        filterAvailability.length > 0,
        filterInterests.length > 0,
        filterOnlineOnly,
    ].filter(Boolean).length;

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.city || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const resetFilters = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFilterDistance(10);
        setFilterLookingFor('Anyone');
        setFilterAvailability([]);
        setFilterInterests([]);
        setFilterOnlineOnly(false);
        fetchUsers();
    };

    const applyFilters = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFilterVisible(false);
        fetchUsers();
    };

    const renderSkeletonCard = () => (
        <View style={[styles.userCard, { opacity: 0.6 }]}>
            <Skeleton width={64} height={64} borderRadius={20} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
                <Skeleton width="50%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="30%" height={10} borderRadius={4} style={{ marginBottom: 12 }} />
                <Skeleton width="100%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="80%" height={12} borderRadius={4} />
            </View>
        </View>
    );

    // ── User card ──────────────────────────────────────────────────────────────
    const renderUserCard = ({ item }) => {
        const matchPct = item.matchScore || 0;
        return (
            <TouchableOpacity
                style={styles.userCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('UserProfile', { user: item })}
            >
                <View style={styles.userCardAvatarWrap}>
                    <Image source={{ uri: item.avatar }} style={styles.userCardAvatar} />
                    {item.isOnline && <View style={styles.avatarOnlineDot} />}
                </View>
                <View style={styles.userCardBody}>
                    <View style={styles.userCardTop}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.nameRow}>
                                <Text style={styles.userCardName}>{item.name}</Text>
                                {item.isVerified && (
                                    <View style={styles.verifiedBadge}>
                                        <Feather name="check" size={8} color="#FFF" />
                                    </View>
                                )}
                                {item.isOnline && (
                                    <View style={styles.onlineBadge}>
                                        <View style={styles.onlineDot} />
                                        <Text style={styles.onlineText}>Online</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.locationRow}>
                                <Feather name="map-pin" size={11} color="#94A3B8" />
                                <Text style={styles.locationText}>
                                    {item.city} • {item.distanceKm < 2 ? 'Nearby' : `${item.distanceKm} km`}
                                </Text>
                            </View>
                        </View>
                        {/* Match badge + Connect button stacked */}
                        <View style={styles.cardActions}>
                            {matchPct > 0 && (
                                <View style={styles.matchBadge}>
                                    <Feather name="zap" size={10} color="#6366F1" style={{ marginBottom: 2 }} />
                                    <Text style={styles.matchPct}>{matchPct}%</Text>
                                    <Text style={styles.matchLabel}>Match</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.connectBtn}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    navigation.navigate('UserProfile', { user: item });
                                }}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={sentRequests.includes(item.id) ? ['#22C55E', '#16A34A'] : ['#6366F1', '#7C3AED']}
                                    style={styles.connectBtnGrad}
                                >
                                    <Feather name={sentRequests.includes(item.id) ? 'check' : 'user-plus'} size={15} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bio */}
                    <Text style={styles.userCardBio} numberOfLines={2}>{item.bio}</Text>

                    {/* Interest tags — full row, no button competing */}
                    <View style={styles.interestRow}>
                        {item.interests.slice(0, 3).map((tag, i) => {
                            const isShared = myInterests.includes(tag);
                            return (
                                <View key={i} style={[styles.tag, isShared && styles.tagShared]}>
                                    <Text style={[styles.tagText, isShared && styles.tagTextShared]}>{tag}</Text>
                                </View>
                            );
                        })}
                        {common.length > 0 && (
                            <View style={styles.sharedNote}>
                                <Feather name="zap" size={10} color="#6366F1" />
                                <Text style={styles.sharedNoteText}>{common.length} shared</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCommunity = (c) => (
        <TouchableOpacity
            key={c.id}
            style={styles.communityCard}
            onPress={() => setSelectedInterest(c.interest)}
            activeOpacity={0.85}
        >
            <LinearGradient
                colors={c.color}
                style={styles.communityGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <Text style={styles.communityEmoji}>{c.emoji}</Text>
                <Text style={styles.communityName}>{c.name}</Text>
                <Text style={styles.communityMembers}>{c.members.toLocaleString()} members</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* ── HEADER ── */}
            {/* DARK GRADIENT HEADER */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerGreeting}>Good morning 👋</Text>
                        <Text style={styles.headerTitle}>Find Your People</Text>
                    </View>
                    {/* Header Actions */}
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
                            <Feather name="sliders" size={18} color="#6366F1" />
                            {activeFilterCount > 0 && <View style={styles.filterDot} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search */}
                <View style={styles.searchBar}>
                    <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, city or interest..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x-circle" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            <>
                <FlatList
                    data={isLoading ? [1, 2, 3] : filteredUsers}
                    keyExtractor={(item, index) => isLoading ? `skeleton - ${index} ` : item.id}
                    renderItem={isLoading ? renderSkeletonCard : renderUserCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListHeaderComponent={
                        <>
                            {/* ── ACTIVE NOW STRIP ── */}
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
                                    <Text style={styles.sectionTitle}>Active Now</Text>
                                </View>
                                {!isLoading && <Text style={styles.sectionSub}>{DUMMY_USERS.filter(u => u.isOnline).length} online</Text>}
                            </View>

                            {isLoading ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeStrip}>
                                    {[1, 2, 3, 4].map((_, i) => (
                                        <View key={i} style={[styles.activeItem, { opacity: 0.6 }]}>
                                            <Skeleton width={54} height={54} borderRadius={18} style={{ marginBottom: 6 }} />
                                            <Skeleton width="70%" height={10} borderRadius={4} />
                                        </View>
                                    ))}
                                </ScrollView>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeStrip}>
                                    {DUMMY_USERS.filter(u => u.isOnline).map(u => (
                                        <TouchableOpacity key={u.id} style={styles.activeItem} activeOpacity={0.85}
                                            onPress={() => navigation.navigate('UserProfile', { user: u })}
                                        >
                                            <View style={styles.activeAvatarWrap}>
                                                <Image source={{ uri: u.avatar }} style={styles.activeAvatar} />
                                                <View style={styles.activeOnlineDot} />
                                            </View>
                                            <Text style={styles.activeName} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
                                            <Text style={styles.activeDist}>{u.distanceKm} km</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            {/* ── DISCOVER GROUPS ── */}
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.sectionTitle}>Groups For You</Text>
                                </View>
                                {!isLoading && (
                                    <TouchableOpacity onPress={() => navigation.navigate('Connections', { tab: 'Groups' })}>
                                        <Text style={styles.seeAll}>See all</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {isLoading ? (
                                [1, 2].map((_, i) => (
                                    <View key={i} style={[styles.discoverGroupCard, { opacity: 0.6 }]}>
                                        <View style={styles.discoverGroupTop}>
                                            <Skeleton width={48} height={48} borderRadius={16} />
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                                                <Skeleton width="40%" height={10} borderRadius={4} />
                                            </View>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                DISCOVER_GROUPS.map(g => {
                                    const hasRequested = requestedGroups.includes(g.id);
                                    const isFull = g.members >= g.maxMembers;
                                    return (
                                        <View key={g.id} style={styles.discoverGroupCard}>
                                            <View style={styles.discoverGroupTop}>
                                                <View style={styles.discoverGroupEmoji}>
                                                    <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.discoverGroupName}>{g.name}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                        <Feather name="users" size={11} color="#94A3B8" />
                                                        <Text style={styles.discoverGroupCount}>{g.members}/{g.maxMembers} members</Text>
                                                    </View>
                                                </View>
                                                {hasRequested ? (
                                                    <View style={styles.discoverGroupPending}>
                                                        <Feather name="clock" size={12} color="#6366F1" />
                                                        <Text style={styles.discoverGroupPendingText}>Pending</Text>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        style={[styles.discoverJoinBtn, isFull && { opacity: 0.4 }]}
                                                        onPress={() => handleJoinGroup(g.id, g.name)}
                                                        disabled={isFull}
                                                        activeOpacity={0.85}
                                                    >
                                                        <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.discoverJoinGrad}>
                                                            <Feather name="send" size={12} color="#FFF" />
                                                            <Text style={styles.discoverJoinText}>Join</Text>
                                                        </LinearGradient>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <Text style={styles.discoverGroupDesc} numberOfLines={1}>{g.description}</Text>
                                        </View>
                                    );
                                })
                            )}

                            {/* Communities Section */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Communities</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Connections', { tab: 'Groups' })}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityScroll}>
                                {COMMUNITIES.map(renderCommunity)}
                            </ScrollView>

                            <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                                <Text style={styles.sectionTitle}>Discover People</Text>
                                <Text style={styles.sectionSub}>{filteredUsers.length} found</Text>
                            </View>
                            {/* INTEREST FILTER TABS */}
                            <ScrollView
                                horizontal showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.tabsScroll}
                            >
                                {INTEREST_TABS.map(tab => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.tabChip, selectedInterest === tab && styles.tabChipActive]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setSelectedInterest(tab);
                                        }}
                                    >
                                        <Text style={[styles.tabChipText, selectedInterest === tab && styles.tabChipTextActive]}>{tab}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    }
                    refreshing={isRefreshing}
                    onRefresh={() => fetchUsers(true)}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIcon}><Feather name="users" size={36} color="#CBD5E1" /></View>
                            <Text style={styles.emptyTitle}>No people found</Text>
                            <Text style={styles.emptySub}>Try a different interest or expand your search</Text>
                        </View>
                    }
                />
            </>

            {/* ── FILTER SHEET ── */}
            <Modal visible={isFilterVisible} animationType="slide" transparent onRequestClose={() => setFilterVisible(false)}>
                <View style={styles.overlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setFilterVisible(false)} />
                    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.sheetHeader}>
                            <TouchableOpacity style={styles.sheetClose} onPress={() => setFilterVisible(false)}>
                                <Feather name="x" size={18} color="#475569" />
                            </TouchableOpacity>
                            <Text style={styles.sheetTitle}>Filters</Text>
                            <TouchableOpacity onPress={resetFilters}>
                                <Text style={styles.sheetReset}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
                            {/* Online only */}
                            <View style={styles.filterRow}>
                                <View>
                                    <Text style={styles.filterLabel}>Online Now</Text>
                                    <Text style={styles.filterSub}>Only show active users</Text>
                                </View>
                                <Switch
                                    value={filterOnlineOnly} onValueChange={setFilterOnlineOnly}
                                    trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                                    thumbColor={filterOnlineOnly ? theme.colors.primary : '#94A3B8'}
                                />
                            </View>
                            <View style={styles.divider} />

                            {/* Distance */}
                            <View style={styles.filterSection}>
                                <RangeSlider label="Distance" value={filterDistance} min={1} max={100} onValueChange={setFilterDistance} formatValue={v => `${v} km`} />
                            </View>
                            <View style={styles.divider} />

                            {/* Looking For */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Looking For</Text>
                                <Text style={styles.filterSub}>What kind of connection?</Text>
                                <View style={styles.genderRow}>
                                    {LOOKING_FOR.map(opt => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.gChip, filterLookingFor === opt && styles.gChipActive]}
                                            onPress={() => setFilterLookingFor(opt)}
                                        >
                                            <Text style={[styles.gChipText, filterLookingFor === opt && styles.gChipTextActive]}>
                                                {opt}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <View style={styles.divider} />

                            {/* Availability */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Availability</Text>
                                <Text style={styles.filterSub}>When are you free to meet?</Text>
                                <View style={styles.genderRow}>
                                    {AVAILABILITY.map(opt => {
                                        const active = filterAvailability.includes(opt);
                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.gChip, active && styles.gChipActive]}
                                                onPress={() => setFilterAvailability(prev =>
                                                    prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt]
                                                )}
                                            >
                                                {active && <Feather name="check" size={11} color={theme.colors.primary} style={{ marginRight: 4 }} />}
                                                <Text style={[styles.gChipText, active && styles.gChipTextActive]}>
                                                    {opt}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                            <View style={styles.divider} />

                            {/* Interests */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Interests</Text>
                                <Text style={styles.filterSub}>Show people who share these</Text>
                                <View style={styles.chipsGrid}>
                                    {ALL_INTERESTS.map(tag => {
                                        const active = filterInterests.includes(tag);
                                        return (
                                            <TouchableOpacity
                                                key={tag}
                                                style={[styles.iChip, active && styles.iChipActive]}
                                                onPress={() => setFilterInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                            >
                                                {active && <Feather name="check" size={11} color={theme.colors.primary} style={{ marginRight: 4 }} />}
                                                <Text style={[styles.iChipText, active && styles.iChipTextActive]}>{tag}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.sheetFooter}>
                            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} activeOpacity={0.85}>
                                <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.applyGrad}>
                                    <Text style={styles.applyText}>Apply Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* PREMIUM GATE MODAL */}
            <Modal visible={showPremiumGate} transparent animationType="fade">
                <View style={styles.premiumGateOverlay}>
                    <View style={styles.premiumGateContent}>
                        <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.premiumGateGrad}>
                            <View style={styles.premiumGateCrownWrap}>
                                <Text style={styles.premiumGateIcon}>👑</Text>
                            </View>
                            <Text style={styles.premiumGateTitle}>Map Mode is Premium</Text>
                            <Text style={styles.premiumGateSub}>Visualise who is nearby and discover connections geographically with Map Mode.</Text>

                            <TouchableOpacity
                                style={styles.premiumGateBtn}
                                onPress={() => { setShowPremiumGate(false); navigation.navigate('Premium'); }}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.premiumGateBtnText}>Upgrade to Premium</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowPremiumGate(false)}
                                style={{ marginTop: 20 }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.premiumGateCancel}>Maybe Later</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // HEADER
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: theme.typography.fontFamily.medium, marginBottom: 2 },
    headerTitle: { fontSize: 26, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modeToggle: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
    modeToggleActive: { backgroundColor: '#6366F1', borderColor: '#4F46E5' },
    filterBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE', position: 'relative' },
    filterDot: { position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    searchInput: { flex: 1, fontSize: 14, color: '#FFF', fontFamily: theme.typography.fontFamily.medium },

    // LIST
    listContent: { paddingBottom: 32 },

    // SECTIONS
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    sectionSub: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    seeAll: { fontSize: 13, color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },

    // COMMUNITY CARDS
    communityScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
    communityCard: { borderRadius: 20, overflow: 'hidden', width: 150 },
    communityGrad: { padding: 18, height: 120, justifyContent: 'flex-end' },
    communityEmoji: { fontSize: 30, marginBottom: 6 },
    communityName: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 3 },
    communityMembers: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: theme.typography.fontFamily.medium },

    // INTEREST TABS
    tabsScroll: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
    tabChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    tabChipActive: { backgroundColor: '#EFF6FF', borderColor: theme.colors.primary },
    tabChipText: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#64748B' },
    tabChipTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },

    // USER CARDS
    userCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0px 2px 10px rgba(15, 23, 42, 0.06)',
            }
        }),
    },
    userCardAvatarWrap: { position: 'relative', marginRight: 14 },
    userCardAvatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#E2E8F0' },
    avatarOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
    userCardBody: { flex: 1 },
    userCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
    userCardName: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    verifiedBadge: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
    onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, gap: 4 },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
    onlineText: { fontSize: 10, color: '#16A34A', fontFamily: theme.typography.fontFamily.bold },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    userCardBio: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, lineHeight: 19, marginBottom: 10 },

    // INTERESTS ON CARD
    interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    tagShared: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
    tagText: { fontSize: 11, fontFamily: theme.typography.fontFamily.medium, color: '#64748B' },
    tagTextShared: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
    commonNote: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: '#22C55E', marginLeft: 4 },

    // CARD ACTIONS (top-right: match badge + connect icon)
    cardActions: { alignItems: 'center', gap: 6, marginLeft: 8 },
    matchBadge: { alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#C7D2FE' },
    matchPct: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1', lineHeight: 18 },
    matchLabel: { fontSize: 9, color: '#818CF8', fontFamily: theme.typography.fontFamily.medium },
    connectBtn: { width: 38, height: 38, borderRadius: 13, overflow: 'hidden' },
    connectBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sharedNote: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    sharedNoteText: { fontSize: 11, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 },

    // MAP STYLES
    mapContainer: { flex: 1, marginTop: -20 },
    map: { ...StyleSheet.absoluteFillObject },
    pinWrapper: { alignItems: 'center', justifyContent: 'center' },
    customMarker: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', padding: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8, borderWidth: 2, borderColor: '#FFF' },
    markerTail: { width: 10, height: 10, backgroundColor: '#FFF', transform: [{ rotate: '45deg' }], marginTop: -6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 2 },
    markerImg: { width: '100%', height: '100%', borderRadius: 20 },
    markerOnline: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
    mapCallout: { width: 160, backgroundColor: '#FFF', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    calloutName: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    calloutBio: { fontSize: 11, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, marginBottom: 4 },
    calloutDist: { fontSize: 10, color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
    mapControls: { position: 'absolute', right: 20, top: 40 },
    mapActionBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },

    // DISCOVER GROUPS
    discoverGroupCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.05)',
            }
        }),
    },
    discoverGroupPremium: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 12 },
    discoverGroupPremiumText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, color: '#92400E' },
    discoverGroupTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    discoverGroupEmoji: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    discoverGroupName: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 3 },
    discoverGroupCount: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    discoverGroupDesc: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, lineHeight: 18 },
    discoverGroupTag: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
    discoverGroupTagText: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },
    discoverGroupPending: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
    discoverGroupPendingText: { fontSize: 12, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    discoverJoinBtn: { borderRadius: 12, overflow: 'hidden' },
    discoverJoinGrad: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9 },
    discoverJoinText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    // ACTIVE NOW STRIP
    activeStrip: { paddingHorizontal: 20, gap: 16, paddingBottom: 4 },
    activeItem: { alignItems: 'center', width: 62 },
    activeAvatarWrap: { position: 'relative', marginBottom: 6 },
    activeAvatar: { width: 54, height: 54, borderRadius: 18, borderWidth: 2.5, borderColor: '#22C55E' },
    markerOnline: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
    markerVerified: { position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },
    mapCallout: { width: 160, backgroundColor: '#FFF', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    activeOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: 6.5, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
    activeName: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', textAlign: 'center' },
    activeDist: { fontSize: 10, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },

    // EMPTY
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#334155', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', paddingHorizontal: 40 },

    // FILTER SHEET
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '92%' },
    sheetHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    sheetClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    sheetTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    sheetReset: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },
    sheetBody: { paddingHorizontal: 24, paddingTop: 8 },
    sheetFooter: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },

    // FILTER INTERNALS
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
    filterLabel: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 4 },
    filterSub: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginBottom: 12 },
    filterSection: { paddingVertical: 16 },
    divider: { height: 1, backgroundColor: '#F1F5F9' },
    genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    gChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    gChipActive: { backgroundColor: '#EFF6FF', borderColor: theme.colors.primary },
    gChipText: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#64748B' },
    gChipTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
    chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    iChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    iChipActive: { backgroundColor: '#EFF6FF', borderColor: theme.colors.primary },
    iChipText: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#64748B' },
    iChipTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
    applyBtn: { height: 54, borderRadius: 16, overflow: 'hidden', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    applyGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    applyText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', letterSpacing: 0.2 },

    // PREMIUM GATE REDESIGN
    premiumGateOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.88)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    premiumGateContent: { width: '100%', maxWidth: 340, borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 12 },
    premiumGateGrad: { padding: 32, alignItems: 'center' },
    premiumGateCrownWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    premiumGateIcon: { fontSize: 40 },
    premiumGateTitle: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', textAlign: 'center', marginBottom: 12 },
    premiumGateSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    premiumGateBtn: { backgroundColor: '#FFF', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 20, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
    premiumGateBtnText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#7C3AED' },
    premiumGateCancel: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
});
