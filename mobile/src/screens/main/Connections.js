import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, TextInput, Platform, Modal, ScrollView, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { DUMMY_USERS } from '../../data/dummy';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// ─── Dummy data (will be replaced by APIs in Phase 3/4) ──────────────────────

// ─── Dummy data ───────────────────────────────────────────────────────────────
const ACCEPTED_CHATS = [
    { id: 'c1', user: DUMMY_USERS[0], lastMessage: 'Would love to chat about your photography! 📸', timestamp: '10:34 AM', unreadCount: 2 },
    { id: 'c2', user: DUMMY_USERS[1], lastMessage: 'Are you coming to the music meetup this weekend?', timestamp: '9:20 AM', unreadCount: 0 },
    { id: 'c3', user: DUMMY_USERS[2], lastMessage: "Let's grab coffee and talk startups ☕", timestamp: 'Yesterday', unreadCount: 1 },
    { id: 'c4', user: DUMMY_USERS[3], lastMessage: 'Saw your post about the design workshop — interested!', timestamp: 'Yesterday', unreadCount: 0 },
];

const PENDING_REQUESTS = [
    { id: 'r1', user: DUMMY_USERS[4], message: 'Hey! I saw you love hiking too — want to chat? 🏕️', timestamp: '2h ago', sharedInterests: ['Hiking', 'Travel'] },
    { id: 'r2', user: { ...DUMMY_USERS[0], id: 'ru2', name: 'Arjun Mehta', avatar: 'https://i.pravatar.cc/150?img=11', interests: ['Tech', 'Coffee', 'Chess'] }, message: 'Fellow tech person here! Your profile on AI is super interesting.', timestamp: '5h ago', sharedInterests: ['Tech', 'Coffee'] },
    { id: 'r3', user: { ...DUMMY_USERS[1], id: 'ru3', name: 'Sofia Larsen', avatar: 'https://i.pravatar.cc/150?img=16', interests: ['Design', 'Photography', 'Travel'] }, message: 'Love your photography feed! Would love to collaborate sometime 📷', timestamp: 'Yesterday', sharedInterests: ['Design', 'Photography', 'Travel'] },
];

const PUBLIC_GROUPS = [
    { id: 'g1', name: 'Coffee & Conversations ☕', interest: 'Coffee', memberCount: 28, maxMembers: 30, emoji: '☕', creatorPremium: true, description: 'A cozy space for coffee lovers to chat, share brewing tips, and arrange meetups.', tags: ['Coffee', 'Meetups', 'Social'], requestedJoin: false },
    { id: 'g2', name: 'Tech Founders Hub 🚀', interest: 'Startups', memberCount: 19, maxMembers: 25, emoji: '🚀', creatorPremium: true, description: 'Early-stage founders sharing resources, feedback, and encouragement.', tags: ['Startups', 'Tech', 'Entrepreneurs'], requestedJoin: false },
    { id: 'g3', name: 'Photography & Light 📸', interest: 'Photography', memberCount: 22, maxMembers: 30, emoji: '📸', creatorPremium: true, description: 'Share your shots, get critiques, and discuss the craft of photography.', tags: ['Photography', 'Arts', 'Creative'], requestedJoin: false },
    { id: 'g4', name: 'Design Thinkers 🎨', interest: 'Design', memberCount: 14, maxMembers: 20, emoji: '🎨', creatorPremium: true, description: 'UI, UX, Branding — all things design. Crits, inspiration, and more.', tags: ['Design', 'UI/UX', 'Creative'], requestedJoin: false },
    { id: 'g5', name: 'Hikers & Explorers 🏕️', interest: 'Travel', memberCount: 31, maxMembers: 40, emoji: '🏕️', creatorPremium: true, description: 'For outdoor adventure lovers. Plan trips, share trails, meet up!', tags: ['Hiking', 'Travel', 'Outdoors'], requestedJoin: false },
    { id: 'g6', name: 'Jazz & Soul Nights 🎷', interest: 'Music', memberCount: 17, maxMembers: 30, emoji: '🎷', creatorPremium: true, description: 'Deep cuts, hot takes, and good vibes in jazz and soul music.', tags: ['Jazz', 'Music', 'Soul'], requestedJoin: false },
];

const INTEREST_GROUP_MATCH = (group, myInterests) =>
    (group.tags || []).some(t => (myInterests || []).some(i => t.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(t.toLowerCase())));

// ─── Component ────────────────────────────────────────────────────────────────
export default function Connections({ navigation }) {
    const { user: authUser } = useAuth();
    const insets = useSafeAreaInsets();
    const { showToast, confirmAction } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // Safety Fallbacks
    const myInterests = authUser?.interests || [];
    const isPremium = authUser?.isPremium || false;
    const inviteCountInitial = 1; // demo
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);
    const [activeTab, setActiveTab] = useState('Messages');

    // Message request state
    const [requests, setRequests] = useState(PENDING_REQUESTS);
    const [chats, setChats] = useState(ACCEPTED_CHATS);

    // Groups state
    const [groups, setGroups] = useState(PUBLIC_GROUPS);
    const [requestedGroups, setRequestedGroups] = useState([]);
    const [inviteCount, setInviteCount] = useState(inviteCountInitial);
    const referralUnlocked = inviteCount >= 3;
    const MAX_FREE_CONVOS = 30;
    const isNearLimit = (chats || []).length >= 26;
    const isAtLimit = (chats || []).length >= MAX_FREE_CONVOS;
    const totalUnread = (chats || []).reduce((a, c) => a + (c.unreadCount || 0), 0);

    // Messages tab feature state
    const [pinnedChats, setPinnedChats] = useState(['c1']); // c1 is pinned by default
    const [mutedChats, setMutedChats] = useState([]);
    const [filterMode, setFilterMode] = useState('All'); // All | Unread | Online
    const [chatOptionsVisible, setChatOptionsVisible] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [myJoinedGroups, setMyJoinedGroups] = useState([]);

    // Create group state
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

    // Derived lists
    const pinnedList = chats.filter(c => pinnedChats.includes(c.id));
    const unpinnedList = chats.filter(c => !pinnedChats.includes(c.id));

    const filteredChats = (list) => {
        let base = list.filter(c => c.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filterMode === 'Unread') return base.filter(c => c.unreadCount > 0);
        if (filterMode === 'Online') return base.filter(c => c.user.isOnline);
        return base;
    };

    const openChatOptions = (chat) => { setSelectedChat(chat); setChatOptionsVisible(true); };
    const togglePin = () => {
        if (!selectedChat) return;
        setPinnedChats(p => p.includes(selectedChat.id) ? p.filter(id => id !== selectedChat.id) : [...p, selectedChat.id]);
        setChatOptionsVisible(false);
    };
    const toggleMute = () => {
        if (!selectedChat) return;
        setMutedChats(m => m.includes(selectedChat.id) ? m.filter(id => id !== selectedChat.id) : [...m, selectedChat.id]);
        setChatOptionsVisible(false);
    };
    const deleteChat = () => {
        if (!selectedChat) return;
        confirmAction({
            title: 'Delete Chat? 🗑️',
            message: `This will permanently remove your conversation with ${selectedChat.user.name}.`,
            onConfirm: () => {
                setChats(c => c.filter(x => x.id !== selectedChat.id));
                setPinnedChats(p => p.filter(id => id !== selectedChat.id));
                setChatOptionsVisible(false);
                showToast('Chat Deleted', 'Conversation has been removed.', 'success');
            },
            confirmText: 'Delete',
            confirmStyle: 'destructive'
        });
    };
    const blockUser = () => {
        if (!selectedChat) return;
        confirmAction({
            title: 'Block User? 🚫',
            message: `Are you sure you want to block ${selectedChat.user.name}? They won't be able to message you or see your profile.`,
            onConfirm: () => {
                setChats(c => c.filter(x => x.id !== selectedChat.id));
                setChatOptionsVisible(false);
                showToast('User Blocked', `${selectedChat.user.name} has been restricted.`, 'success');
            },
            confirmText: 'Block',
            confirmStyle: 'destructive'
        });
    };
    const joinGroupFromDiscover = (group) => {
        setMyJoinedGroups(g => g.includes(group.id) ? g : [...g, group.id]);
        setRequestedGroups(r => [...r, group.id]);
        showToast('Joined! 🎉', `You have joined "${group.name}".`, 'success');
    };

    // ── Handlers ──────────────────────────────────────────────────────────────
    const acceptRequest = (req) => {
        if (isAtLimit) { showToast('Chat Limit Reached', 'Delete an existing conversation or upgrade to Premium to accept more messages.', 'info'); return; }
        setRequests(r => r.filter(x => x.id !== req.id));
        setChats(c => [{
            id: `c_${req.id}`,
            user: req.user,
            lastMessage: req.message,
            timestamp: 'Now',
            unreadCount: 1,
        }, ...c]);
        showToast('✅ Accepted!', `You are now chatting with ${req.user.name}.`, 'success');
    };

    const declineRequest = (req) => {
        confirmAction({
            title: 'Decline Request?',
            message: `Remove the message request from ${req.user.name}?`,
            onConfirm: () => setRequests(r => r.filter(x => x.id !== req.id)),
            confirmText: 'Decline',
            confirmStyle: 'destructive'
        });
    };

    const requestToJoinGroup = (groupId) => {
        const alreadyRequested = requestedGroups.includes(groupId);
        if (alreadyRequested) { showToast('Already Requested', 'Your request is pending approval.', 'info'); return; }
        if (!isPremium && !referralUnlocked) {
            showToast('Premium Feature', 'Invite 3 friends or upgrade to Premium to join groups.', 'info');
            return;
        }
        // Free referral users: only 1 group join allowed
        if (!isPremium && referralUnlocked && requestedGroups.length >= 1) {
            showToast('Limit Reached', 'With the referral unlock you can send 1 group join request. Upgrade to Premium for unlimited.', 'info');
            return;
        }
        setRequestedGroups(r => [...r, groupId]);
        showToast('Request Sent! 🎉', 'The group admin will review your request.', 'success');
    };

    const sendInvite = () => {
        if (inviteCount >= 3) return;
        const newCount = inviteCount + 1;
        setInviteCount(newCount);
        showToast('Invite Sent!', `Invite ${newCount} of 3 sent. ${newCount >= 3 ? 'You have unlocked group access! 🎉' : `Send ${3 - newCount} more to unlock groups.`}`, 'success');
    };

    const toggleGroupMember = (uid) => setSelectedGroupMembers(p => p.includes(uid) ? p.filter(id => id !== uid) : [...p, uid]);

    const createGroup = () => {
        if (!groupName.trim()) { showToast('Group Name', 'Please enter a group name.', 'info'); return; }
        if (selectedGroupMembers.length < 1) { showToast('Add Members', 'Add at least one member.', 'info'); return; }
        const members = DUMMY_USERS.filter(u => selectedGroupMembers.includes(u.id)).map(u => ({ id: u.id, name: u.name, avatar: u.avatar, isAdmin: false }));
        const group = { id: `g${Date.now()}`, name: groupName.trim(), members, commonInterest: members[0]?.interests?.[0] || 'Chat', description: `Group chat for ${groupName.trim()}`, createdAt: 'Now' };
        setShowCreateGroup(false); setGroupName(''); setSelectedGroupMembers([]);
        navigation.navigate('GroupChat', { group });
    };

    // ── Sub-renders ───────────────────────────────────────────────────────────
    const applyFilters = () => { }; // Placeholder

    const renderSkeletonChat = () => (
        <View style={[s.chatRow, { opacity: 0.6 }]}>
            <Skeleton width={56} height={56} borderRadius={18} style={{ marginRight: 15 }} />
            <View style={{ flex: 1 }}>
                <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="80%" height={10} borderRadius={4} />
            </View>
        </View>
    );

    const renderChat = ({ item, pinned }) => {
        const common = (item.user.interests || []).filter(i => myInterests.includes(i));
        const isPinned = pinnedChats.includes(item.id);
        const isMuted = mutedChats.includes(item.id);
        return (
            <TouchableOpacity
                style={[s.chatRow, isPinned && s.chatRowPinned]}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('ChatRoom', { user: item.user, chatData: item })}
                onLongPress={() => openChatOptions(item)}
                delayLongPress={350}
            >
                <View style={s.avatarWrap}>
                    <Image source={{ uri: item.user.avatar }} style={s.avatar} />
                    {item.user.isOnline && <View style={s.onlineDot} />}
                </View>
                <View style={s.chatBody}>
                    <View style={s.chatTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            {isPinned && <Feather name="bookmark" size={11} color="#6366F1" />}
                            <Text style={[s.chatName, item.unreadCount > 0 && s.chatNameBold, { flex: 1 }]} numberOfLines={1}>{item.user.name}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {isMuted && <Feather name="bell-off" size={11} color="#CBD5E1" />}
                            <Text style={s.chatTime}>{item.timestamp}</Text>
                        </View>
                    </View>
                    <View style={s.chatBottomRow}>
                        <Text style={[s.chatPreview, item.unreadCount > 0 && !isMuted && s.chatPreviewBold]} numberOfLines={1}>{item.lastMessage}</Text>
                        {item.unreadCount > 0 && !isMuted && <View style={s.unreadBadge}><Text style={s.unreadText}>{item.unreadCount}</Text></View>}
                        {isMuted && item.unreadCount > 0 && <View style={[s.unreadBadge, { backgroundColor: '#CBD5E1' }]}><Text style={s.unreadText}>{item.unreadCount}</Text></View>}
                    </View>
                    {common.length > 0 && (
                        <View style={s.sharedRow}>
                            <Feather name="zap" size={10} color="#6366F1" />
                            <Text style={s.sharedText}>{common.slice(0, 2).join(' · ')}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderRequest = ({ item }) => (
        <View style={s.reqCard}>
            {/* Header */}
            <View style={s.reqHeader}>
                <Image source={{ uri: item.user.avatar }} style={s.reqAvatar} />
                <View style={s.reqInfo}>
                    <Text style={s.reqName}>{item.user.name}</Text>
                    <Text style={s.reqTime}>{item.timestamp}</Text>
                </View>
                <View style={s.reqInterestBadge}>
                    <Feather name="zap" size={10} color="#6366F1" style={{ marginRight: 3 }} />
                    <Text style={s.reqInterestText}>{item.sharedInterests.length} shared</Text>
                </View>
            </View>

            {/* Message preview */}
            <View style={s.reqMessageBubble}>
                <Text style={s.reqMessageText}>{item.message}</Text>
            </View>

            {/* Shared interests chips */}
            <View style={s.reqChipsRow}>
                {item.sharedInterests.map(i => (
                    <View key={i} style={s.reqChip}>
                        <Text style={s.reqChipText}>{i}</Text>
                    </View>
                ))}
            </View>

            {/* Actions */}
            <View style={s.reqActions}>
                <TouchableOpacity style={s.declineBtn} onPress={() => declineRequest(item)} activeOpacity={0.8}>
                    <Feather name="x" size={16} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={s.declineBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.acceptBtn} onPress={() => acceptRequest(item)} activeOpacity={0.85}>
                    <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.acceptBtnGrad}>
                        <Feather name="check" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={s.acceptBtnText}>Accept</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderGroup = ({ item }) => {
        const isMatched = INTEREST_GROUP_MATCH(item, myInterests);
        const hasRequested = requestedGroups.includes(item.id);
        const isFull = item.memberCount >= item.maxMembers;
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
                        <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.groupCardName}>{item.name}</Text>
                        <View style={s.groupMemberRow}>
                            <Feather name="users" size={11} color="#94A3B8" />
                            <Text style={s.groupMemberCount}> {item.memberCount}/{item.maxMembers} members</Text>
                            {isFull && <Text style={s.groupFullBadge}> · Full</Text>}
                        </View>
                    </View>
                    {isMatched && (
                        <View style={s.matchedBadge}>
                            <Feather name="zap" size={10} color="#6366F1" />
                        </View>
                    )}
                </View>

                <Text style={s.groupDesc} numberOfLines={2}>{item.description}</Text>

                {/* Tags */}
                <View style={s.groupTagsRow}>
                    {item.tags.map(t => <View key={t} style={s.groupTag}><Text style={s.groupTagText}>{t}</Text></View>)}
                </View>

                {/* Join button */}
                {hasRequested ? (
                    <View style={s.requestedBadge}>
                        <Feather name="clock" size={13} color="#6366F1" style={{ marginRight: 6 }} />
                        <Text style={s.requestedBadgeText}>Request Pending</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[s.joinBtn, isFull && { opacity: 0.5 }]}
                        onPress={() => requestToJoinGroup(item.id)}
                        disabled={isFull}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.joinBtnGrad}>
                            <Feather name="send" size={14} color="#FFF" style={{ marginRight: 7 }} />
                            <Text style={s.joinBtnText}>{isFull ? 'Group Full' : 'Request to Join'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // ── High-level group tab content ──────────────────────────────────────────
    const GroupsTab = () => {
        const myMatchedGroups = groups.filter(g => INTEREST_GROUP_MATCH(g, myInterests));
        const otherGroups = groups.filter(g => !INTEREST_GROUP_MATCH(g, myInterests));

        if (!isPremium && !referralUnlocked) {
            // Show locked state with referral CTA
            return (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
                    {/* Referral unlock card */}
                    <View style={s.referralCard}>
                        <LinearGradient colors={['#6366F1', '#7C3AED']} style={s.referralGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <Text style={s.referralTitle}>Unlock Group Discovery 🎁</Text>
                            <Text style={s.referralSub}>Invite 3 friends and get access to browse all groups and send 1 join request — for free!</Text>

                            {/* Progress dots */}
                            <View style={s.referralProgress}>
                                {[0, 1, 2].map(i => (
                                    <View key={i} style={[s.referralDot, i < inviteCount && s.referralDotFilled]}>
                                        {i < inviteCount
                                            ? <Feather name="check" size={12} color="#6366F1" />
                                            : <Text style={s.referralDotNum}>{i + 1}</Text>
                                        }
                                    </View>
                                ))}
                            </View>
                            <Text style={s.referralProgressText}>{inviteCount}/3 friends invited</Text>

                            <TouchableOpacity style={s.referralInviteBtn} onPress={sendInvite} activeOpacity={0.85}>
                                <Feather name="user-plus" size={16} color="#6366F1" style={{ marginRight: 8 }} />
                                <Text style={s.referralInviteBtnText}>Invite a Friend</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                    {/* Preview (blurred effect) */}
                    <Text style={s.sectionLabel}>Groups You Might Like</Text>
                    {groups.slice(0, 3).map(g => (
                        <View key={g.id} style={[s.groupCard, { opacity: 0.35, pointerEvents: 'none' }]}>
                            <View style={s.groupCardTop}>
                                <View style={s.groupEmojiBox}><Text style={{ fontSize: 28 }}>{g.emoji}</Text></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.groupCardName}>{g.name}</Text>
                                    <Text style={s.groupMemberCount}>{g.memberCount} members</Text>
                                </View>
                            </View>
                            <Text style={s.groupDesc} numberOfLines={1}>{g.description}</Text>
                        </View>
                    ))}

                    {/* Premium upgrade CTA */}
                    <TouchableOpacity onPress={() => navigation.navigate('Premium')} style={s.premiumGroupCta} activeOpacity={0.88}>
                        <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.premiumGroupCtaGrad}>
                            <Text style={s.premiumGroupCtaText}>👑 Go Premium for unlimited group access → $3.99/mo</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            );
        }

        return (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
                {/* Referral partial unlock banner */}
                {!isPremium && referralUnlocked && (
                    <View style={s.referralUnlockedBanner}>
                        <Feather name="gift" size={18} color="#6366F1" style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={s.referralUnlockedTitle}>🎉 Groups Unlocked via Referral!</Text>
                            <Text style={s.referralUnlockedSub}>You can send {requestedGroups.length >= 1 ? 'no more' : '1'} join request. Upgrade for unlimited.</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
                            <Text style={s.referralUnlockedUpgrade}>Upgrade</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* My interest-matched groups */}
                {myMatchedGroups.length > 0 && (
                    <>
                        <Text style={s.sectionLabel}>✨ Matching Your Interests</Text>
                        <FlatList
                            data={myMatchedGroups}
                            keyExtractor={g => g.id}
                            renderItem={renderGroup}
                            scrollEnabled={false}
                        />
                    </>
                )}

                {/* All other groups */}
                {otherGroups.length > 0 && (
                    <>
                        <Text style={s.sectionLabel}>All Groups</Text>
                        <FlatList
                            data={otherGroups}
                            keyExtractor={g => g.id}
                            renderItem={renderGroup}
                            scrollEnabled={false}
                        />
                    </>
                )}

                {/* Premium create group CTA */}
                {!isPremium && (
                    <TouchableOpacity onPress={() => navigation.navigate('Premium')} style={s.premiumGroupCta} activeOpacity={0.88}>
                        <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.premiumGroupCtaGrad}>
                            <Text style={s.premiumGroupCtaText}>👑 Premium: Create your own public group → $3.99/mo</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </ScrollView>
        );
    };

    // ── Main render ───────────────────────────────────────────────────────────
    const TABS = [
        { id: 'Messages', label: 'Messages', badge: totalUnread },
        { id: 'Requests', label: 'Requests', badge: requests.length },
        { id: 'Groups', label: 'Groups', badge: 0 },
        { id: 'People', label: 'People', badge: 0 },
    ];

    return (
        <View style={s.root}>
            {/* HEADER */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[s.header, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={s.headerTop}>
                    <View>
                        <Text style={s.headerTitle}>Messages</Text>
                        <Text style={s.headerSub}>
                            {chats.length}/{MAX_FREE_CONVOS} conversations{totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
                        </Text>
                    </View>
                    <View style={s.headerBtns}>
                        <TouchableOpacity style={s.headerIconBtn} onPress={() => setShowCreateGroup(true)} activeOpacity={0.8}>
                            <Feather name="users" size={17} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.composeBtn} onPress={() => navigation.navigate('Discover')} activeOpacity={0.8}>
                            <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={s.composeBtnGrad}>
                                <Feather name="edit" size={15} color="#FFF" />
                                <Text style={s.composeBtnText}>New</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Limit banner */}
                {isNearLimit && (
                    <TouchableOpacity onPress={() => navigation.navigate('Premium')} style={s.limitBanner} activeOpacity={0.88}>
                        <LinearGradient colors={isAtLimit ? ['#DC2626', '#EF4444'] : ['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.limitBannerGrad}>
                            <Text style={s.limitBannerText}>{isAtLimit ? '🚫 30/30 limit reached. Go Premium for unlimited!' : `⚡ ${chats.length}/30 used. Upgrade for unlimited.`}</Text>
                            <Feather name="chevron-right" size={14} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Search */}
                <View style={s.searchBar}>
                    <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 10 }} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Search..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
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
                    {TABS.map(tab => (
                        <TouchableOpacity key={tab.id} style={[s.tabPill, activeTab === tab.id && s.tabPillActive]} onPress={() => setActiveTab(tab.id)} activeOpacity={0.75}>
                            <Text style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}>{tab.label}</Text>
                            {tab.badge > 0 && (
                                <View style={[s.tabBadge, activeTab === tab.id && s.tabBadgeActive]}>
                                    <Text style={[s.tabBadgeText, activeTab === tab.id && { color: '#6366F1' }]}>{tab.badge}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </LinearGradient>

            {/* ── TAB CONTENT ── */}

            {/* MESSAGES */}
            {activeTab === 'Messages' && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: '#FFF' }}>
                    {isLoading ? (
                        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                            {[1, 2, 3, 4, 5, 6].map((_, i) => (
                                <View key={i} style={{ marginBottom: 16 }}>
                                    {renderSkeletonChat()}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <>
                            {/* Suggested users strip */}
                            <View style={s.suggestSection}>
                                <Text style={s.suggestLabel}>People Nearby</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestStrip}>
                                    {DUMMY_USERS.slice(0, 6).map(u => (
                                        <TouchableOpacity key={u.id} style={s.suggestItem} activeOpacity={0.8}
                                            onPress={() => confirmAction({
                                                title: 'Message Request',
                                                message: `Send a message request to ${u.name}?`,
                                                confirmText: 'Send',
                                                onConfirm: () => showToast('Sent! ✅', `${u.name} will need to accept before it starts a conversation.`, 'success')
                                            })}
                                        >
                                            <View style={s.suggestAvatarWrap}>
                                                <Image source={{ uri: u.avatar }} style={s.suggestAvatar} />
                                                {u.isOnline && <View style={s.suggestOnlineDot} />}
                                            </View>
                                            <Text style={s.suggestName} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
                                            <Text style={s.suggestDist}>{u.distanceKm} km</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Filter chips */}
                            <View style={s.filterRow}>
                                {['All', 'Unread', 'Online'].map(f => (
                                    <TouchableOpacity key={f} style={[s.filterChip, filterMode === f && s.filterChipActive]} onPress={() => setFilterMode(f)} activeOpacity={0.75}>
                                        <Text style={[s.filterChipText, filterMode === f && s.filterChipTextActive]}>{f}</Text>
                                    </TouchableOpacity>
                                ))}
                                <View style={{ flex: 1 }} />
                                <Text style={s.filterCount}>{filteredChats([...pinnedList, ...unpinnedList]).length} chats</Text>
                            </View>

                            {/* Pinned chats */}
                            {filteredChats(pinnedList).length > 0 && (
                                <>
                                    <View style={s.sectionDivider}>
                                        <Feather name="bookmark" size={11} color="#6366F1" style={{ marginRight: 5 }} />
                                        <Text style={s.sectionDividerText}>Pinned</Text>
                                    </View>
                                    {filteredChats(pinnedList).map((item, idx) => (
                                        <View key={item.id}>
                                            {renderChat({ item })}
                                            {idx < filteredChats(pinnedList).length - 1 && <View style={s.sep} />}
                                        </View>
                                    ))}
                                </>
                            )}

                            {/* All / rest chats */}
                            {filteredChats(unpinnedList).length > 0 && (
                                <>
                                    {filteredChats(pinnedList).length > 0 && (
                                        <View style={s.sectionDivider}>
                                            <Text style={s.sectionDividerText}>All Messages</Text>
                                        </View>
                                    )}
                                    {filteredChats(unpinnedList).map((item, idx) => (
                                        <View key={item.id}>
                                            {renderChat({ item })}
                                            {idx < filteredChats(unpinnedList).length - 1 && <View style={s.sep} />}
                                        </View>
                                    ))}
                                </>
                            )}

                            {filteredChats([...(pinnedList || []), ...(unpinnedList || [])]).length === 0 && (
                                <View style={s.empty}>
                                    <View style={s.emptyIconBox}><Feather name="message-square" size={36} color="#CBD5E1" /></View>
                                    <Text style={s.emptyTitle}>{filterMode === 'All' ? 'No conversations yet' : `No ${filterMode.toLowerCase()} chats`}</Text>
                                    <Text style={s.emptySub}>Discover people with shared interests to start chatting!</Text>
                                    <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Discover')} activeOpacity={0.85}>
                                        <Text style={s.emptyBtnText}>Explore People →</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={{ height: 80 }} />
                        </>
                    )}
                </ScrollView>
            )}

            {/* REQUESTS */}
            {activeTab === 'Requests' && (
                isLoading ? (
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
                        keyExtractor={item => item.id}
                        renderItem={renderRequest}
                        contentContainerStyle={[s.listContent, { padding: 16 }]}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => (requests || []).length > 0 ? (
                            <View style={s.reqInfoBanner}>
                                <Feather name="info" size={14} color="#6366F1" style={{ marginRight: 8 }} />
                                <Text style={s.reqInfoText}>Only accepted requests count toward your 30 chat limit.</Text>
                            </View>
                        ) : null}
                        ListEmptyComponent={() => (
                            <View style={s.empty}>
                                <View style={s.emptyIconBox}><Feather name="inbox" size={36} color="#CBD5E1" /></View>
                                <Text style={s.emptyTitle}>No pending requests</Text>
                                <Text style={s.emptySub}>When someone messages you for the first time, it'll appear here.</Text>
                            </View>
                        )}
                    />
                )
            )}

            {/* GROUPS */}
            {activeTab === 'Groups' && <GroupsTab />}

            {/* PEOPLE */}
            {activeTab === 'People' && (
                <FlatList
                    data={DUMMY_USERS}
                    keyExtractor={item => item.id}
                    contentContainerStyle={s.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={s.sep} />}
                    renderItem={({ item }) => {
                        const common = (item.interests || []).filter(i => myInterests.includes(i));
                        return (
                            <TouchableOpacity style={s.peopleRow} activeOpacity={0.8} onPress={() => { }}>
                                <View style={s.avatarWrap}>
                                    <Image source={{ uri: item.avatar }} style={s.avatar} />
                                    {item.isOnline && <View style={s.onlineDot} />}
                                </View>
                                <View style={s.peopleBody}>
                                    <Text style={s.peopleName}>{item.name}</Text>
                                    <Text style={s.peopleCity}>{item.city} · {item.distanceKm} km</Text>
                                    {(common || []).length > 0 && (
                                        <View style={s.sharedRow}>
                                            <Feather name="zap" size={10} color="#6366F1" />
                                            <Text style={s.sharedText}>{common.slice(0, 2).join(' · ')}</Text>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={s.sendReqBtn}
                                    onPress={() => showToast('Message Request Sent! ✅', `${item.name} will need to accept before this counts as a conversation.`, 'info')}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sendReqBtnGrad}>
                                        <Feather name="send" size={13} color="#FFF" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {/* CHAT OPTIONS MODAL (long-press) */}
            <Modal visible={chatOptionsVisible} animationType="slide" transparent statusBarTranslucent>
                <TouchableOpacity style={s.overlayDark} activeOpacity={1} onPress={() => setChatOptionsVisible(false)}>
                    <View style={s.optionsSheet}>
                        <View style={s.sheetHandle} />

                        {/* Selected user preview */}
                        {selectedChat && (
                            <View style={s.optionsUserRow}>
                                <Image source={{ uri: selectedChat.user.avatar }} style={s.optionsUserAvatar} />
                                <View>
                                    <Text style={s.optionsUserName}>{selectedChat.user.name}</Text>
                                    <Text style={s.optionsUserSub}>{selectedChat.lastMessage.slice(0, 40)}...</Text>
                                </View>
                            </View>
                        )}

                        {[
                            {
                                icon: pinnedChats.includes(selectedChat?.id) ? 'bookmark' : 'bookmark',
                                label: pinnedChats.includes(selectedChat?.id) ? 'Unpin Chat' : 'Pin Chat',
                                color: '#6366F1',
                                bg: '#EEF2FF',
                                action: togglePin,
                            },
                            {
                                icon: 'bell-off',
                                label: mutedChats.includes(selectedChat?.id) ? 'Unmute Notifications' : 'Mute Notifications',
                                color: '#0EA5E9',
                                bg: '#EFF9FF',
                                action: toggleMute,
                            },
                            {
                                icon: 'trash-2',
                                label: 'Delete Chat',
                                color: '#EF4444',
                                bg: '#FEF2F2',
                                action: deleteChat,
                            },
                            {
                                icon: 'slash',
                                label: 'Block User',
                                color: '#DC2626',
                                bg: '#FEF2F2',
                                action: blockUser,
                            },
                            {
                                icon: 'flag',
                                label: 'Report',
                                color: '#F97316',
                                bg: '#FFEDD5',
                                action: () => { setChatOptionsVisible(false); showToast('Reported', 'Thank you. We will review this user.', 'success'); },
                            },
                        ].map((opt, i) => (
                            <TouchableOpacity key={i} style={s.optionRow} onPress={opt.action} activeOpacity={0.75}>
                                <View style={[s.optionIconBox, { backgroundColor: opt.bg }]}>
                                    <Feather name={opt.icon} size={17} color={opt.color} />
                                </View>
                                <Text style={[s.optionLabel, { color: opt.color }]}>{opt.label}</Text>
                                <Feather name="chevron-right" size={16} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity style={s.optionsCancelBtn} onPress={() => setChatOptionsVisible(false)} activeOpacity={0.85}>
                            <Text style={s.optionsCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* CREATE GROUP MODAL */}
            <Modal visible={showCreateGroup} animationType="slide" transparent>
                <View style={s.overlayDark}>
                    <View style={s.sheet}>
                        <View style={s.sheetHandle} />
                        <View style={s.sheetTitleRow}>
                            <Text style={s.sheetTitle}>New Group Chat</Text>
                            <TouchableOpacity onPress={() => { setShowCreateGroup(false); setGroupName(''); setSelectedGroupMembers([]); }}>
                                <Feather name="x" size={22} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        {!isPremium && (
                            <TouchableOpacity onPress={() => { setShowCreateGroup(false); navigation.navigate('Premium'); }} style={s.premiumModalBanner} activeOpacity={0.88}>
                                <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.premiumModalBannerGrad}>
                                    <Text style={s.premiumModalBannerText}>👑 Premium: Make your group publicly discoverable by interest → $3.99/mo</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        <View style={s.groupNameWrap}>
                            <Feather name="users" size={16} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput style={s.groupNameInput} placeholder="Group name (e.g. Chess Masters ♟️)" placeholderTextColor="#94A3B8" value={groupName} onChangeText={setGroupName} maxLength={40} />
                        </View>
                        <Text style={s.membersLabel}>Add Members ({(selectedGroupMembers || []).length} selected)</Text>
                        <View style={s.searchWrap}>
                            <Feather name="search" size={16} color="#94A3B8" />
                            <TextInput style={s.searchInput} placeholder="Search friends..." placeholderTextColor="#94A3B8" />
                        </View>
                        <ScrollView contentContainerStyle={s.membersList}>
                            {DUMMY_USERS.map(u => {
                                const sel = selectedGroupMembers.includes(u.id);
                                return (
                                    <TouchableOpacity key={u.id} style={[s.memberItem, sel && s.memberItemSel]} onPress={() => setSelectedGroupMembers(prev => sel ? prev.filter(id => id !== u.id) : [...prev, u.id])}>
                                        <Image source={{ uri: u.avatar }} style={s.memberAvatar} />
                                        <Text style={s.memberName}>{u.name}</Text>
                                        <View style={[s.memberCheck, sel && s.memberCheckSel]}>{sel && <Feather name="check" size={12} color="#FFF" />}</View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity style={[s.createGroupBtn, (!groupName.trim() || (selectedGroupMembers || []).length === 0) && { opacity: 0.45 }]} onPress={createGroup} activeOpacity={0.85}>
                            <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.createGroupGrad}>
                                <Feather name="users" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={s.createGroupText}>Create Group</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },

    // HEADER
    header: { paddingHorizontal: 20, paddingBottom: 0 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    headerTitle: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: theme.typography.fontFamily.medium, marginTop: 2 },
    headerBtns: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    headerIconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    composeBtn: { borderRadius: 14, overflow: 'hidden' },
    composeBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
    composeBtnText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    limitBanner: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
    limitBannerGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11 },
    limitBannerText: { fontSize: 12, fontFamily: theme.typography.fontFamily.medium, color: '#FFF', flex: 1, marginRight: 8 },

    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, height: 42, marginBottom: 14 },
    searchInput: { flex: 1, fontSize: 14, color: '#FFF', fontFamily: theme.typography.fontFamily.medium },

    // TAB BAR
    tabBar: { flexDirection: 'row', gap: 6, paddingBottom: 0, marginBottom: 0 },
    tabPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 5 },
    tabPillActive: { borderBottomColor: '#FFF' },
    tabLabel: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: 'rgba(255,255,255,0.55)' },
    tabLabelActive: { color: '#FFF', fontFamily: theme.typography.fontFamily.bold },
    tabBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    tabBadgeActive: { backgroundColor: '#FFF' },
    tabBadgeText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    // CHAT LIST
    listContent: { paddingBottom: 80, flexGrow: 1, backgroundColor: '#FFF' },
    sep: { height: 1, backgroundColor: '#F8FAFC', marginLeft: 88 },
    chatRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF' },
    avatarWrap: { position: 'relative', marginRight: 14 },
    avatar: { width: 54, height: 54, borderRadius: 18 },
    onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
    chatBody: { flex: 1 },
    chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    chatName: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#334155' },
    chatNameBold: { fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    chatTime: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    chatBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    chatPreview: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, flex: 1 },
    chatPreviewBold: { color: '#475569', fontFamily: theme.typography.fontFamily.bold },
    unreadBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    unreadText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    sharedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    sharedText: { fontSize: 11, color: '#6366F1', fontFamily: theme.typography.fontFamily.medium },

    // REQUEST CARDS
    reqCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
    reqHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    reqAvatar: { width: 46, height: 46, borderRadius: 14 },
    reqInfo: { flex: 1 },
    reqName: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    reqTime: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    reqInterestBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    reqInterestText: { fontSize: 11, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    reqMessageBubble: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    reqMessageText: { fontSize: 14, color: '#334155', fontFamily: theme.typography.fontFamily.medium, lineHeight: 21 },
    reqChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
    reqChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    reqChipText: { fontSize: 12, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    reqActions: { flexDirection: 'row', gap: 10 },
    declineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingVertical: 13 },
    declineBtnText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },
    acceptBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
    acceptBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
    acceptBtnText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    reqInfoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#C7D2FE' },
    reqInfoText: { fontSize: 12, color: '#4338CA', fontFamily: theme.typography.fontFamily.medium, flex: 1 },

    // GROUPS TAB
    sectionLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 4 },
    groupCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    groupCardMatched: { borderColor: '#C7D2FE' },
    premiumGroupBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
    premiumGroupBadgeText: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: '#92400E' },
    groupCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    groupEmojiBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    groupCardName: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 4 },
    groupMemberRow: { flexDirection: 'row', alignItems: 'center' },
    groupMemberCount: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    groupFullBadge: { fontSize: 12, color: '#EF4444', fontFamily: theme.typography.fontFamily.bold },
    matchedBadge: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    groupDesc: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, lineHeight: 20, marginBottom: 12 },
    groupTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
    groupTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    groupTagText: { fontSize: 11, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    joinBtn: { borderRadius: 14, overflow: 'hidden' },
    joinBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
    joinBtnText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    requestedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF', borderRadius: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: '#C7D2FE' },
    requestedBadgeText: { fontSize: 14, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    premiumGroupCta: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    premiumGroupCtaGrad: { padding: 16, alignItems: 'center' },
    premiumGroupCtaText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', textAlign: 'center' },

    // REFERRAL CARD
    referralCard: { borderRadius: 22, overflow: 'hidden', marginBottom: 20 },
    referralGrad: { padding: 22 },
    referralTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 8 },
    referralSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: theme.typography.fontFamily.medium, lineHeight: 21, marginBottom: 20 },
    referralProgress: { flexDirection: 'row', gap: 12, marginBottom: 10 },
    referralDot: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
    referralDotFilled: { backgroundColor: '#FFF' },
    referralDotNum: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    referralProgressText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: theme.typography.fontFamily.medium, marginBottom: 16 },
    referralInviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingVertical: 14 },
    referralInviteBtnText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1' },
    referralUnlockedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#C7D2FE' },
    referralUnlockedTitle: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#4338CA', marginBottom: 2 },
    referralUnlockedSub: { fontSize: 12, color: '#6366F1', fontFamily: theme.typography.fontFamily.medium },
    referralUnlockedUpgrade: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#7C3AED' },

    // PEOPLE TAB
    peopleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF' },
    peopleBody: { flex: 1 },
    peopleName: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    peopleCity: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginBottom: 3 },
    sendReqBtn: { borderRadius: 12, overflow: 'hidden' },
    sendReqBtnGrad: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

    // EMPTY
    empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, backgroundColor: '#FFF' },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#334155', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    emptyBtn: { backgroundColor: '#6366F1', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
    emptyBtnText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    // CREATE GROUP MODAL
    overlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, marginBottom: 4 },
    sheetTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    premiumModalBanner: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
    premiumModalBannerGrad: { padding: 14 },
    premiumModalBannerText: { fontSize: 12, fontFamily: theme.typography.fontFamily.medium, color: '#FFF', textAlign: 'center' },
    groupNameWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
    groupNameInput: { flex: 1, fontSize: 15, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium },
    membersLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14, gap: 12, marginBottom: 4 },
    memberRowSel: { backgroundColor: '#EEF2FF' },
    memberRowAvatar: { width: 46, height: 46, borderRadius: 14 },
    memberRowName: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    memberRowSub: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    selectCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    selectCircleActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    createGroupBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 14 },
    createGroupGrad: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
    createGroupText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    // PINNED CHAT
    chatRowPinned: { backgroundColor: '#FAFAFF', borderLeftWidth: 3, borderLeftColor: '#6366F1' },

    // SUGGESTED USERS STRIP
    suggestSection: { backgroundColor: '#FFF', paddingTop: 14, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    suggestLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.7, paddingHorizontal: 20, marginBottom: 10 },
    suggestStrip: { paddingHorizontal: 18, gap: 18, paddingBottom: 12 },
    suggestItem: { alignItems: 'center', width: 60 },
    suggestAvatarWrap: { position: 'relative', marginBottom: 6 },
    suggestAvatar: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: '#EEF2FF' },
    suggestOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
    suggestName: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', textAlign: 'center' },
    suggestDist: { fontSize: 10, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center' },

    // FILTER CHIPS
    filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
    filterChipText: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#94A3B8' },
    filterChipTextActive: { color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    filterCount: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },

    // SECTION DIVIDERS
    sectionDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    sectionDividerText: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6 },

    // CHAT OPTIONS MODAL
    optionsSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36 },
    optionsUserRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 8 },
    optionsUserAvatar: { width: 44, height: 44, borderRadius: 14 },
    optionsUserName: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    optionsUserSub: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
    optionIconBox: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    optionLabel: { flex: 1, fontSize: 15, fontFamily: theme.typography.fontFamily.medium },
    optionsCancelBtn: { marginTop: 8, backgroundColor: '#F8FAFC', borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    optionsCancelText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },
});
