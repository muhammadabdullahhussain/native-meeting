import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    FlatList, TextInput, KeyboardAvoidingView, Platform,
    Modal, ScrollView, Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { DUMMY_USERS } from '../../data/dummy';
import { useToast } from '../../context/ToastContext';

// ── Static group data (replace with backend later) ─────────────────────────────
const DUMMY_GROUP = {
    id: 'g1',
    name: 'SF Coffee Lovers ☕',
    members: [
        { id: 'u1', name: 'Alice Cooper', avatar: 'https://i.pravatar.cc/150?img=1', isAdmin: false },
        { id: 'u3', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?img=15', isAdmin: true },
        { id: 'u6', name: 'Fatima Malik', avatar: 'https://i.pravatar.cc/150?img=25', isAdmin: false },
        { id: 'u7', name: 'George Kim', avatar: 'https://i.pravatar.cc/150?img=33', isAdmin: false },
    ],
    commonInterest: 'Coffee',
    description: 'A group for coffee lovers in SF to meet up, chat and explore new cafés together!',
    createdAt: 'Feb 2026',
};

const INITIAL_MESSAGES = [
    { id: 'm0', text: 'Hey everyone! Glad to have you all here ☕', sender: 'u3', senderName: 'Charlie', time: '10:00 AM', reactions: [] },
    { id: 'm1', text: 'This is awesome! Are we planning a meetup?', sender: 'u1', senderName: 'Alice', time: '10:02 AM', reactions: [] },
    { id: 'm2', text: 'Yes! This Saturday, Blue Bottle Coffee at 10am 🙌', sender: 'u6', senderName: 'Fatima', time: '10:05 AM', reactions: [{ emoji: '🙌', count: 2 }] },
    { id: 'm3', text: "I'll be there! Anyone else coming?", sender: 'me', senderName: 'You', time: '10:07 AM', reactions: [] },
    { id: 'm4', text: "Count me in! I'll bring my chess board 😄", sender: 'u7', senderName: 'George', time: '10:09 AM', reactions: [{ emoji: '😄', count: 1 }] },
    { id: 'm5', text: 'Perfect. See you all Saturday!', sender: 'u3', senderName: 'Charlie', time: '10:11 AM', reactions: [] },
];

const EMOJI_REACTIONS = ['👍', '❤️', '😄', '🔥', '🙌', '☕'];

function AvatarStack({ members }) {
    return (
        <View style={{ flexDirection: 'row' }}>
            {members.slice(0, 4).map((m, i) => (
                <Image
                    key={m.id}
                    source={{ uri: m.avatar }}
                    style={[styles.stackAvatar, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}
                />
            ))}
            {members.length > 4 && (
                <View style={[styles.stackAvatar, styles.stackExtra, { marginLeft: -10 }]}>
                    <Text style={styles.stackExtraText}>+{members.length - 4}</Text>
                </View>
            )}
        </View>
    );
}

export default function GroupChat({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { confirmAction, showToast } = useToast();
    const initialGroup = route?.params?.group || DUMMY_GROUP;

    const [group, setGroup] = useState(initialGroup);
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [text, setText] = useState('');
    const [showInfo, setShowInfo] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [editingName, setEditingName] = useState(false);
    const [groupNameDraft, setGroupNameDraft] = useState(group.name);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [infoTab, setInfoTab] = useState('members'); // 'members' | 'requests'
    const [pendingRequests, setPendingRequests] = useState([
        { id: 'pr1', name: 'David Kim', avatar: 'https://i.pravatar.cc/150?img=33', interest: 'Coffee', time: '2h ago' },
        { id: 'pr2', name: 'Sophia Lee', avatar: 'https://i.pravatar.cc/150?img=47', interest: 'Coffee · Travel', time: '5h ago' },
    ]);
    const [reportVisible, setReportVisible] = useState(false);

    const flatRef = useRef(null);

    // Users not yet in the group
    const availableToAdd = DUMMY_USERS.filter(u => !group.members.find(m => m.id === u.id));

    // ── Send message ───────────────────────────────────────────────────────────
    const sendMessage = () => {
        if (!text.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const msg = {
            id: `m${Date.now()}`,
            text: text.trim(),
            sender: 'me',
            senderName: 'You',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: [],
        };
        setMessages(prev => [...prev, msg]);
        setText('');
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    };

    // ── Add reaction ───────────────────────────────────────────────────────────
    const addReaction = (msgId, emoji) => {
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            const existing = m.reactions.find(r => r.emoji === emoji);
            if (existing) {
                return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
            }
            return { ...m, reactions: [...m.reactions, { emoji, count: 1 }] };
        }));
        setShowReactionPicker(null);
    };

    // ── Add members ─────────────────────────────────────────────────────────────
    const confirmAddMembers = () => {
        const newMembers = availableToAdd
            .filter(u => selectedMembers.includes(u.id))
            .map(u => ({ id: u.id, name: u.name, avatar: u.avatar, isAdmin: false }));
        if (newMembers.length === 0) return;
        setGroup(prev => ({ ...prev, members: [...prev.members, ...newMembers] }));
        // system message
        const names = newMembers.map(m => m.name.split(' ')[0]).join(', ');
        setMessages(prev => [...prev, {
            id: `sys${Date.now()}`, text: `${names} joined the group`, sender: 'system', senderName: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), reactions: [],
        }]);
        setSelectedMembers([]);
        setShowAddMember(false);
    };

    // ── Remove member ───────────────────────────────────────────────────────────
    const removeMember = (memberId, memberName) => {
        confirmAction({
            title: 'Remove Member',
            message: `Remove ${memberName} from the group?`,
            onConfirm: () => {
                setGroup(prev => ({ ...prev, members: prev.members.filter(m => m.id !== memberId) }));
                setMessages(prev => [...prev, {
                    id: `sys${Date.now()}`, text: `${memberName.split(' ')[0]} was removed from the group`, sender: 'system', senderName: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), reactions: [],
                }]);
                showToast('Member Removed', `${memberName} is no longer in the group.`, 'success');
            },
            confirmText: 'Remove',
            confirmStyle: 'destructive'
        });
    };

    // ── Accept / Decline join request ────────────────────────────────────────────
    const acceptRequest = (req) => {
        setGroup(prev => ({ ...prev, members: [...prev.members, { id: req.id, name: req.name, avatar: req.avatar, isAdmin: false }] }));
        setPendingRequests(prev => prev.filter(r => r.id !== req.id));
        setMessages(prev => [...prev, { id: `sys${Date.now()}`, text: `${req.name.split(' ')[0]} joined the group`, sender: 'system', senderName: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), reactions: [] }]);
    };

    const declineRequest = (id) => setPendingRequests(prev => prev.filter(r => r.id !== id));

    // ── Save group name ─────────────────────────────────────────────────────────
    const saveGroupName = () => {
        if (groupNameDraft.trim()) {
            setGroup(prev => ({ ...prev, name: groupNameDraft.trim() }));
        }
        setEditingName(false);
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
        const isMe = item.sender === 'me';
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const showSender = !isMe && (!prevMsg || prevMsg.sender !== item.sender || prevMsg.sender === 'system');
        const member = group.members.find(m => m.id === item.sender);

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => setShowReactionPicker(item.id)}
                style={[styles.msgRow, isMe && styles.msgRowMe]}
            >
                {!isMe && (
                    <View style={styles.msgAvatarCol}>
                        {showSender ? (
                            <Image source={{ uri: member?.avatar || 'https://i.pravatar.cc/150?img=1' }} style={styles.msgAvatar} />
                        ) : (
                            <View style={{ width: 32 }} />
                        )}
                    </View>
                )}
                <View style={{ maxWidth: '75%' }}>
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                        {showSender && !isMe && (
                            <Text style={styles.msgSender}>{item.senderName}</Text>
                        )}
                        <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
                        <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{item.time}</Text>
                    </View>
                    {/* Reactions */}
                    {item.reactions.length > 0 && (
                        <View style={[styles.reactionsRow, isMe && { alignSelf: 'flex-end', marginRight: 4 }]}>
                            {item.reactions.map((r, i) => (
                                <TouchableOpacity key={i} style={styles.reactionBubble} onPress={() => addReaction(item.id, r.emoji)}>
                                    <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                                    <Text style={styles.reactionCount}>{r.count}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            {/* ── HEADER ── */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[styles.header, { paddingTop: insets.top + 8 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerCenter} onPress={() => setShowInfo(true)} activeOpacity={0.8}>
                    <AvatarStack members={group.members} />
                    <View style={styles.headerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.headerName} numberOfLines={1}>{group.name}</Text>
                            {pendingRequests.length > 0 && (
                                <View style={styles.reqBadge}><Text style={styles.reqBadgeText}>{pendingRequests.length}</Text></View>
                            )}
                        </View>
                        <Text style={styles.headerMembers}>{group.members.length} members · #{group.commonInterest}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAddMember(true)}>
                    <Feather name="user-plus" size={18} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            {/* ── MESSAGES ── */}
            <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.msgList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
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

            {/* ── INPUT BAR ── */}
            <View style={[styles.inputWrap, { paddingBottom: insets.bottom + 8 }]}>
                <TouchableOpacity style={styles.attachBtn}>
                    <Feather name="paperclip" size={20} color="#94A3B8" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Message the group..."
                    placeholderTextColor="#94A3B8"
                    value={text}
                    onChangeText={setText}
                    multiline
                    onSubmitEditing={sendMessage}
                    blurOnSubmit
                />
                <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={sendMessage}
                    disabled={!text.trim()}
                >
                    <LinearGradient
                        colors={text.trim() ? ['#7C3AED', '#A855F7'] : ['#E2E8F0', '#E2E8F0']}
                        style={styles.sendBtnGrad}
                    >
                        <Feather name="send" size={16} color={text.trim() ? '#FFF' : '#94A3B8'} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* ══════════════════════════════════════════════════
                 MODAL 1 — GROUP INFO
            ══════════════════════════════════════════════════ */}
            <Modal visible={showInfo} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.sheet}>
                        <View style={styles.sheetHandle} />

                        {/* Group avatar / name */}
                        <View style={styles.infoHeader}>
                            <LinearGradient colors={['#0F172A', '#6366F1']} style={styles.infoGroupIcon}>
                                <Text style={{ fontSize: 32 }}>☕</Text>
                            </LinearGradient>
                            {editingName ? (
                                <View style={styles.nameEditRow}>
                                    <TextInput style={styles.nameEditInput} value={groupNameDraft} onChangeText={setGroupNameDraft} autoFocus onSubmitEditing={saveGroupName} />
                                    <TouchableOpacity onPress={saveGroupName} style={styles.nameEditSave}>
                                        <Text style={styles.nameEditSaveText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => { setGroupNameDraft(group.name); setEditingName(true); }} style={styles.nameRow}>
                                    <Text style={styles.infoGroupName}>{group.name}</Text>
                                    <Feather name="edit-2" size={14} color="#94A3B8" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            )}
                            <Text style={styles.infoGroupDesc}>{group.description}</Text>
                            <Text style={styles.infoCreated}>Created {group.createdAt}</Text>
                        </View>

                        <View style={styles.infoDivider} />

                        {/* TAB SWITCHER: Members | Join Requests */}
                        <View style={styles.infoTabRow}>
                            <TouchableOpacity
                                style={[styles.infoTab, infoTab === 'members' && styles.infoTabActive]}
                                onPress={() => setInfoTab('members')} activeOpacity={0.8}
                            >
                                <Text style={[styles.infoTabText, infoTab === 'members' && styles.infoTabTextActive]}>
                                    {group.members.length} Members
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.infoTab, infoTab === 'requests' && styles.infoTabActive]}
                                onPress={() => setInfoTab('requests')} activeOpacity={0.8}
                            >
                                <Text style={[styles.infoTabText, infoTab === 'requests' && styles.infoTabTextActive]}>
                                    Requests {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* MEMBERS TAB */}
                        {infoTab === 'members' && (
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 240 }}>
                                {group.members.map(m => (
                                    <View key={m.id} style={styles.memberRow}>
                                        <Image source={{ uri: m.avatar }} style={styles.memberAvatar} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.memberName}>{m.name}</Text>
                                            {m.isAdmin && (
                                                <View style={styles.adminChip}>
                                                    <Feather name="shield" size={10} color="#6366F1" />
                                                    <Text style={styles.adminChipText}>Admin</Text>
                                                </View>
                                            )}
                                        </View>
                                        {m.id !== 'me' && (
                                            <TouchableOpacity style={styles.removeMemberBtn} onPress={() => removeMember(m.id, m.name)}>
                                                <Feather name="user-minus" size={14} color="#EF4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {/* JOIN REQUESTS TAB */}
                        {infoTab === 'requests' && (
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 240 }}>
                                {pendingRequests.length === 0 ? (
                                    <View style={styles.emptyRequests}>
                                        <Feather name="user-check" size={28} color="#CBD5E1" />
                                        <Text style={styles.emptyRequestsText}>No pending requests</Text>
                                    </View>
                                ) : pendingRequests.map(req => (
                                    <View key={req.id} style={styles.requestRow}>
                                        <Image source={{ uri: req.avatar }} style={styles.memberAvatar} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.memberName}>{req.name}</Text>
                                            <Text style={styles.requestInterest}>Interested in {req.interest} · {req.time}</Text>
                                        </View>
                                        <View style={styles.requestActions}>
                                            <TouchableOpacity style={styles.declineReq} onPress={() => declineRequest(req.id)} activeOpacity={0.8}>
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

                        {/* Danger zone */}
                        <View style={{ gap: 8 }}>
                            <TouchableOpacity
                                style={styles.leaveGroupBtn}
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
                                <Feather name="log-out" size={16} color="#EF4444" style={{ marginRight: 10 }} />
                                <Text style={styles.leaveGroupText}>Leave Group</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.leaveGroupBtn, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' }]}
                                onPress={() => setReportVisible(true)}
                            >
                                <Feather name="flag" size={16} color="#94A3B8" style={{ marginRight: 10 }} />
                                <Text style={[styles.leaveGroupText, { color: '#64748B' }]}>Report Group</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setShowInfo(false)}>
                            <Text style={styles.closeSheetText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* REPORT MODAL */}
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

            {/* ══════════════════════════════════════════════════
                 MODAL 2 — ADD MEMBER
            ══════════════════════════════════════════════════ */}
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
                                {availableToAdd.map(u => {
                                    const isSelected = selectedMembers.includes(u.id);
                                    return (
                                        <TouchableOpacity
                                            key={u.id}
                                            style={[styles.addUserRow, isSelected && styles.addUserRowSelected]}
                                            onPress={() => setSelectedMembers(prev =>
                                                prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                            )}
                                            activeOpacity={0.75}
                                        >
                                            <Image source={{ uri: u.avatar }} style={styles.addUserAvatar} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.addUserName}>{u.name}</Text>
                                                <Text style={styles.addUserInterests} numberOfLines={1}>
                                                    {u.interests.slice(0, 3).join(' · ')}
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
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },

    // HEADER
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    stackAvatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#7C3AED' },
    stackExtra: { backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    stackExtraText: { fontSize: 10, color: '#FFF', fontFamily: theme.typography.fontFamily.bold },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    headerMembers: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: theme.typography.fontFamily.medium },

    // MESSAGES
    msgList: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 8 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
    msgRowMe: { justifyContent: 'flex-end' },
    msgAvatarCol: { marginRight: 8, alignSelf: 'flex-end' },
    msgAvatar: { width: 32, height: 32, borderRadius: 16 },
    bubble: { borderRadius: 18, padding: 11, paddingHorizontal: 14 },
    bubbleMe: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
    bubbleThem: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
    msgSender: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1', marginBottom: 3 },
    msgText: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#0F172A', lineHeight: 21 },
    msgTextMe: { color: '#FFF' },
    msgTime: { fontSize: 10, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginTop: 3, textAlign: 'right' },
    msgTimeMe: { color: 'rgba(255,255,255,0.6)' },

    // SYSTEM MESSAGES
    sysMsg: { alignItems: 'center', marginVertical: 8 },
    sysMsgText: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, backgroundColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },

    // REACTIONS
    reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, marginLeft: 4 },
    reactionBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#E2E8F0', gap: 3 },
    reactionEmoji: { fontSize: 13 },
    reactionCount: { fontSize: 11, color: '#64748B', fontFamily: theme.typography.fontFamily.bold },

    // REACTION PICKER
    reactionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999 },
    reactionPicker: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 28, paddingHorizontal: 12, paddingVertical: 10, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
    reactionPickerBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    reactionPickerEmoji: { fontSize: 24 },

    // INPUT
    inputWrap: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8 },
    attachBtn: { width: 40, height: 44, justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#F8FAFC', borderRadius: 22, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 8, paddingBottom: 10, fontSize: 15, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium, borderWidth: 1, borderColor: '#E2E8F0' },
    sendBtn: { marginBottom: 2 },
    sendBtnGrad: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },

    // MODAL SHARED
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 32 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    sheetTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },

    // GROUP INFO MODAL
    infoHeader: { alignItems: 'center', paddingVertical: 16 },
    infoGroupIcon: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    infoGroupName: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', textAlign: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, marginBottom: 8 },
    nameEditInput: { flex: 1, fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', borderBottomWidth: 2, borderBottomColor: '#6366F1', paddingVertical: 4, textAlign: 'center' },
    nameEditSave: { backgroundColor: '#6366F1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    nameEditSaveText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    infoGroupDesc: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', lineHeight: 19, marginBottom: 4 },
    infoCreated: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    infoDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
    infoSection: { paddingVertical: 8 },
    infoSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    infoSectionTitle: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    addMemberSmall: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
    addMemberSmallText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1' },

    // INFO TABS
    infoTabRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    infoTab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
    infoTabActive: { backgroundColor: '#FFF', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    infoTabText: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#94A3B8' },
    infoTabTextActive: { color: '#0F172A', fontFamily: theme.typography.fontFamily.bold },

    memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    memberAvatar: { width: 42, height: 42, borderRadius: 14 },
    memberName: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    adminChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
    adminChipText: { fontSize: 10, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    adminBadge: { fontSize: 11, color: '#F97316', fontFamily: theme.typography.fontFamily.bold, marginTop: 2 },
    removeMemberBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    // Requests
    requestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    requestInterest: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginTop: 2 },
    requestActions: { flexDirection: 'row', gap: 8 },
    declineReq: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    acceptReq: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
    emptyRequests: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyRequestsText: { fontSize: 14, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },

    // Header request badge
    reqBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FACC15', justifyContent: 'center', alignItems: 'center' },
    reqBadgeText: { fontSize: 10, color: '#0F172A', fontFamily: theme.typography.fontFamily.bold },

    leaveGroupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, backgroundColor: '#FEF2F2', borderRadius: 16, marginTop: 8, marginBottom: 10 },
    leaveGroupText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#EF4444' },
    closeSheetBtn: { alignItems: 'center', paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 16 },
    closeSheetText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },

    // ADD MEMBER MODAL
    addUserRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 16, gap: 12, marginBottom: 4 },
    addUserRowSelected: { backgroundColor: '#EFF6FF' },
    addUserAvatar: { width: 48, height: 48, borderRadius: 24 },
    addUserName: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 3 },
    addUserInterests: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    selectCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    selectCircleActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    addConfirmBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
    addConfirmGrad: { paddingVertical: 15, alignItems: 'center' },
    addConfirmText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    emptyAddState: { paddingVertical: 40, alignItems: 'center' },
    emptyAddText: { fontSize: 14, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center' },
    reportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    reportRowText: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#334155' },
});
