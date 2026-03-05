import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, KeyboardAvoidingView, Platform, Image, Modal, Alert
} from 'react-native';
import { Keyboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';
import { ModernPlaceholder } from '../../components/common/ModernPlaceholder';
import TypingIndicator from '../../components/common/TypingIndicator';
import { useSocket } from '../../context/SocketContext';
import { authService } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

const REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢'];

const getSafeId = (item, suffix = '') => {
    if (!item) return `null-${Date.now()}${suffix}`;
    if (typeof item === 'string') return item + suffix;
    const raw = item._id || item.id || item.user?._id || item.user?.id || item.user || item;
    if (typeof raw === 'string') return raw + suffix;
    if (raw && typeof raw === 'object') {
        const str = raw.toString();
        if (str && str !== '[object Object]') return str + suffix;
        const deep = raw._id || raw.id;
        if (deep) return deep.toString() + suffix;
    }
    return `fb-${Date.now()}${suffix}`;
};

export default function ChatRoom({ route, navigation }) {
    const { user, chatData } = route.params || {};
    const insets = useSafeAreaInsets();
    const { confirmAction, showToast } = useToast();

    const { user: me } = useAuth();
    const { on, emit, emitWithAck, socket } = useSocket();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState(user?.isOnline ? 'online' : 'offline');
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [reactions, setReactions] = useState({});
    const [reactionsFor, setReactionsFor] = useState(null);
    const [showAttach, setShowAttach] = useState(false);

    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Fetch message history
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                if (user?._id || user?.id) {
                    const targetId = user?._id || user?.id;
                    const data = await authService.getChatMessages(targetId);

                    const formatted = data.map(m => ({
                        id: m._id,
                        text: m.text,
                        sender: m.sender === (me?.id || me?._id) ? 'me' : 'them',
                        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        read: m.isRead,
                        readAt: m.readAt
                    }));
                    setMessages(formatted);

                    // Mark unread messages as read
                    const unreadIds = data
                        .filter(m => m.sender !== me?._id && !m.isRead)
                        .map(m => m._id);

                    if (unreadIds.length > 0) {
                        emitWithAck('message_read', {
                            messageIds: unreadIds,
                            senderId: targetId,
                            readerId: me?._id
                        }).catch(() => { });
                    }
                }
            } catch (err) {
                console.error('[ChatRoom] History fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user, me, emit]);

    const handleReport = async (reason) => {
        try {
            await authService.reportUser(user._id, reason);
            setReportVisible(false);
            showToast('Reported ✅', 'Thank you. The user has been reported and blocked.', 'success');
            navigation.goBack();
        } catch (err) {
            showToast('Error', err.message || 'Failed to report user', 'error');
        }
    };

    // Listen for real-time messages & presence
    useEffect(() => {
        const offMsg = on('new_message', (msg) => {
            const isFromThisUser = (msg.sender === user?._id || msg.sender === user?.id);
            if (isFromThisUser) {
                const newMsg = {
                    id: msg._id,
                    text: msg.text,
                    sender: 'them',
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: false,
                };
                setMessages(prev => [...prev, newMsg]);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Auto-read if screen is focused
                emit('message_read', {
                    messageIds: [msg._id],
                    senderId: msg.sender,
                    readerId: me?._id
                });
            }
        });

        const offRead = on('messages_marked_read', (data) => {
            if (data.readerId === user?._id || data.readerId === user?.id) {
                setMessages(prev => prev.map(m =>
                    data.messageIds.includes(m.id) ? { ...m, read: true } : m
                ));
            }
        });

        const offTyping = on('typing', (data) => {
            // ONLY handle if it's a direct chat (no groupId) AND the sender matches current peer
            if (!data.groupId && (data.senderId === user?._id || data.senderId === user?.id)) {
                setIsTyping(data.isTyping);
            }
        });

        // Check initial presence
        const targetId = user?._id || user?.id;
        if (socket && targetId) {
            emit('get_user_status', targetId, (status) => {
                setUserStatus(status);
            });
        }

        const offPresence = on('user_presence', (data) => {
            if (data.userId === user?._id || data.userId === user?.id) {
                setUserStatus(data.status);
            }
        });

        return () => {
            Keyboard?.dismiss();
            offMsg(); offRead(); offTyping(); offPresence();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            emitWithAck('typing', { receiverId: user?._id || user?.id, senderId: me?._id, senderName: me?.name, senderAvatar: me?.avatar, isTyping: false, groupId: null }).catch(() => { });
        };
    }, [on, emit, user, me, socket]);

    const sendMessage = async () => {
        if (inputText.trim() === '') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const text = inputText.trim();
        const targetId = user?._id || user?.id;

        // Optimistic UI update
        const tempId = Date.now().toString();
        const optimisticMsg = {
            id: tempId,
            text: text,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            sending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInputText('');
        setReplyingTo(null);

        // Stop typing immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitWithAck('typing', {
            receiverId: targetId,
            senderId: me?._id,
            senderName: me?.name || 'User',
            senderAvatar: me?.avatar,
            isTyping: false,
            groupId: null
        }).catch(() => { });

        try {
            const resp = await authService.sendMessage({
                receiverId: targetId,
                text: text
            });
            // Update the optimistic message with real ID
            setMessages(prev => prev.map(m => m.id === tempId ? {
                ...m,
                id: resp.data._id,
                sending: false
            } : m));
        } catch (err) {
            showToast('Error', 'Message failed to send', 'error');
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInputText(text); // Restore text
        }
    };

    const handleType = (text) => {
        setInputText(text);
        const isCurrentlyTyping = text.length > 0;

        // Notify typing (explicitly for direct chat: no groupId)
        emitWithAck('typing', {
            receiverId: user?._id || user?.id,
            senderId: me?._id,
            senderName: me?.name || 'User',
            senderAvatar: me?.avatar,
            isTyping: isCurrentlyTyping,
            groupId: null
        }).catch(() => { });

        // Auto-clear typing indicator after pause
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isCurrentlyTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                emitWithAck('typing', {
                    receiverId: user?._id || user?.id,
                    senderId: me?._id,
                    senderName: me?.name || 'User',
                    senderAvatar: me?.avatar,
                    isTyping: false,
                    groupId: null
                }).catch(() => { });
            }, 3000);
        }
    };

    const addReaction = (msgId, emoji) => {
        setReactions(r => ({ ...r, [msgId]: emoji }));
        setReactionsFor(null);
    };

    const renderMessage = ({ item, index }) => {
        const isMe = item.sender === 'me';
        const prev = index > 0 ? messages[index - 1] : null;
        const isConsecutive = prev && prev.sender === item.sender;
        const reaction = reactions[item.id];

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setReactionsFor(item.id);
                }}
                delayLongPress={350}
            >
                <View style={[
                    s.msgWrap,
                    isMe ? s.msgWrapMe : s.msgWrapThem,
                    isConsecutive && { marginTop: 2 }
                ]}>
                    {/* Reply preview */}
                    {item.replyTo && (
                        <View style={[s.replyPreview, isMe && s.replyPreviewMe]}>
                            <View style={s.replyBar} />
                            <Text style={s.replyText} numberOfLines={1}>{item.replyTo.text}</Text>
                        </View>
                    )}

                    <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem, isConsecutive && (isMe ? s.bubbleMeConsec : s.bubbleThemConsec)]}>
                        <Text style={[s.msgText, isMe && s.msgTextMe]}>{item.text}</Text>
                        <View style={s.msgMeta}>
                            <Text style={[s.msgTime, isMe && s.msgTimeMe]}>{item.time}</Text>
                            {isMe && (
                                <View style={s.tickWrap}>
                                    {item.sending ? (
                                        <Feather name="clock" size={11} color="rgba(255,255,255,0.5)" />
                                    ) : item.read ? (
                                        <View style={{ flexDirection: 'row' }}>
                                            <Feather name="check" size={12} color="#4ADE80" style={{ marginRight: -5 }} />
                                            <Feather name="check" size={12} color="#4ADE80" />
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row' }}>
                                            <Feather name="check" size={12} color="rgba(255,255,255,0.5)" style={{ marginRight: -5 }} />
                                            <Feather name="check" size={12} color="rgba(255,255,255,0.5)" />
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {reaction && (
                        <View style={[s.reactionBadge, isMe && { right: 8, left: undefined }]}>
                            <Text style={{ fontSize: 14 }}>{reaction}</Text>
                        </View>
                    )}
                </View>

                {/* Swipe-to-reply hint */}
                {reactionsFor === item.id && (
                    <View style={s.reactionPicker}>
                        {REACTIONS.map((emoji, i) => (
                            <TouchableOpacity key={`${emoji}-${i}`} onPress={() => addReaction(item.id, emoji)} style={s.reactionBtn}>
                                <Text style={{ fontSize: 22 }}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => { setReplyingTo(item); setReactionsFor(null); }} style={s.reactionBtn}>
                            <Feather name="corner-up-left" size={18} color="#6366F1" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setReactionsFor(null)} style={s.reactionBtn}>
                            <Feather name="x" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={s.root}>
            {/* HEADER */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[s.header, { paddingTop: insets.top + 8 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={s.headerLeft}>
                    <TouchableOpacity
                        onPress={() => {
                            Keyboard?.dismiss();
                            navigation.goBack();
                        }}
                        style={s.backBtn}
                        activeOpacity={0.8}
                    >
                        <Feather name="arrow-left" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.headerUser}
                        onPress={() => {
                            Keyboard?.dismiss();
                            navigation.navigate('UserProfile', { user });
                        }}
                        activeOpacity={0.85}
                    >
                        <View style={s.headerAvatarWrap}>
                            {user?.avatar ? (
                                <Image source={{ uri: user.avatar }} style={s.headerAvatar} />
                            ) : (
                                <ModernPlaceholder name={user?.name} size={44} style={{ borderRadius: 14 }} />
                            )}
                            {userStatus === 'online' && <View style={s.headerOnlineDot} />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                            <Text style={s.headerName} numberOfLines={1} ellipsizeMode="tail">{user?.name || 'Chat'}</Text>
                            <Text
                                style={[
                                    s.headerStatus,
                                    (isTyping || userStatus === 'online') && s.headerStatusOnline
                                ]}
                                numberOfLines={1}
                            >
                                {isTyping ? 'typing...' : userStatus === 'online' ? '● Active now' : 'Tap to view profile'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={s.headerRight}>
                    <TouchableOpacity style={s.headerIconBtn} onPress={() => showToast('Voice Call', 'Coming soon!', 'info')} activeOpacity={0.8}>
                        <Feather name="phone" size={18} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.headerIconBtn} onPress={() => showToast('Video Call', 'Coming soon!', 'info')} activeOpacity={0.8}>
                        <Feather name="video" size={18} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.headerIconBtn} activeOpacity={0.8}
                        onPress={() => Alert.alert('Options', user?.name, [
                            { text: 'View Profile', onPress: () => navigation.navigate('UserProfile', { user }) },
                            { text: 'Mute Notifications', onPress: () => showToast('Muted', 'Notifications have been muted.', 'success') },
                            { text: 'Report User', style: 'destructive', onPress: () => setReportVisible(true) },
                            {
                                text: 'Block User', style: 'destructive', onPress: () => {
                                    confirmAction({
                                        title: 'Block User? 🚫',
                                        message: `Are you sure you want to block ${user.name}? They won't be able to message you and you will no longer see each other.`,
                                        onConfirm: async () => {
                                            try {
                                                await authService.blockUser(user._id);
                                                showToast('User Blocked', `${user.name} has been restricted.`, 'success');
                                                navigation.goBack();
                                            } catch (err) {
                                                showToast('Error', err.message || 'Failed to block user', 'error');
                                            }
                                        },
                                        confirmText: 'Block',
                                        confirmStyle: 'destructive'
                                    });
                                }
                            },
                            { text: 'Cancel', style: 'cancel' },
                        ])}
                    >
                        <Feather name="more-vertical" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >

                {/* ── MESSAGES ── */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, i) => getSafeId(item, `msg-${i}`)}
                    renderItem={renderMessage}
                    contentContainerStyle={[s.msgList, { flexGrow: 1, justifyContent: 'flex-end' }]}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={15}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    removeClippedSubviews
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />


                {/* Reply bar */}
                {replyingTo && (
                    <View style={s.replyBar2}>
                        <View style={s.replyBar2Inner}>
                            <Feather name="corner-up-left" size={14} color="#6366F1" style={{ marginRight: 8 }} />
                            <Text style={s.replyBar2Text} numberOfLines={1}>Replying: {replyingTo.text}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyingTo(null)}>
                            <Feather name="x" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                )}
                {/* Typing indicator bubble */}
                {isTyping && (
                    <View style={s.typingBubbleOuter}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={s.typingAvatar} />
                        ) : (
                            <ModernPlaceholder name={user?.name} size={28} style={{ borderRadius: 10, marginRight: 8 }} />
                        )}
                        <View style={s.typingBubble}>
                            <TypingIndicator dotColor="#94A3B8" dotSize={5} spacing={3} />
                        </View>
                    </View>
                )}

                {/* Input */}
                <View style={[s.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <TouchableOpacity style={s.attachBtn} onPress={() => setShowAttach(true)} activeOpacity={0.8}>
                        <Feather name="plus" size={22} color="#6366F1" />
                    </TouchableOpacity>
                    <View style={s.inputWrap}>
                        <TextInput
                            style={s.input}
                            value={inputText}
                            onChangeText={handleType}
                            placeholder="Message..."
                            placeholderTextColor="#94A3B8"
                            multiline
                        />
                        {inputText.trim() === '' && (
                            <TouchableOpacity style={s.cameraBtn} onPress={() => showToast('Camera', 'Coming soon!', 'info')}>
                                <Feather name="camera" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={s.actionBtnWrap}>
                        {inputText.trim() !== '' ? (
                            <TouchableOpacity onPress={sendMessage} activeOpacity={0.85} style={s.sendBtn}>
                                <Feather name="send" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={s.voiceBtn} activeOpacity={0.85}
                                onPress={() => showToast('Voice Message', 'Coming soon!', 'info')}
                            >
                                <Feather name="mic" size={20} color="#6366F1" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* REPORT MODAL */}
            <Modal visible={reportVisible} animationType="slide" transparent>
                <View style={s.overlayDark}>
                    <View style={s.msgSheet}>
                        <View style={s.sheetHandle} />
                        <Text style={[s.msgSheetName, { marginBottom: 16 }]}>Report {user?.name}</Text>
                        {['Fake profile', 'Inappropriate content', 'Spam', 'Harassment', 'Other'].map((reason, i) => (
                            <TouchableOpacity key={i} style={s.reportRow} activeOpacity={0.75} onPress={() => handleReport(reason)}>
                                <Text style={s.reportRowText}>{reason}</Text>
                                <Feather name="chevron-right" size={16} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[s.cancelBtn, { marginTop: 12 }]} onPress={() => setReportVisible(false)} activeOpacity={0.8}>
                            <Text style={s.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ATTACH OPTIONS MODAL */}
            <Modal visible={showAttach} animationType="slide" transparent onRequestClose={() => setShowAttach(false)}>
                <TouchableOpacity style={s.overlayDark} activeOpacity={1} onPress={() => setShowAttach(false)}>
                    <View style={s.attachSheet}>
                        <View style={s.sheetHandle} />
                        <Text style={s.attachTitle}>Share</Text>
                        <View style={s.attachGrid}>
                            {[
                                { icon: 'image', label: 'Gallery', color: '#6366F1', bg: '#EEF2FF' },
                                { icon: 'camera', label: 'Camera', color: '#0EA5E9', bg: '#EFF9FF' },
                                { icon: 'file', label: 'Document', color: '#F97316', bg: '#FFEDD5' },
                                { icon: 'map-pin', label: 'Location', color: '#22C55E', bg: '#F0FDF4' },
                                { icon: 'music', label: 'Audio', color: '#A855F7', bg: '#FAF5FF' },
                                { icon: 'gift', label: 'GIF', color: '#EC4899', bg: '#FDF2F8' },
                            ].map((opt, i) => (
                                <TouchableOpacity key={i} style={s.attachItem} activeOpacity={0.8}
                                    onPress={() => { setShowAttach(false); showToast(opt.label, 'Coming soon!', 'info'); }}
                                >
                                    <View style={[s.attachIconBox, { backgroundColor: opt.bg }]}>
                                        <Feather name={opt.icon} size={22} color={opt.color} />
                                    </View>
                                    <Text style={s.attachLabel}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F1F5F9' }, // Lighter gray background for message contrast

    // HEADER
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 10
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerUser: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    headerAvatarWrap: { position: 'relative' },
    headerAvatar: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
    headerOnlineDot: { position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2.5, borderColor: '#1D3461' },
    headerName: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', letterSpacing: -0.3 },
    headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: theme.typography.fontFamily.medium },
    headerStatusOnline: { color: '#4ADE80', fontFamily: theme.typography.fontFamily.bold },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

    // MESSAGES
    msgList: { padding: 16, paddingBottom: 8 },
    dateDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, paddingHorizontal: 20 },
    dateLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dateText: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.bold, marginHorizontal: 12, textTransform: 'uppercase', letterSpacing: 1 },

    msgWrap: { flexDirection: 'row', marginBottom: 12, position: 'relative' },
    msgWrapMe: { justifyContent: 'flex-end' },
    msgWrapThem: { justifyContent: 'flex-start' },

    bubble: {
        maxWidth: '82%',
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 22,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    bubbleMe: {
        backgroundColor: '#6366F1',
        borderBottomRightRadius: 4,
    },
    bubbleThem: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    bubbleMeConsec: { borderTopRightRadius: 4, borderBottomRightRadius: 22 },
    bubbleThemConsec: { borderTopLeftRadius: 4, borderBottomLeftRadius: 22 },

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

    replyPreview: { maxWidth: '75%', marginBottom: 6, flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.03)', padding: 6, borderRadius: 8 },
    replyPreviewMe: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.1)' },
    replyBar: { width: 3, borderRadius: 2, backgroundColor: '#6366F1', marginRight: 8 },
    replyText: { fontSize: 12, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, flex: 1 },

    msgText: { fontSize: 15.5, color: '#1E293B', lineHeight: 22, fontFamily: theme.typography.fontFamily.medium },
    msgTextMe: { color: '#FFF' },
    msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
    msgTime: { fontSize: 10.5, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
    tickWrap: { justifyContent: 'center', alignItems: 'center', marginLeft: 1 },

    reactionBadge: {
        position: 'absolute',
        bottom: -10,
        left: 12,
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6
    },

    reactionPicker: {
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: '#FFF',
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginVertical: 8,
        gap: 8,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    reactionBtn: { padding: 6, borderRadius: 20 },

    // TYPING - WhatsApp style
    typingRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    typingAvatar: { width: 26, height: 26, borderRadius: 13 },
    typingBubble: {
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1
    },
    typingDotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#94A3B8' },

    // REPLY BAR
    replyBar2: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: '#DDD6FE',
        marginHorizontal: 12,
        borderRadius: 16,
        marginBottom: -10,
        zIndex: 5
    },
    replyBar2Inner: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    replyBar2Text: { flex: 1, fontSize: 13, color: '#6D28D9', fontFamily: theme.typography.fontFamily.semibold },

    // INPUT
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingTop: 8,
        backgroundColor: 'transparent',
        gap: 6,
        position: 'relative'
    },
    attachBtn: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
    inputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        maxHeight: 120,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
    },
    input: { flex: 1, fontSize: 16, color: '#1E293B', fontFamily: theme.typography.fontFamily.medium, maxHeight: 100, paddingTop: 0, paddingBottom: 0 },
    cameraBtn: { marginLeft: 12, paddingBottom: 2 },
    sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
    sendBtnGrad: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    voiceBtn: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },

    // ATTACH MODAL
    overlayDark: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
    attachSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 24, paddingBottom: 48 },
    sheetHandle: { width: 44, height: 5, borderRadius: 2.5, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 14, marginBottom: 12 },
    attachTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 24, textAlign: 'center', letterSpacing: -0.5 },
    attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' },
    attachItem: { width: 95, alignItems: 'center' },
    attachIconBox: { width: 68, height: 68, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    attachLabel: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: '#475569', textAlign: 'center' },

    // ADDITIONAL SHEET / REPORT STYLES
    msgSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 24, paddingBottom: 48 },
    msgSheetName: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 8, marginTop: 4 },
    reportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    reportRowText: { fontSize: 16, fontFamily: theme.typography.fontFamily.semibold, color: '#1E293B' },
    cancelBtn: { backgroundColor: '#F8FAFC', borderRadius: 20, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    cancelBtnText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },
});
