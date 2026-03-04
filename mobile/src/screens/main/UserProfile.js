import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    ScrollView, Alert, Modal, FlatList, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { ModernPlaceholder } from '../../components/common/ModernPlaceholder';

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserProfile({ route, navigation }) {
    const { user: authUser, blockedUserIds, addToBlocked, removeFromBlocked } = useAuth();
    const { showToast, confirmAction } = useToast();

    // Safety Fallbacks
    const myInterests = authUser?.interests || [];
    const isPremium = authUser?.isPremium || false;

    const user = route.params?.user || {
        name: 'Unknown User', username: '@unknown', city: 'Unknown City',
        bio: 'No bio available.', interests: [], avatar: 'https://i.pravatar.cc/150?img=1',
        distanceKm: 0, isOnline: false, responseRate: 85, lookingFor: ['Networking'],
    };

    // Safely resolve the user ID — Discover returns `id`, DB returns `_id`
    const userId = user._id || user.id;

    const insets = useSafeAreaInsets();
    const [requestSent, setRequestSent] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null); // 'none', 'pending', 'accepted', 'blocked'
    const [isRequester, setIsRequester] = useState(false);
    const [activePhoto, setActivePhoto] = useState(0);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                if (!userId) return;
                const statusData = await authService.getConnectionStatus(userId);

                if (blockedUserIds.includes(userId)) {
                    setConnectionStatus('blocked');
                } else {
                    setConnectionStatus(statusData.status);
                }

                setIsRequester(statusData.isRequester);
                if (statusData.status === 'pending' && statusData.isRequester) {
                    setRequestSent(true);
                }
            } catch (err) {
                console.error('[UserProfile] Status check failed:', err);
                setConnectionStatus('none');
            } finally {
                setIsLoadingStatus(false);
            }
        };
        checkStatus();
    }, [userId]);

    const sharedInterests = (user.interests || []).filter(i => myInterests.includes(i));
    const matchScore = user.matchScore || Math.min(100, Math.round((sharedInterests.length / Math.max(myInterests.length, 1)) * 100) + 40);

    const sendMessageRequest = async () => {
        if (requestSent || connectionStatus === 'pending') {
            showToast('Already Sent', 'Your message request is pending acceptance.', 'info');
            return;
        }

        try {
            await authService.sendConnectionRequest(userId);
            setRequestSent(true);
            setConnectionStatus('pending');
            setIsRequester(true);
            setShowMessageModal(false);
            showToast('Request Sent! ✅', `${user.name} will see your message request.`, 'success');
        } catch (err) {
            showToast('Error', err.message || 'Failed to send request', 'error');
        }
    };

    const handleBlock = async () => {
        try {
            await authService.blockUser(userId);
            addToBlocked(userId);
            setConnectionStatus('blocked');
            showToast('User Blocked', `${user.name} has been restricted.`, 'info');
        } catch (err) {
            showToast('Error', err.message || 'Failed to block user', 'error');
        }
    };

    const handleUnblock = async () => {
        try {
            await authService.unblockUser(userId);
            removeFromBlocked(userId);
            const statusData = await authService.getConnectionStatus(userId);
            setConnectionStatus(statusData.status);
            showToast('User Unblocked', `${user.name} has been restored.`, 'success');
        } catch (err) {
            showToast('Error', err.message || 'Failed to unblock user', 'error');
        }
    };

    const handleReport = async (reason) => {
        try {
            await authService.reportUser(userId, reason);
            setReportVisible(false);
            showToast('Reported ✅', 'Thank you. The user has been reported and blocked.', 'success');
            navigation.goBack();
        } catch (err) {
            showToast('Error', err.message || 'Failed to report user', 'error');
        }
    };

    return (
        <View style={s.root}>
            {/* Floating back + options */}
            <View style={[s.floatingNav, { top: insets.top + 8 }]}>
                <TouchableOpacity style={s.floatingBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                    <Feather name="arrow-left" size={18} color="#FFF" />
                </TouchableOpacity>
                <View style={s.floatingRight}>
                    <TouchableOpacity style={s.floatingBtn} onPress={() => setReportVisible(true)} activeOpacity={0.85}>
                        <Feather name="flag" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces>
                {/* BANNER SECTION */}
                <View style={s.bannerContainer}>
                    <Image
                        source={{ uri: user.banner || user.photos?.[1] || 'https://images.unsplash.com/photo-1557683316-973673baf926' }}
                        style={s.bannerImage}
                    />
                    <LinearGradient
                        colors={['rgba(15,23,42,0.4)', 'transparent', 'rgba(15,23,42,0.8)']}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                {/* OVERLAPPING AVATAR */}
                <View style={s.avatarProfileContainer}>
                    <View style={s.avatarWrapper}>
                        {user.avatar ? (
                            <Image source={{ uri: user.avatar }} style={s.mainAvatar} />
                        ) : (
                            <View style={s.fallbackAvatar}>
                                <Text style={s.fallbackAvatarText}>
                                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                                </Text>
                            </View>
                        )}
                        {user.isOnline && <View style={s.onlineIndicator} />}
                    </View>
                </View>

                {/* Identity (Centered) */}
                <View style={s.identityBox}>
                    <View style={s.nameRow}>
                        <Text style={s.nameText}>{user.name || 'Interesta User'}</Text>
                        {user.isVerified && (
                            <View style={s.verifiedBadge}>
                                <Feather name="check" size={10} color="#FFF" />
                            </View>
                        )}
                        {user.isPremium && <Text style={s.premiumCrown}>👑</Text>}
                    </View>
                    {user.username ? (
                        <Text style={s.usernameText}>{user.username}</Text>
                    ) : (
                        <Text style={[s.usernameText, { color: '#94A3B8' }]}>@member</Text>
                    )}

                    <View style={s.locationBadge}>
                        <Feather name="map-pin" size={12} color="#6366F1" />
                        <Text style={s.locationLabel}>
                            {user.city || 'Location Hidden'}
                            {user.distanceKm ? ` · ${user.distanceKm < 2 ? 'Nearby' : `${user.distanceKm} km`}` : ''}
                        </Text>
                    </View>
                </View>

                {/* Match score + shared interests — only show if data exists and is significant */}
                {sharedInterests.length > 0 && matchScore > 0 && (
                    <View style={s.matchCard}>
                        <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={s.matchGrad}>
                            <View style={s.matchRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.matchLabel}>Interest Match</Text>
                                    <Text style={s.matchScore}>{matchScore}% Compatible</Text>
                                </View>
                                <View style={s.matchBubbles}>
                                    {sharedInterests.slice(0, 3).map(i => (
                                        <View key={i} style={s.matchChip}>
                                            <Text style={s.matchChipText}>{i}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={s.matchTrack}>
                                <LinearGradient
                                    colors={['#6366F1', '#A855F7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[s.matchFill, { width: `${matchScore}%` }]}
                                />
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* CTA Buttons */}
                <View style={s.ctaRow}>
                    {isLoadingStatus ? (
                        // Loading skeleton while fetching connection status
                        <View style={[s.msgCta, { backgroundColor: '#F1F5F9', borderRadius: 18, height: 52, justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium }}>Checking status...</Text>
                        </View>
                    ) : connectionStatus === 'accepted' ? (
                        <TouchableOpacity style={s.msgCta} onPress={() => navigation.navigate('ChatRoom', { user })} activeOpacity={0.88}>
                            <LinearGradient colors={['#22C55E', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.msgCtaGrad}>
                                <Feather name="message-circle" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={s.msgCtaText}>Open Chat</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (connectionStatus === 'pending' || requestSent) ? (
                        <View style={s.sentBadge}>
                            <Feather name="clock" size={16} color="#6366F1" style={{ marginRight: 8 }} />
                            <Text style={s.sentBadgeText}>
                                {isRequester ? 'Message Request Pending' : 'Sent you a request'}
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={s.msgCta} onPress={() => setShowMessageModal(true)} activeOpacity={0.88}>
                            <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.msgCtaGrad}>
                                <Feather name="send" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={s.msgCtaText}>Send Message Request</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[s.blockBtn, connectionStatus === 'blocked' && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]} onPress={() =>
                        connectionStatus === 'blocked' ?
                            confirmAction({
                                title: 'Unblock User',
                                message: `Do you want to unblock ${user.name}? This will allow them to message you again.`,
                                confirmText: 'Unblock',
                                onConfirm: handleUnblock
                            }) :
                            confirmAction({
                                title: 'Block User',
                                message: `Are you sure you want to block ${user.name}? You will no longer see each other's profiles or chats.`,
                                confirmText: 'Block',
                                confirmStyle: 'destructive',
                                onConfirm: handleBlock
                            })
                    } activeOpacity={0.8}>
                        <Feather name={connectionStatus === 'blocked' ? "unlock" : "slash"} size={18} color={connectionStatus === 'blocked' ? "#EF4444" : "#94A3B8"} />
                    </TouchableOpacity>
                </View>

                {/* About */}
                {user.bio ? (
                    <View style={s.card}>
                        <Text style={s.cardTitle}>About</Text>
                        <Text style={s.bioText}>{user.bio}</Text>
                    </View>
                ) : null}

                {/* Info row */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Details</Text>
                    {[
                        { icon: 'map-pin', label: 'Location', value: user.city },
                        { icon: 'activity', label: 'Response Rate', value: `${user.responseRate || 85}%` },
                        { icon: 'heart', label: 'Looking For', value: (user.lookingFor || []).join(', ') || 'Open to anything' },
                    ].filter(r => r.value).map((row, i) => (
                        <View key={i} style={s.detailRow}>
                            <View style={s.detailIcon}><Feather name={row.icon} size={15} color="#6366F1" /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.detailLabel}>{row.label}</Text>
                                <Text style={s.detailValue}>{row.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Interests */}
                {user.interests?.length > 0 && (
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Interests</Text>
                        <View style={s.chipsWrap}>
                            {user.interests.map((tag, i) => {
                                const isShared = myInterests.includes(tag);
                                return (
                                    <View key={i} style={[s.chip, isShared && s.chipShared]}>
                                        {isShared && <Feather name="zap" size={10} color="#6366F1" style={{ marginRight: 4 }} />}
                                        <Text style={[s.chipText, isShared && s.chipTextShared]}>{tag}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Premium nudge */}
                {!isPremium && (
                    <TouchableOpacity onPress={() => navigation.navigate('Premium')} style={s.premiumCard} activeOpacity={0.88}>
                        <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.premiumGrad}>
                            <Text style={s.premiumText}>👑 Go Premium to see who viewed your profile and send unlimited requests</Text>
                            <Feather name="chevron-right" size={18} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* SEND MESSAGE REQUEST MODAL */}
            <Modal visible={showMessageModal} animationType="slide" transparent>
                <View style={s.overlayDark}>
                    <View style={s.msgSheet}>
                        <View style={s.sheetHandle} />
                        <View style={s.msgSheetHeader}>
                            {user.avatar ? (
                                <Image source={{ uri: user.avatar }} style={s.msgSheetAvatar} />
                            ) : (
                                <ModernPlaceholder name={user.name} size={48} style={{ borderRadius: 16 }} />
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={s.msgSheetName}>{user.name}</Text>
                                <Text style={s.msgSheetSub}>Message request · won't count as a chat until accepted</Text>
                            </View>
                        </View>

                        <View style={s.howItWorksCard}>
                            <Text style={s.howItWorksTitle}>How Message Requests Work</Text>
                            {[
                                { icon: 'send', text: 'You send a message request (free, no chat slot used)' },
                                { icon: 'check-circle', text: `${user.name} accepts → becomes your conversation` },
                                { icon: 'slash', text: 'If declined, no slot is used. No pressure.' },
                            ].map((s2, i) => (
                                <View key={i} style={s.howRow}>
                                    <View style={s.howIcon}><Feather name={s2.icon} size={14} color="#6366F1" /></View>
                                    <Text style={s.howText}>{s2.text}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity style={s.sendReqBtn} onPress={sendMessageRequest} activeOpacity={0.88}>
                            <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sendReqBtnGrad}>
                                <Feather name="send" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={s.sendReqBtnText}>Send Request to {user.name.split(' ')[0]}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.cancelBtn} onPress={() => setShowMessageModal(false)} activeOpacity={0.8}>
                            <Text style={s.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* REPORT MODAL */}
            <Modal visible={reportVisible} animationType="slide" transparent>
                <View style={s.overlayDark}>
                    <View style={s.msgSheet}>
                        <View style={s.sheetHandle} />
                        <Text style={[s.msgSheetName, { marginLeft: 4, marginBottom: 16 }]}>Report {user.name}</Text>
                        {['Fake profile', 'Inappropriate content', 'Spam', 'Harassment', 'Other'].map((reason, i) => (
                            <TouchableOpacity key={i} style={s.reportRow} activeOpacity={0.75} onPress={() => handleReport(reason)}>
                                <Text style={s.reportRowText}>{reason}</Text>
                                <Feather name="chevron-right" size={16} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={s.cancelBtn} onPress={() => setReportVisible(false)} activeOpacity={0.8}>
                            <Text style={s.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },

    floatingNav: { position: 'absolute', zIndex: 99, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
    floatingRight: { flexDirection: 'row', gap: 10 },
    floatingBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },

    // BANNER & AVATAR
    bannerContainer: { height: 260, backgroundColor: '#1E293B', width: '100%' },
    bannerImage: { width: '100%', height: '100%' },

    avatarProfileContainer: { alignItems: 'center', marginTop: -60, zIndex: 20 },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFF',
        backgroundColor: '#FFF',
        position: 'relative',
        ...Platform.select({
            web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.12)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
            }
        }),
        elevation: 8
    },
    mainAvatar: { width: '100%', height: '100%', borderRadius: 58 },
    fallbackAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 58,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    fallbackAvatarText: {
        fontSize: 32,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#6366F1'
    },
    onlineIndicator: { position: 'absolute', bottom: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: '#22C55E', borderWidth: 4, borderColor: '#FFF' },

    identityBox: { alignItems: 'center', paddingTop: 20, paddingBottom: 24, backgroundColor: '#FFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 8, elevation: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    nameText: { fontSize: 26, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    verifiedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
    premiumCrown: { fontSize: 18, marginLeft: 2 },
    usernameText: { fontSize: 15, color: '#6366F1', fontFamily: theme.typography.fontFamily.medium, marginBottom: 14 },
    locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    locationLabel: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.bold },

    matchCard: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(99, 102, 241, 0.15)' },
            default: {
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            }
        }),
        elevation: 3
    },
    matchGrad: { padding: 18, borderWidth: 1, borderColor: '#E0E7FF' },
    matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    matchLabel: { fontSize: 12, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold, textTransform: 'uppercase', letterSpacing: 1 },
    matchScore: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#1E1B4B' },
    matchBubbles: { flexDirection: 'row', gap: 6 },
    matchChip: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#EEF2FF' },
    matchChipText: { fontSize: 11, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
    matchTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    matchFill: { height: 8, borderRadius: 4 },

    ctaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    msgCta: { flex: 1, borderRadius: 18, overflow: 'hidden', elevation: 2 },
    msgCtaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    msgCtaText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    blockBtn: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    sentBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDE9FE', borderRadius: 18, paddingVertical: 16, borderWidth: 1.5, borderColor: '#DDD6FE' },
    sentBadgeText: { fontSize: 15, color: '#7C3AED', fontFamily: theme.typography.fontFamily.bold },

    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.05)' },
            default: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            }
        }),
        elevation: 2
    },
    cardTitle: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
    bioText: { fontSize: 15, color: '#334155', fontFamily: theme.typography.fontFamily.medium, lineHeight: 23 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    detailIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    detailLabel: { fontSize: 11, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginBottom: 1 },
    detailValue: { fontSize: 14, color: '#0F172A', fontFamily: theme.typography.fontFamily.bold },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    chipShared: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
    chipText: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium },
    chipTextShared: { color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },

    premiumCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 18, overflow: 'hidden' },
    premiumGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    premiumText: { flex: 1, fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#FFF', lineHeight: 20 },

    // MODALS
    overlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    msgSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
    msgSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    msgSheetAvatar: { width: 48, height: 48, borderRadius: 16 },
    msgSheetName: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    msgSheetSub: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    howItWorksCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, marginBottom: 16 },
    howItWorksTitle: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
    howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
    howIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    howText: { flex: 1, fontSize: 13, color: '#334155', fontFamily: theme.typography.fontFamily.medium, lineHeight: 20 },
    sendReqBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
    sendReqBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
    sendReqBtnText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    cancelBtn: { backgroundColor: '#F8FAFC', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    cancelBtnText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },
    reportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    reportRowText: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#334155' },
});
