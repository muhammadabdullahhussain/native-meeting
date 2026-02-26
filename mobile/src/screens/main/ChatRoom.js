import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, KeyboardAvoidingView, Platform, Image, Modal, Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';

const REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢'];

const AUTO_REPLIES = [
    "Haha, that's amazing! Catch up later?",
    "Sounds great! Let's do it 🚀",
    "I totally agree with you!",
    "That's really interesting, tell me more.",
    "Sure, I'm down! When works for you?",
    "Oh wow, I didn't know that!",
];

export default function ChatRoom({ route, navigation }) {
    const { user, chatData } = route.params || {};
    const insets = useSafeAreaInsets();
    const { confirmAction, showToast } = useToast();

    const initialMessages = (chatData?.messages && chatData.messages.length > 0)
        ? chatData.messages
        : [{ id: 'm1', text: 'Hey there! How are you doing?', sender: 'them', time: '10:00 AM', read: true }];

    const [messages, setMessages] = useState(initialMessages);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [reactionsFor, setReactionsFor] = useState(null); // message id
    const [reactions, setReactions] = useState({}); // { msgId: emoji }
    const [showAttach, setShowAttach] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        if (messages.length > 0 && messages[messages.length - 1].sender === 'me') {
            setIsTyping(true);
            const timer = setTimeout(() => {
                setIsTyping(false);
                const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: reply,
                    sender: 'them',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: false,
                }]);
            }, 2000 + Math.random() * 1000);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    const sendMessage = () => {
        if (inputText.trim() === '') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newMsg = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            replyTo: replyingTo,
            read: false,
        };
        setMessages(prev => [...prev, newMsg]);
        setInputText('');
        setReplyingTo(null);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
                                <Text style={s.readTick}>{item.read ? '✓✓' : '✓'}</Text>
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
                        {REACTIONS.map(emoji => (
                            <TouchableOpacity key={emoji} onPress={() => addReaction(item.id, emoji)} style={s.reactionBtn}>
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
                        <Feather name="arrow-left" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.headerUser} onPress={() => navigation.navigate('UserProfile', { user })} activeOpacity={0.85}>
                        <View style={s.headerAvatarWrap}>
                            <Image source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=9' }} style={s.headerAvatar} />
                            {user?.isOnline && <View style={s.headerOnlineDot} />}
                        </View>
                        <View>
                            <Text style={s.headerName}>{user?.name || 'Chat'}</Text>
                            <Text style={[s.headerStatus, user?.isOnline && s.headerStatusOnline]}>
                                {user?.isOnline ? '● Active now' : 'Tap to view profile'}
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
                                        message: `Are you sure you want to block ${user.name}? They won't be able to message you.`,
                                        onConfirm: () => {
                                            showToast('User Blocked', `${user.name} has been restricted.`, 'success');
                                            navigation.goBack();
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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={s.msgList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListHeaderComponent={() => (
                        <View style={s.dateDivider}>
                            <View style={s.dateLine} /><Text style={s.dateText}>Today</Text><View style={s.dateLine} />
                        </View>
                    )}
                />

                {/* Typing indicator */}
                {isTyping && (
                    <View style={s.typingRow}>
                        <Image source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=9' }} style={s.typingAvatar} />
                        <View style={s.typingBubble}>
                            <Text style={s.typingDots}>• • •</Text>
                        </View>
                    </View>
                )}

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

                {/* Input */}
                <View style={[s.inputRow, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : insets.bottom + 8 }]}>
                    <TouchableOpacity style={s.attachBtn} onPress={() => setShowAttach(true)} activeOpacity={0.8}>
                        <Feather name="plus" size={22} color="#6366F1" />
                    </TouchableOpacity>
                    <View style={s.inputWrap}>
                        <TextInput
                            style={s.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Message..."
                            placeholderTextColor="#94A3B8"
                            multiline
                        />
                        {inputText.trim() === '' && (
                            <TouchableOpacity style={s.cameraBtn}>
                                <Feather name="camera" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {inputText.trim() !== '' ? (
                        <TouchableOpacity style={s.sendBtn} onPress={sendMessage} activeOpacity={0.85}>
                            <LinearGradient colors={['#6366F1', '#7C3AED']} style={s.sendBtnGrad}>
                                <Feather name="send" size={16} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={s.voiceBtn} activeOpacity={0.85}
                            onPress={() => showToast('Voice Message', 'Coming soon!', 'info')}
                        >
                            <Feather name="mic" size={20} color="#6366F1" />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>

            {/* REPORT MODAL */}
            <Modal visible={reportVisible} animationType="slide" transparent>
                <View style={s.overlayDark}>
                    <View style={s.msgSheet}>
                        <View style={s.sheetHandle} />
                        <Text style={[s.msgSheetName, { marginBottom: 16 }]}>Report {user?.name}</Text>
                        {['Fake profile', 'Inappropriate content', 'Spam', 'Harassment', 'Other'].map((reason, i) => (
                            <TouchableOpacity key={i} style={s.reportRow} activeOpacity={0.75} onPress={() => {
                                setReportVisible(false);
                                showToast('Reported ✅', 'Thank you. Our team will review this user within 24 hours.', 'success');
                            }}>
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
    root: { flex: 1, backgroundColor: '#F7F9FC' },

    // HEADER
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    backBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    headerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    headerAvatarWrap: { position: 'relative' },
    headerAvatar: { width: 40, height: 40, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    headerOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#22C55E', borderWidth: 1.5, borderColor: '#0F172A' },
    headerName: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 1 },
    headerStatus: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: theme.typography.fontFamily.medium },
    headerStatusOnline: { color: '#86EFAC' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    headerIconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

    // MESSAGES
    msgList: { padding: 16, paddingBottom: 24 },
    dateDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 },
    dateLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dateText: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },

    msgWrap: { flexDirection: 'row', marginBottom: 8, position: 'relative' },
    msgWrapMe: { justifyContent: 'flex-end' },
    msgWrapThem: { justifyContent: 'flex-start' },

    bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
    bubbleMe: { backgroundColor: '#6366F1', borderBottomRightRadius: 5 },
    bubbleThem: { backgroundColor: '#FFF', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    bubbleMeConsec: { borderTopRightRadius: 5 },
    bubbleThemConsec: { borderTopLeftRadius: 5 },

    replyPreview: { maxWidth: '75%', marginBottom: 4, flexDirection: 'row', alignSelf: 'flex-start' },
    replyPreviewMe: { alignSelf: 'flex-end' },
    replyBar: { width: 3, borderRadius: 2, backgroundColor: '#6366F1', marginRight: 6 },
    replyText: { fontSize: 12, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, flex: 1 },

    msgText: { fontSize: 15, color: '#0F172A', lineHeight: 22, fontFamily: theme.typography.fontFamily.medium },
    msgTextMe: { color: '#FFF' },
    msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3, gap: 4 },
    msgTime: { fontSize: 10, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    msgTimeMe: { color: 'rgba(255,255,255,0.65)' },
    readTick: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: theme.typography.fontFamily.bold },

    reactionBadge: { position: 'absolute', bottom: -6, left: 8, backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },

    reactionPicker: { flexDirection: 'row', alignSelf: 'center', backgroundColor: '#FFF', borderRadius: 30, paddingHorizontal: 8, paddingVertical: 6, marginVertical: 4, gap: 4, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    reactionBtn: { padding: 6, borderRadius: 20 },

    // TYPING
    typingRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    typingAvatar: { width: 26, height: 26, borderRadius: 9 },
    typingBubble: { backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#F1F5F9' },
    typingDots: { fontSize: 18, color: '#94A3B8', letterSpacing: 2 },

    // REPLY BAR
    replyBar2: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderColor: '#C7D2FE' },
    replyBar2Inner: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    replyBar2Text: { flex: 1, fontSize: 13, color: '#6366F1', fontFamily: theme.typography.fontFamily.medium },

    // INPUT
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8 },
    attachBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F8FAFC', borderRadius: 22, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 6, borderWidth: 1, borderColor: '#E2E8F0', maxHeight: 120 },
    input: { flex: 1, fontSize: 15, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium, maxHeight: 100, paddingTop: 0, paddingBottom: 0 },
    cameraBtn: { marginLeft: 8, paddingBottom: 2 },
    sendBtn: { width: 42, height: 42, borderRadius: 14, overflow: 'hidden' },
    sendBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    voiceBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },

    // ATTACH MODAL
    overlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    attachSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    attachTitle: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 16, textAlign: 'center' },
    attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
    attachItem: { width: 88, alignItems: 'center' },
    attachIconBox: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    attachLabel: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#334155', textAlign: 'center' },

    // ADDITIONAL SHEET / REPORT STYLES
    msgSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36 },
    msgSheetName: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2, marginTop: 4 },
    reportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    reportRowText: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#334155' },
    cancelBtn: { backgroundColor: '#F8FAFC', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    cancelBtnText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },
});
