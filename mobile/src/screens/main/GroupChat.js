import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    FlatList, TextInput, KeyboardAvoidingView, Platform,
    Modal, ScrollView, Alert
} from 'react-native';
import { Keyboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { ModernPlaceholder } from '../../components/common/ModernPlaceholder';
import TypingIndicator from '../../components/common/TypingIndicator';

// Interest-based group chat
const getSafeId = (item, suffix = '') => {
    if (!item) return `null-${Date.now()}${suffix}`;
    if (typeof item === 'string') return item + suffix;

    // Cascading ID check
    const raw = item._id || item.id || item.user?._id || item.user?.id || item.user || item;

    if (typeof raw === 'string') return raw + suffix;
    if (raw && typeof raw === 'object') {
        const str = raw.toString();
        // If it's a real ID (like Mongoose ObjectId), toString() is the hex string.
        // If it's a plain object, toString() is '[object Object]'.
        if (str && str !== '[object Object]') return str + suffix;

        // Deep nested check
        const deep = raw._id || raw.id;
        if (deep) return deep.toString() + suffix;
    }

    return `fallback-${Date.now()}${suffix}`;
};

const EMOJI_REACTIONS = ['👍', '❤️', '😄', '🔥', '🙌', '☕'];

function AvatarStack({ members }) {
    if (!members || members.length === 0) return null;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {members.slice(0, 3).map((m, i) => {
                const avatarUrl = m.avatar || m.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || m.user?.name || 'U')}&background=random`;
                return (
                    <Image
                        key={getSafeId(m, `stack-${i}`)}
                        source={{ uri: avatarUrl }}
                        style={[styles.stackAvatar, { marginLeft: i === 0 ? 0 : -14, zIndex: 10 - i }]}
                    />
                );
            })}
            {members.length > 3 && (
                <View style={[styles.stackAvatar, styles.stackExtra, { marginLeft: -14, zIndex: 0 }]}>
                    <Text style={styles.stackExtraText}>+{members.length - 3}</Text>
                </View>
            )}
        </View>
    );
}

export default function GroupChat({ navigation, route }) {
    const { socket, on, emit, emitWithAck } = useSocket();
    const { user: me } = useAuth();
    const { showToast, confirmAction } = useToast();
    const insets = useSafeAreaInsets();
    const flatRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const [group, setGroup] = useState(route.params?.group || {});
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showInfo, setShowInfo] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [editingName, setEditingName] = useState(false);
    const [groupNameDraft, setGroupNameDraft] = useState(group.name);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [infoTab, setInfoTab] = useState('members');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [availableToAdd, setAvailableToAdd] = useState([]);
    const [reportVisible, setReportVisible] = useState(false);

    // ── Derived: am I an admin of this group? ──────────────────────────────────
    const myId = (me?._id || me?.id || me?.user?._id)?.toString();
    const isAmAdmin = (group.members || []).some(m => {
        const mId = (m.user?._id || m.user?.id || m.user || m.id)?.toString();
        return mId === myId && m.role === 'admin';
    });

    const fetchGroupDetails = async () => {
        try {
            const myGroups = await authService.getMyGroups();
            const currentGroup = myGroups.find(g => (g._id || g.id) === (group._id || group.id));
            if (currentGroup) {
                setGroup(currentGroup);
            }
        } catch (error) {
            console.error('Failed to fetch group details:', error);
        }
    };

    // Initial setup and socket listeners
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                if (group?._id) {
                    const data = await authService.getGroupMessages(group._id);
                    setMessages(data || []);

                    // Find and mark unread messages as Read
                    const unread = data.filter(m => {
                        if (getSafeId(m.sender) === getSafeId(me)) return false;
                        return !m.readBy?.some(r => getSafeId(r.user) === getSafeId(me));
                    });

                    unread.forEach(m => {
                        authService.markMessageAsRead(m._id || m.id).catch(e => console.log('Read Ack Failed:', e));
                        emitWithAck('message_read', {
                            messageIds: [m._id || m.id],
                            senderId: getSafeId(m.sender),
                            readerId: getSafeId(me)
                        }).catch(() => { });
                    });
                }
            } catch (err) {
                showToast('Error', 'Failed to load group messages', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        fetchGroupDetails(); // Additional fetch to ensure fresh member/request data

        if (group?._id) {
            // Join group room
            emit('join_group', group._id);

            // Fetch available friends to add
            const fetchFriends = async () => {
                try {
                    const friends = await authService.getConnections();
                    const existingMemberIds = group.members.map(m => (m.user?._id || m.user || m.id));
                    setAvailableToAdd(friends.map(f => f.user).filter(u => !existingMemberIds.includes(u._id)));
                } catch (err) {
                    console.error('[GroupChat] Friends fetch failed:', err);
                }
            };
            fetchFriends();

            // Listen for new messages
            const offMsg = on('new_group_message', (msg) => {
                const msgGroupId = (msg.groupId || msg.group || msg.groupData?._id || msg.groupData?.id)?.toString();
                const currentGroupId = (group._id || group.id)?.toString();

                if (msgGroupId === currentGroupId) {
                    setMessages(prev => {
                        const newId = (msg._id || msg.id)?.toString();
                        if (prev.some(m => (m._id || m.id)?.toString() === newId)) return prev;
                        return [...prev, msg].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    });

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

                    // Auto-mark as read since we are active in the chat
                    if (getSafeId(msg.sender) !== getSafeId(me)) {
                        authService.markMessageAsRead(msg._id || msg.id).catch(e => console.log('Read Ack Failed:', e));
                    }
                } else if (getSafeId(msg.sender) !== getSafeId(me)) {
                    // Message for ANOTHER group, just mark as Delivered
                    authService.markMessageAsDelivered(msg._id || msg.id).catch(e => console.log('Delivered Ack Failed:', e));
                }
            });

            // Listen for typing
            const offTyping = on('typing', (data) => {
                if (data.groupId === group._id && data.senderId !== (me?.id || me?._id)) {
                    const typingUser = group.members?.find(m => (m.user?._id || m.user || m.id) === data.senderId);
                    if (data.isTyping) {
                        setTypingUsers(prev => {
                            if (prev.find(u => u.id === data.senderId)) return prev;
                            return [...prev, {
                                id: data.senderId,
                                name: data.senderName || typingUser?.name || typingUser?.user?.name || 'Someone',
                                avatar: data.senderAvatar || typingUser?.avatar || typingUser?.user?.avatar
                            }];
                        });
                    } else {
                        setTypingUsers(prev => prev.filter(u => u.id !== data.senderId));
                    }
                }
            });

            return () => {
                offMsg();
                offTyping();
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                emitWithAck('typing', { groupId: group._id, senderId: (me?.id || me?._id), senderName: me?.name, senderAvatar: me?.avatar, isTyping: false, receiverId: null }).catch(() => {});
            };
        }
    }, [group?._id, me?._id, me?.avatar]);

    // Real-time group admin event listeners
    useEffect(() => {
        if (!group?._id) return;
        const gId = (group._id || group.id)?.toString();

        const offGroupUpdate = on('group_updated', (data) => {
            if (data.groupId?.toString() === gId) {
                setGroup(prev => ({ ...prev, name: data.name, description: data.description, emoji: data.emoji }));
            }
        });

        const offMembersUpdate = on('group_members_updated', (data) => {
            if (data.groupId?.toString() === gId) {
                setGroup(prev => ({ ...prev, members: data.members }));
            }
        });

        const offMemberRemoved = on('group_member_removed', (data) => {
            if (data.groupId?.toString() === gId) {
                const myId = (me?._id || me?.id)?.toString();
                if (data.userId?.toString() === myId) {
                    showToast('Removed', 'You were removed from this group.', 'error');
                } else {
                    setGroup(prev => ({
                        ...prev,
                        members: prev.members.filter(m => (m.user?._id || m.user?.id || m.user)?.toString() !== data.userId?.toString())
                    }));
                }
            }
        });

        const offRoleChanged = on('group_role_changed', (data) => {
            if (data.groupId?.toString() === gId) {
                setGroup(prev => ({
                    ...prev,
                    members: prev.members.map(m => {
                        const mId = (m.user?._id || m.user?.id || m.user)?.toString();
                        return mId === data.userId?.toString() ? { ...m, role: data.role } : m;
                    })
                }));
            }
        });

        const offReactionUpdate = on('message_reaction_update', (data) => {
            setMessages(prev => prev.map(m =>
                (m._id || m.id)?.toString() === data.messageId?.toString()
                    ? { ...m, reactions: data.reactions }
                    : m
            ));
        });

        const offMessageDelivered = on('message_delivered', (data) => {
            setMessages(prev => prev.map(m => {
                if ((m._id || m.id)?.toString() === data.messageId?.toString()) {
                    const deliveredTo = m.deliveredTo || [];
                    if (!deliveredTo.some(d => d.user?.toString() === data.userId?.toString())) {
                        return { ...m, deliveredTo: [...deliveredTo, { user: data.userId, deliveredAt: new Date().toISOString() }] };
                    }
                }
                return m;
            }));
        });

        const offMessageRead = on('message_read', (data) => {
            setMessages(prev => prev.map(m => {
                if ((m._id || m.id)?.toString() === data.messageId?.toString()) {
                    const readBy = m.readBy || [];
                    if (!readBy.some(r => r.user?.toString() === data.userId?.toString())) {
                        return { ...m, readBy: [...readBy, { user: data.userId, readAt: new Date().toISOString() }] };
                    }
                }
                return m;
            }));
        });

        return () => {
            offGroupUpdate(); offMembersUpdate(); offMemberRemoved();
            offRoleChanged(); offReactionUpdate(); offMessageDelivered(); offMessageRead();
        };
    }, [group?._id, me?._id]);

    // ── Send message ───────────────────────────────────────────────────────────
    const handleType = (text) => {
        setInputText(text);
        if (group?._id) {
            const isCurrentlyTyping = text.length > 0;
            emitWithAck('typing', {
                groupId: group._id,
                senderId: (me?.id || me?._id),
                senderName: me?.name || 'User',
                senderAvatar: me?.avatar,
                isTyping: isCurrentlyTyping,
                receiverId: null // Explicitly NOT a direct chat
            }).catch(() => {});

            // Clear existing timeout
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            // Set timeout to clear typing after 3 seconds of pause (only if there is text)
            if (isCurrentlyTyping) {
                typingTimeoutRef.current = setTimeout(() => {
                    emitWithAck('typing', {
                        groupId: group._id,
                        senderId: (me?.id || me?._id),
                        senderName: me?.name || 'User',
                        senderAvatar: me?.avatar,
                        isTyping: false,
                        receiverId: null
                    }).catch(() => {});
                }, 3000);
            }
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || isSending) return;

        try {
            setIsSending(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Clear typing indicator immediately on send
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            emitWithAck('typing', {
                groupId: group._id,
                senderId: (me?.id || me?._id),
                senderName: me?.name || 'User',
                isTyping: false
            }).catch(() => {});

            const messageData = {
                groupId: group._id || group.id,
                text: inputText.trim()
            };

            const response = await authService.sendMessage(messageData);

            // Snappy UI update
            const newMsg = response.success ? response.data : {
                _id: Date.now().toString(),
                text: inputText.trim(),
                sender: {
                    _id: (me?._id || me?.id || me?.user?._id || me?.user?.id),
                    name: me?.name || 'You',
                    avatar: me?.avatar
                },
                senderName: me?.name || 'You',
                createdAt: new Date().toISOString(),
                groupId: (group._id || group.id)
            };

            setMessages(prev => {
                const realId = (newMsg._id || newMsg.id)?.toString();
                // If socket already added this message, don't add it again!
                if (prev.some(m => (m._id || m.id)?.toString() === realId)) {
                    return prev;
                }
                return [...prev, newMsg];
            });
            setInputText('');
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (err) {
            showToast('Error', err.message || 'Failed to send message', 'error');
        } finally {
            setIsSending(false);
        }
    };

    // ── Add reaction ───────────────────────────────────────────────────────────
    const addReaction = async (msgId, emoji) => {
        // Optimistic update first
        setMessages(prev => prev.map(m => {
            if (getSafeId(m) !== msgId) return m;
            const reactions = m.reactions || [];
            const myId = getSafeId(me);
            const existing = reactions.findIndex(r => r.emoji === emoji && getSafeId(r.user) === myId);
            if (existing > -1) {
                const updated = [...reactions];
                updated.splice(existing, 1);
                return { ...m, reactions: updated };
            }
            return { ...m, reactions: [...reactions, { emoji, user: { _id: me?._id || me?.id, name: me?.name } }] };
        }));
        setShowReactionPicker(null);

        // Persist to backend
        try {
            const res = await authService.toggleReaction(msgId, emoji);
            if (res?.data?.reactions) {
                setMessages(prev => prev.map(m =>
                    getSafeId(m) === msgId ? { ...m, reactions: res.data.reactions } : m
                ));
            }
        } catch (err) {
            console.warn('Reaction save failed:', err.message);
        }
    };

    // ── Add members ─────────────────────────────────────────────────────────────
    const confirmAddMembers = async () => {
        if (selectedMembers.length === 0) return;
        try {
            const res = await authService.addGroupMembers(group._id || group.id, selectedMembers);
            if (res?.data) {
                setGroup(res.data);
                const names = availableToAdd
                    .filter(u => selectedMembers.includes(getSafeId(u)))
                    .map(u => u.name.split(' ')[0]).join(', ');
                setMessages(prev => [...prev, {
                    _id: `sys${Date.now()}`,
                    text: `${names} joined the group`,
                    sender: 'system',
                    createdAt: new Date().toISOString()
                }]);
                showToast('Success', 'Members added successfully.', 'success');
            }
        } catch (err) {
            showToast('Error', err.message || 'Failed to add members', 'error');
        } finally {
            setSelectedMembers([]);
            setShowAddMember(false);
        }
    };

    // ── Remove member ───────────────────────────────────────────────────────────
    const removeMember = (memberId, memberName) => {
        confirmAction({
            title: 'Remove Member',
            message: `Are you sure you want to remove ${memberName} from this group?`,
            onConfirm: async () => {
                try {
                    await authService.removeGroupMember(group._id || group.id, memberId);
                    setGroup(prev => ({
                        ...prev,
                        members: prev.members.filter(m => (m.user?._id || m.user?.id || m.user)?.toString() !== memberId?.toString())
                    }));
                    setMessages(prev => [...prev, {
                        _id: `sys${Date.now()}`,
                        text: `${memberName.split(' ')[0]} was removed from the group`,
                        sender: 'system',
                        createdAt: new Date().toISOString()
                    }]);
                    showToast('Success', `${memberName} removed from group.`, 'success');
                } catch (err) {
                    showToast('Error', err.message || 'Failed to remove member', 'error');
                }
            },
            confirmText: 'Remove',
            confirmStyle: 'destructive'
        });
    };

    // ── Accept / Decline join request ─────────────────────────────────────────
    const acceptRequest = async (req) => {
        const reqId = req._id || req.id;
        const groupId = group._id || group.id;

        // Optimistic update
        setGroup(prev => ({
            ...prev,
            members: [...prev.members, { user: { _id: reqId, name: req.name, avatar: req.avatar }, role: 'member' }]
        }));
        setPendingRequests(prev => prev.filter(r => (r._id || r.id) !== reqId));
        setMessages(prev => [...prev, {
            _id: `sys${Date.now()}`, text: `${req.name.split(' ')[0]} joined the group`, sender: 'system', createdAt: new Date().toISOString()
        }]);

        try {
            await authService.handleGroupRequest(groupId, reqId, 'accept');
            showToast('Accepted', `${req.name} joined the group.`, 'success');
        } catch (err) {
            showToast('Error', err.message || 'Failed to accept request', 'error');
            fetchGroupDetails(); // Rollback to server state
        }
    };

    const declineRequest = async (id) => {
        const reqId = id;
        const groupId = group._id || group.id;

        // Optimistic update
        setPendingRequests(prev => prev.filter(r => (r._id || r.id) !== reqId));

        try {
            await authService.handleGroupRequest(groupId, reqId, 'decline');
            showToast('Declined', 'Join request declined.', 'info');
        } catch (err) {
            showToast('Error', err.message || 'Failed to decline request', 'error');
            fetchGroupDetails(); // Rollback to server state
        }
    };

    // ── Save group name ─────────────────────────────────────────────────────────
    const saveGroupName = async () => {
        if (!groupNameDraft.trim()) return setEditingName(false);
        const newName = groupNameDraft.trim();
        setGroup(prev => ({ ...prev, name: newName })); // Optimistic
        setEditingName(false);
        try {
            await authService.updateGroup(group._id || group.id, { name: newName });
            showToast('Saved', 'Group name updated.', 'success');
        } catch (err) {
            setGroup(prev => ({ ...prev, name: group.name })); // Rollback on error
            showToast('Error', err.message || 'Failed to save group name', 'error');
        }
    };

    // ── Render message ──────────────────────────────────────────────────────────
    const renderMessage = ({ item, index }) => {
        if (item.sender === 'system') {
            return (
                <View style={styles.sysMsg}>
                    <Text style={styles.sysMsgText}>{item.text}</Text>
                </View>
            );
        }

        const myId = getSafeId(me);
        const senderId = getSafeId(item.sender);
        const isMe = senderId === myId;

        const prevMsg = index > 0 ? messages[index - 1] : null;
        const prevSenderId = (prevMsg?.sender?._id || prevMsg?.sender?.id || prevMsg?.sender)?.toString();
        const showSender = !isMe && (!prevMsg || prevSenderId !== senderId || prevMsg.sender === 'system');

        // Find member carefully if sender is just an ID string
        const member = (typeof item.sender === 'string')
            ? group.members?.find(m => (m.user?._id || m.user || m.id)?.toString() === senderId)
            : item.sender; // It's already populated

        const senderName = isMe ? (me?.name || 'You') : (member?.name || member?.user?.name || item.senderName || 'User');
        const senderAvatar = isMe ? me?.avatar : (member?.avatar || member?.user?.avatar);

        const time = item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : item.time;

        // Calculate Message Receipt Status (for my messages)
        let receiptIcon = null;
        let receiptColor = '#94A3B8'; // Grey by default

        if (isMe && item._id && !item._id.startsWith('temp')) {
            const memberCount = (group.members?.length || 1) - 1; // Exclude myself
            const deliveredCount = item.deliveredTo?.length || 0;
            const readCount = item.readBy?.length || 0;

            if (readCount >= memberCount && memberCount > 0) {
                // Read by everyone -> Double Blue Ticks
                receiptIcon = 'check-all';
                receiptColor = '#3B82F6'; // Blue
            } else if (deliveredCount > 0 || readCount > 0) {
                // Delivered to at least one person -> Double Grey Ticks
                receiptIcon = 'check-all';
            } else {
                // Sent to server, but no delivery acks yet -> Single Grey Tick
                receiptIcon = 'check';
            }
        } else if (isMe) {
            // Optimistic / sending state -> Clock
            receiptIcon = 'clock';
        }

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => setShowReactionPicker(item._id || item.id)}
                style={[styles.msgRow, isMe && styles.msgRowMe]}
            >
                {!isMe && (
                    <View style={styles.msgAvatarCol}>
                        {showSender ? (
                            senderAvatar ? (
                                <Image source={{ uri: senderAvatar }} style={styles.msgAvatar} />
                            ) : (
                                <ModernPlaceholder name={senderName} size={32} style={{ borderRadius: 12 }} />
                            )
                        ) : (
                            <View style={{ width: 32 }} />
                        )}
                    </View>
                )}
                <View style={{ maxWidth: '75%' }}>
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                        {showSender && !isMe && (
                            <Text style={styles.msgSender}>{senderName}</Text>
                        )}
                        <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
                            <Text style={[styles.msgTime, isMe && styles.msgTimeMe, { marginTop: 0 }]}>{time}</Text>
                            {isMe && receiptIcon && (
                                <Feather name={receiptIcon} size={14} color={receiptColor} />
                            )}
                        </View>
                    </View>
                    {/* Reactions - grouped by emoji */}
                    {item.reactions && item.reactions.length > 0 && (() => {
                        // Group per-user reaction records into { emoji → count, iReacted }
                        const grouped = {};
                        const myId = getSafeId(me);
                        item.reactions.forEach(r => {
                            const e = r.emoji;
                            if (!grouped[e]) grouped[e] = { emoji: e, count: 0, iReacted: false };
                            grouped[e].count++;
                            if (getSafeId(r.user) === myId) grouped[e].iReacted = true;
                        });
                        const pills = Object.values(grouped);
                        return (
                            <View style={[styles.reactionsRow, isMe && { alignSelf: 'flex-end', marginRight: 4 }]}>
                                {pills.map((r) => (
                                    <TouchableOpacity
                                        key={r.emoji}
                                        style={[styles.reactionBubble, r.iReacted && styles.reactionBubbleActive]}
                                        onPress={() => addReaction(getSafeId(item), r.emoji)}
                                    >
                                        <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                                        {r.count > 1 && <Text style={styles.reactionCount}>{r.count}</Text>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        );
                    })()}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* ── HEADER ── */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity style={styles.iconBtn} onPress={() => { Keyboard.dismiss(); navigation.goBack(); }}>
                    <Feather name="arrow-left" size={20} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerCenter} onPress={() => { Keyboard.dismiss(); setShowInfo(true); }} activeOpacity={0.8}>
                    <AvatarStack members={group.members} />
                    <View style={styles.headerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.headerName} numberOfLines={1}>{group.name}</Text>
                            {pendingRequests.length > 0 && (
                                <View style={styles.reqBadge}><Text style={styles.reqBadgeText}>{pendingRequests.length}</Text></View>
                            )}
                        </View>
                        <Text style={styles.headerMembers}>
                            {typingUsers.length > 0
                                ? <Text style={{ color: '#4ADE80', fontFamily: theme.typography.fontFamily.bold }}>{typingUsers[0].name.split(' ')[0]} is typing...</Text>
                                : `${group.members.length} members · #${group.interest || 'General'}`}
                        </Text>
                    </View>
                </TouchableOpacity>

                {isAmAdmin ? (
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAddMember(true)}>
                        <Feather name="user-plus" size={18} color="#FFF" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 44 }} />
                )}
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: '#FFF' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                {/* ── MESSAGES ── */}
                <FlatList
                    ref={flatRef}
                    data={[...new Map(messages.map(m => [getSafeId(m), m])).values()]}
                    keyExtractor={item => getSafeId(item)}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.msgList}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={15}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    removeClippedSubviews
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Feather name="message-circle" size={40} color="#6366F1" />
                            </View>
                            <Text style={styles.emptyTitle}>Your new chat room!</Text>
                            <Text style={styles.emptySubtitle}>Start the conversation by sending a message below.</Text>
                        </View>
                    }
                />

                {/* ── REACTION PICKER (long press) ── */}
                {showReactionPicker && (
                    <TouchableOpacity
                        style={styles.reactionOverlay}
                        onPress={() => setShowReactionPicker(null)}
                        activeOpacity={1}
                    >
                        <View style={styles.reactionPicker}>
                            {EMOJI_REACTIONS.map(emoji => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={styles.reactionPickerBtn}
                                    onPress={() => addReaction(showReactionPicker, emoji)}
                                >
                                    <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                )}

                {/* Typing indicator bubble */}
                {typingUsers.length > 0 && (
                    <View style={styles.typingBubbleOuter}>
                        {typingUsers[0].avatar ? (
                            <Image source={{ uri: typingUsers[0].avatar }} style={styles.typingAvatar} />
                        ) : (
                            <ModernPlaceholder name={typingUsers[0].name} size={28} style={{ borderRadius: 10, marginRight: 8 }} />
                        )}
                        <View style={styles.typingBubble}>
                            <TypingIndicator dotColor="#94A3B8" dotSize={5} spacing={3} />
                        </View>
                    </View>
                )}

                {/* ── INPUT ── */}
                <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <TouchableOpacity style={styles.attachBtn} onPress={() => Alert.alert('Coming soon!', 'File sharing will be available in the next update.')} activeOpacity={0.75}>
                        <Feather name="paperclip" size={20} color="#64748B" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Message..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        value={inputText}
                        onChangeText={handleType}
                    />

                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                        onPress={sendMessage}
                        disabled={!inputText.trim()}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#7C3AED']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.sendBtnGrad}
                        >
                            <Feather name="send" size={17} color="#FFF" style={{ marginLeft: 2 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* ══════════════════════════════════════════════════
                 MODALS
            ══════════════════════════════════════════════════ */}

            {/* GROUP INFO */}
            <Modal visible={showInfo} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setShowInfo(false)}
                    />
                    <View style={styles.sheet}>
                        <View style={styles.sheetHandle} />

                        <View style={styles.infoHeader}>
                            <LinearGradient
                                colors={['#6366F1', '#4F46E5']}
                                style={styles.infoGroupIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={{ fontSize: 36 }}>{group.emoji || '👥'}</Text>
                            </LinearGradient>

                            {editingName && isAmAdmin ? (
                                <View style={styles.nameEditRow}>
                                    <TextInput
                                        style={styles.nameEditInput}
                                        value={groupNameDraft}
                                        onChangeText={setGroupNameDraft}
                                        autoFocus
                                        onSubmitEditing={saveGroupName}
                                    />
                                    <TouchableOpacity onPress={saveGroupName} style={styles.nameEditSave}>
                                        <Text style={styles.nameEditSaveText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                isAmAdmin ? (
                                    <TouchableOpacity
                                        onPress={() => { setGroupNameDraft(group.name); setEditingName(true); }}
                                        style={styles.nameRow}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.infoGroupName}>{group.name}</Text>
                                        <Feather name="edit-2" size={16} color="#94A3B8" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.infoGroupName}>{group.name}</Text>
                                )
                            )}
                            <Text style={styles.infoGroupDesc}>{group.description || `Group chat for ${group.name}`}</Text>
                            <Text style={styles.infoCreated}>Created {group.createdAt || new Date().toISOString()}</Text>
                        </View>

                        <View style={styles.infoTabContainer}>
                            <View style={styles.infoTabRow}>
                                <TouchableOpacity
                                    style={[styles.infoTab, infoTab === 'members' && styles.infoTabActive]}
                                    onPress={() => setInfoTab('members')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.infoTabText, infoTab === 'members' && styles.infoTabTextActive]}>
                                        {group.members?.length || 0} Members
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.infoTab, infoTab === 'requests' && styles.infoTabActive]}
                                    onPress={() => setInfoTab('requests')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.infoTabText, infoTab === 'requests' && styles.infoTabTextActive]}>
                                        Requests
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {infoTab === 'members' && (
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
                                {(group.members || []).map((m, i) => {
                                    const memberId = (m.user?._id || m.user?.id || m.user || m.id)?.toString();
                                    const memberName = m.user?.name || m.name || 'User';
                                    const memberAvatar = m.user?.avatar || m.avatar;
                                    const isSelf = memberId === myId;
                                    const memberIsAdmin = m.role === 'admin';

                                    return (
                                        <View key={getSafeId(m, `member-${i}`)} style={styles.memberRow}>
                                            {memberAvatar ? (
                                                <Image source={{ uri: memberAvatar }} style={styles.memberAvatar} />
                                            ) : (
                                                <ModernPlaceholder name={memberName} size={48} style={{ borderRadius: 15 }} />
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.memberName}>{memberName}{isSelf ? ' (You)' : ''}</Text>
                                                {memberIsAdmin && (
                                                    <View style={styles.adminChip}>
                                                        <Feather name="shield" size={10} color="#6366F1" />
                                                        <Text style={styles.adminChipText}>Admin</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {/* Admin-only controls */}
                                            {isAmAdmin && !isSelf && (
                                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                                    <TouchableOpacity
                                                        style={[styles.removeMemberBtn, { backgroundColor: memberIsAdmin ? '#FEF9C3' : '#EEF0FF' }]}
                                                        onPress={() => authService.updateMemberRole(group._id || group.id, memberId, memberIsAdmin ? 'member' : 'admin')
                                                            .then(() => fetchGroupDetails())
                                                            .catch(e => showToast('Error', e.message, 'error'))}
                                                    >
                                                        <Feather name={memberIsAdmin ? 'shield-off' : 'shield'} size={14} color={memberIsAdmin ? '#CA8A04' : '#6366F1'} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.removeMemberBtn}
                                                        onPress={() => removeMember(memberId, memberName)}
                                                    >
                                                        <Feather name="user-minus" size={14} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Requests tab - admin only */}
                        {isAmAdmin && infoTab === 'requests' && (
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280, minHeight: 150 }}>
                                {pendingRequests.length === 0 ? (
                                    <View style={styles.emptyRequests}>
                                        <Feather name="user-check" size={32} color="#CBD5E1" />
                                        <Text style={styles.emptyRequestsText}>No pending requests</Text>
                                    </View>
                                ) : pendingRequests.map((req, i) => (
                                    <View key={getSafeId(req, `req-${i}`)} style={styles.requestRow}>
                                        {req.avatar ? (
                                            <Image source={{ uri: req.avatar }} style={styles.memberAvatar} />
                                        ) : (
                                            <ModernPlaceholder name={req.name} size={48} style={{ borderRadius: 15 }} />
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.memberName}>{req.name}</Text>
                                            <Text style={styles.requestInterest}>Interested in {req.interest || 'General'} · {req.time || 'now'}</Text>
                                        </View>
                                        <View style={styles.requestActions}>
                                            <TouchableOpacity style={styles.declineReq} onPress={() => declineRequest(req._id || req.id)} activeOpacity={0.8}>
                                                <Feather name="x" size={14} color="#94A3B8" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.acceptReq} onPress={() => acceptRequest(req)} activeOpacity={0.85}>
                                                <Feather name="check" size={14} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.infoDivider} />

                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                style={styles.leaveGroupBtn}
                                activeOpacity={0.8}
                                onPress={() => confirmAction({
                                    title: 'Leave Group',
                                    message: 'Are you sure you want to leave this group?',
                                    onConfirm: () => {
                                        setShowInfo(false);
                                        navigation.goBack();
                                        showToast('Left Group', 'You have left the group chat.', 'success');
                                    },
                                    confirmText: 'Leave',
                                    confirmStyle: 'destructive'
                                })}
                            >
                                <Feather name="log-out" size={18} color="#EF4444" style={{ marginRight: 10 }} />
                                <Text style={styles.leaveGroupText}>Leave Group</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.reportBtn}
                                activeOpacity={0.8}
                                onPress={() => setReportVisible(true)}
                            >
                                <Feather name="flag" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                                <Text style={styles.reportBtnText}>Report Group</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeSheetBtn}
                                activeOpacity={0.8}
                                onPress={() => setShowInfo(false)}
                            >
                                <Text style={styles.closeSheetText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* REPORT */}
            <Modal visible={reportVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.sheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={[styles.sheetTitle, { marginBottom: 16 }]}>Report This Group</Text>
                        {['Spam or misleading', 'Harassment or hate speech', 'Inappropriate content', 'Illegal activities', 'Other'].map((reason, i) => (
                            <TouchableOpacity key={i} style={styles.reportRow} activeOpacity={0.75} onPress={() => {
                                setReportVisible(false);
                                setShowInfo(false);
                                showToast('Reported ✅', 'Thank you for keeping our community safe. We will review this group within 24 hours.', 'success');
                            }}>
                                <Text style={styles.reportRowText}>{reason}</Text>
                                <Feather name="chevron-right" size={16} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.closeSheetBtn, { marginTop: 12 }]} onPress={() => setReportVisible(false)}>
                            <Text style={styles.closeSheetText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ADD MEMBER */}
            <Modal visible={showAddMember} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.sheet}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.sheetTitleRow}>
                            <Text style={styles.sheetTitle}>Add Members</Text>
                            <TouchableOpacity onPress={() => { setShowAddMember(false); setSelectedMembers([]); }}>
                                <Feather name="x" size={22} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {availableToAdd.length === 0 ? (
                            <View style={styles.emptyAddState}>
                                <Text style={styles.emptyAddText}>All your contacts are already in this group!</Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
                                {availableToAdd.map((u, i) => {
                                    const isSelected = selectedMembers.includes(getSafeId(u));
                                    return (
                                        <TouchableOpacity
                                            key={getSafeId(u, `add-${i}`)}
                                            style={[styles.addUserRow, isSelected && styles.addUserRowSelected]}
                                            onPress={() => setSelectedMembers(prev =>
                                                prev.includes(getSafeId(u)) ? prev.filter(id => id !== getSafeId(u)) : [...prev, getSafeId(u)]
                                            )}
                                            activeOpacity={0.75}
                                        >
                                            <Image source={{ uri: u.avatar }} style={styles.addUserAvatar} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.addUserName}>{u.name}</Text>
                                                <Text style={styles.addUserInterests} numberOfLines={1}>
                                                    {u.interests?.slice(0, 3).join(' · ')}
                                                </Text>
                                            </View>
                                            <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                                                {isSelected && <Feather name="check" size={13} color="#FFF" />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {selectedMembers.length > 0 && (
                            <TouchableOpacity style={styles.addConfirmBtn} onPress={confirmAddMembers} activeOpacity={0.85}>
                                <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.addConfirmGrad}>
                                    <Text style={styles.addConfirmText}>
                                        Add {selectedMembers.length} Member{selectedMembers.length > 1 ? 's' : ''} →
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },

    // HEADER
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 18,
        gap: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: { elevation: 10 },
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.15)' }
        }),
        zIndex: 10
    },
    iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
    stackAvatar: { width: 34, height: 34, borderRadius: 12, borderWidth: 1.5, borderColor: '#FFF' },
    stackExtra: { backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    stackExtraText: { fontSize: 10, color: '#FFF', fontFamily: theme.typography.fontFamily.bold },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', letterSpacing: -0.3 },
    headerMembers: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontFamily: theme.typography.fontFamily.medium },

    // MESSAGES
    msgList: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 32 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
    msgRowMe: { justifyContent: 'flex-end' },
    msgAvatarCol: { marginRight: 10, alignSelf: 'flex-end' },
    msgAvatar: { width: 34, height: 34, borderRadius: 12 },
    bubble: {
        borderRadius: 22,
        paddingVertical: 11,
        paddingHorizontal: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
            },
            android: { elevation: 2 },
            web: { boxShadow: '0px 2px 5px rgba(15, 23, 42, 0.05)' }
        })
    },
    bubbleMe: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
    bubbleThem: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    msgSender: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1', marginBottom: 5, letterSpacing: 0.2 },
    msgText: { fontSize: 15.5, fontFamily: theme.typography.fontFamily.medium, color: '#1E293B', lineHeight: 22 },
    msgTextMe: { color: '#FFF' },
    msgTime: { fontSize: 10, color: '#94A3B8', fontFamily: theme.typography.fontFamily.bold, marginTop: 5, textAlign: 'right' },
    msgTimeMe: { color: 'rgba(255,255,255,0.75)' },

    // SYSTEM MESSAGES
    sysMsg: { alignItems: 'center', marginVertical: 18 },
    sysMsgText: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: theme.typography.fontFamily.bold,
        backgroundColor: 'rgba(226, 232, 240, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },

    // REACTIONS
    reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6, marginLeft: 4 },
    reactionBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        gap: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    reactionBubbleActive: {
        backgroundColor: '#EEF0FF',
        borderColor: '#6366F1',
    },
    reactionEmoji: { fontSize: 14 },
    reactionCount: { fontSize: 11, color: '#475569', fontFamily: theme.typography.fontFamily.bold },

    // REACTION PICKER
    reactionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 999 },
    reactionPicker: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 36,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    reactionPickerBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    reactionPickerEmoji: { fontSize: 26 },

    inputWrap: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8 },
    attachBtn: { width: 40, height: 44, justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#F8FAFC', borderRadius: 22, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 8, paddingBottom: 10, fontSize: 15, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium, borderWidth: 1, borderColor: '#E2E8F0' },
    sendBtn: { marginBottom: 2 },
    sendBtnGrad: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },

    // TYPING
    typingBubbleOuter: {
        paddingHorizontal: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8
    },
    typingAvatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#E2E8F0', marginRight: 0 },
    typingBubble: {
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
            android: { elevation: 1 },
            web: { boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' }
        })
    },

    // MODAL SHARED
    overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 24,
        paddingBottom: 48,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: { elevation: 20 },
            web: { boxShadow: '0px -4px 12px rgba(0,0,0,0.1)' }
        })
    },
    sheetHandle: { width: 44, height: 5, borderRadius: 2.5, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 14, marginBottom: 12 },
    sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
    sheetTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', letterSpacing: -0.5 },

    // GROUP INFO MODAL
    infoHeader: { alignItems: 'center', paddingVertical: 24 },
    infoGroupIcon: { width: 88, height: 88, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
    infoGroupName: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', textAlign: 'center', letterSpacing: -0.6 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 14, marginBottom: 12 },
    nameEditInput: { flex: 1, fontSize: 22, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', borderBottomWidth: 2, borderBottomColor: '#6366F1', paddingVertical: 8, textAlign: 'center' },
    nameEditSave: { backgroundColor: '#6366F1', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
    nameEditSaveText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    infoGroupDesc: { fontSize: 15, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', lineHeight: 22, marginBottom: 8, paddingHorizontal: 20 },
    infoCreated: { fontSize: 12.5, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    infoDivider: { height: 1.5, backgroundColor: '#F1F5F9', marginVertical: 20 },
    infoTabContainer: { marginBottom: 20 },
    infoTabRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 25, padding: 4 },
    infoTab: { flex: 1, paddingVertical: 12, borderRadius: 22, alignItems: 'center' },
    infoTabActive: {
        backgroundColor: '#FFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 }
            },
            android: { elevation: 3 },
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }
        })
    },
    infoTabText: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#94A3B8' },
    infoTabTextActive: { color: '#1E293B', fontFamily: theme.typography.fontFamily.bold },

    memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 14 },
    memberAvatar: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#F8FAFC' },
    memberName: { fontSize: 15.5, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    adminChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F5F3FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
    adminChipText: { fontSize: 10.5, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    removeMemberBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    requestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 14 },
    requestInterest: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginTop: 2 },
    requestActions: { flexDirection: 'row', gap: 12 },
    declineReq: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    acceptReq: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
    emptyRequests: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyRequestsText: { fontSize: 15, color: '#94A3B8', fontFamily: theme.typography.fontFamily.bold },
    reqBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FACC15', justifyContent: 'center', alignItems: 'center', borderWeight: 2, borderColor: '#FFF' },
    reqBadgeText: { fontSize: 11, color: '#0F172A', fontFamily: theme.typography.fontFamily.extrabold },
    leaveGroupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#FEF2F2', borderRadius: 20 },
    leaveGroupText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#EF4444' },
    reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    reportBtnText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },
    closeSheetBtn: { alignItems: 'center', paddingVertical: 16, backgroundColor: '#F8FAFC', borderRadius: 20, marginTop: 4 },
    closeSheetText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },

    // ADD MEMBER MODAL
    addUserRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, borderRadius: 22, gap: 14, marginBottom: 8 },
    addUserRowSelected: { backgroundColor: '#F5F3FF' },
    addUserAvatar: { width: 52, height: 52, borderRadius: 18 },
    addUserName: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 4 },
    addUserInterests: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    selectCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    selectCircleActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    addConfirmBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 20 },
    addConfirmGrad: { paddingVertical: 18, alignItems: 'center' },
    addConfirmText: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    emptyAddState: { paddingVertical: 56, alignItems: 'center' },
    emptyAddText: { fontSize: 15, color: '#94A3B8', fontFamily: theme.typography.fontFamily.bold, textAlign: 'center' },
    reportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1.5, borderBottomColor: '#F1F5F9' },
    reportRowText: { fontSize: 16, fontFamily: theme.typography.fontFamily.semibold, color: '#1E293B' },

    // EMPTY STATE
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 30, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', lineHeight: 20 },
});
