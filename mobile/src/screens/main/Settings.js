import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Switch, TouchableOpacity,
    ScrollView, Alert, Platform, StatusBar, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import * as Haptics from 'expo-haptics';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// ─── Settings groups ───────────────────────────────────────────────────────────
const ACCOUNT_ROWS = [
    { icon: 'user', label: 'Edit Profile', screen: 'MainApp', params: { screen: 'Profile' }, color: '#6366F1', bg: '#EEF2FF' },
    { icon: 'at-sign', label: 'Change Username', screen: null, color: '#0EA5E9', bg: '#EFF9FF' },
    { icon: 'lock', label: 'Change Password', screen: 'ForgotPassword', color: '#7C3AED', bg: '#EDE9FE' },
    { icon: 'mail', label: 'Update Email', screen: null, color: '#10B981', bg: '#DCFCE7' },
];

const DISCOVERY_ROWS = [
    { icon: 'map-pin', label: 'Location', value: 'San Francisco, CA', color: '#F97316', bg: '#FFEDD5' },
    { icon: 'users', label: 'Show me to others', toggle: true, key: 'visible', color: '#6366F1', bg: '#EEF2FF' },
    { icon: 'eye-off', label: 'Blur Location', toggle: true, key: 'blurLocation', color: '#8B5CF6', bg: '#F5F3FF' },
    { icon: 'eye', label: 'Profile Visibility', value: 'Everyone', color: '#0EA5E9', bg: '#EFF9FF' },
    { icon: 'radio', label: 'Max Distance', value: '25 km', color: '#22C55E', bg: '#DCFCE7' },
];

const NOTIFICATION_ROWS = [
    { icon: 'bell', label: 'Push Notifications', toggle: true, key: 'push', color: '#6366F1', bg: '#EEF2FF' },
    { icon: 'mail', label: 'Email Notifications', toggle: true, key: 'email', color: '#0EA5E9', bg: '#EFF9FF' },
    { icon: 'message-circle', label: 'New Message Alerts', toggle: true, key: 'msg', color: '#22C55E', bg: '#DCFCE7' },
    { icon: 'user-plus', label: 'New Connection Alerts', toggle: true, key: 'conn', color: '#F97316', bg: '#FFEDD5' },
];

const SUPPORT_ROWS = [
    { icon: 'shield', label: 'Safety Center', screen: 'SafetyCenter', color: '#6366F1', bg: '#EEF2FF' },
    { icon: 'check-circle', label: 'Get Verified', action: 'verify', color: '#3B82F6', bg: '#EFF6FF' },
    { icon: 'help-circle', label: 'Help & FAQ', color: '#64748B', bg: '#F1F5F9' },
    { icon: 'file-text', label: 'Terms of Service', color: '#64748B', bg: '#F1F5F9' },
    { icon: 'shield', label: 'Privacy Policy', color: '#64748B', bg: '#F1F5F9' },
    { icon: 'star', label: 'Rate the App', color: '#F59E0B', bg: '#FEF3C7' },
];

export default function Settings({ navigation }) {
    const insets = useSafeAreaInsets();
    const { showToast, confirmAction } = useToast();
    const { user: authUser, logout } = useAuth();

    const [toggles, setToggles] = useState({
        visible: true,
        blurLocation: false,
        push: true,
        email: false,
        msg: true,
        conn: true,
        gps: true,
    });

    const toggle = (key) => setToggles(t => ({ ...t, [key]: !t[key] }));

    const handleLogout = () => {
        confirmAction({
            title: 'Log Out',
            message: 'Are you sure you want to log out of your Weezy account?',
            confirmText: 'Log Out',
            confirmStyle: 'destructive',
            onConfirm: () => logout(),
        });
    };

    const handleDelete = () => {
        confirmAction({
            title: 'Delete Account',
            message: 'This action is irreversible. All your chats, interests, and profile data will be permanently deleted.',
            confirmText: 'Delete Forever',
            confirmStyle: 'destructive',
            onConfirm: () => showToast('Cleanup Initiated', 'Your account is being queued for deletion.', 'info'),
        });
    };

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[s.header, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={s.headerNav}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Settings</Text>
                    <View style={{ width: 38 }} />
                </View>

                {/* Profile preview in header */}
                <View style={s.profilePreview}>
                    <Image source={{ uri: authUser?.avatar || 'https://i.pravatar.cc/150?img=5' }} style={s.profileAvatar} />
                    <View style={s.profileInfo}>
                        <Text style={s.profileName}>{authUser?.name || 'User'}</Text>
                        <Text style={s.profileSub}>{authUser?.username || authUser?.email} · {authUser?.city || 'Globe'}</Text>
                    </View>
                    <TouchableOpacity
                        style={s.profileEditBtn}
                        onPress={() => navigation.navigate('MainApp', { screen: 'Profile' })}
                    >
                        <Text style={s.profileEditText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* PREMIUM BANNER */}
                {!authUser?.isPremium && (
                    <TouchableOpacity
                        style={s.premiumBanner}
                        onPress={() => navigation.navigate('Premium')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.premiumBannerGrad}>
                            <Text style={s.premiumEmoji}>👑</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={s.premiumTitle}>Upgrade to Premium</Text>
                                <Text style={s.premiumSub}>Unlimited interests · Group chats · $3.99/mo</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* REFERRAL SYSTEM */}
                <SectionLabel label="Viral Growth" />
                <View style={s.referralCard}>
                    <View style={s.referralHeader}>
                        <View style={s.referralIcon}>
                            <Feather name="share-2" size={20} color="#6366F1" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.referralTitle}>Invite 3 Friends</Text>
                            <Text style={s.referralSub}>Unlock custom Interest Tags & extra Group slots</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={s.codeBox}
                        activeOpacity={0.7}
                        onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            showToast('Copied! 🔗', 'Share your referral code with friends.', 'success');
                        }}
                    >
                        <Text style={s.codeLabel}>YOUR REFERRAL CODE</Text>
                        <View style={s.codeRow}>
                            <Text style={s.codeValue}>{authUser?.referralCode || 'ABCDEF'}</Text>
                            <Feather name="copy" size={16} color="#6366F1" />
                        </View>
                    </TouchableOpacity>

                    <View style={s.progressRow}>
                        <Text style={s.progressLabel}>Milestone 1</Text>
                        <Text style={s.progressCount}>{authUser?.referralCount || 0}/3 Joined</Text>
                    </View>
                    <View style={s.progressBarTrack}>
                        <View style={[s.progressBarFill, { width: `${Math.min(100, ((authUser?.referralCount || 0) / 3) * 100)}%` }]} />
                    </View>

                    {authUser?.referralCount >= 3 ? (
                        <View style={s.rewardUnlocked}>
                            <Feather name="check-circle" size={14} color="#10B981" />
                            <Text style={s.rewardText}>Milestone Unlocked! Custom Tags Enabled</Text>
                        </View>
                    ) : (
                        <Text style={s.footerNote}>Invite 3 active members to unlock rewards.</Text>
                    )}
                </View>

                {/* ACCOUNT */}
                <SectionLabel label="Account" />
                <View style={s.card}>
                    {ACCOUNT_ROWS.map((row, i) => (
                        <React.Fragment key={row.label}>
                            <SettingRow
                                icon={row.icon}
                                label={row.label}
                                iconColor={row.color}
                                iconBg={row.bg}
                                onPress={() => row.screen ? navigation.navigate(row.screen, row.params) : {}}
                            />
                            {i < ACCOUNT_ROWS.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </View>

                {/* SUPPORT & LEGAL */}
                <SectionLabel label="Support & Legal" />
                <View style={s.card}>
                    {SUPPORT_ROWS.map((row, i) => (
                        <React.Fragment key={row.label}>
                            <SettingRow
                                icon={row.icon}
                                label={row.label}
                                iconColor={row.color}
                                iconBg={row.bg}
                                onPress={() => {
                                    if (row.screen) navigation.navigate(row.screen);
                                    else if (row.action === 'verify') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        confirmAction({
                                            title: 'Get Verified ✅',
                                            message: 'Please upload a photo of your ID or a social link to get verified.',
                                            confirmText: 'Upload',
                                            onConfirm: () => showToast('Submitted', 'We are reviewing it.', 'success')
                                        });
                                    } else {
                                        showToast('Coming Soon', 'This feature is arriving shortly!', 'info');
                                    }
                                }}
                            />
                            {i < SUPPORT_ROWS.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </View>

                {/* DANGER ZONE */}
                <SectionLabel label="Account Actions" />
                <View style={s.card}>
                    <TouchableOpacity style={s.dangerRow} onPress={handleLogout} activeOpacity={0.75}>
                        <View style={[s.rowIconBox, { backgroundColor: '#FEF2F2' }]}>
                            <Feather name="log-out" size={16} color="#EF4444" />
                        </View>
                        <Text style={[s.dangerLabel, { color: '#EF4444' }]}>Log Out</Text>
                        <Feather name="chevron-right" size={18} color="#EF4444" />
                    </TouchableOpacity>
                    <Divider />
                    <TouchableOpacity style={s.dangerRow} onPress={handleDelete} activeOpacity={0.75}>
                        <View style={[s.rowIconBox, { backgroundColor: '#FEF2F2' }]}>
                            <Feather name="trash-2" size={16} color="#DC2626" />
                        </View>
                        <Text style={[s.dangerLabel, { color: '#DC2626' }]}>Delete Account</Text>
                        <Feather name="chevron-right" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>

                <Text style={s.version}>Interesta v1.0.0 · Made with ❤️</Text>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────
function SectionLabel({ label }) {
    return <Text style={s.sectionLabel}>{label}</Text>;
}

function Divider() {
    return <View style={s.divider} />;
}

function SettingRow({ icon, label, sub, iconColor, iconBg, right, onPress }) {
    return (
        <TouchableOpacity
            style={s.row}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress && !right}
        >
            <View style={[s.rowIconBox, { backgroundColor: iconBg || '#F1F5F9' }]}>
                <Feather name={icon} size={16} color={iconColor || '#64748B'} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{label}</Text>
                {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
            </View>
            {right || (onPress ? <Feather name="chevron-right" size={17} color="#CBD5E1" /> : null)}
        </TouchableOpacity>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },

    // HEADER
    header: { paddingHorizontal: 20, paddingBottom: 24 },
    headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    profilePreview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    profileAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 2 },
    profileSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: theme.typography.fontFamily.medium },
    profileEditBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
    profileEditText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    scroll: { paddingHorizontal: 20, paddingTop: 16 },

    // PREMIUM
    premiumBanner: { borderRadius: 18, overflow: 'hidden', marginBottom: 20, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    premiumBannerGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    premiumEmoji: { fontSize: 26 },
    premiumTitle: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 2 },
    premiumSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: theme.typography.fontFamily.medium },

    // SECTION
    sectionLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    divider: { height: 1, backgroundColor: '#F8FAFC', marginLeft: 60 },

    // ROWS
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
    rowIconBox: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    rowLabel: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#0F172A' },
    rowSub: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginTop: 1 },
    dangerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
    dangerLabel: { flex: 1, fontSize: 15, fontFamily: theme.typography.fontFamily.bold },

    version: { fontSize: 12, color: '#CBD5E1', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', marginTop: 8 },

    // REFERRAL CARD
    referralCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#EEF2FF', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    referralHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 },
    referralIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    referralTitle: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    referralSub: { fontSize: 12, color: '#64748B', fontFamily: theme.typography.fontFamily.medium },
    codeBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', marginBottom: 16 },
    codeLabel: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
    codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    codeValue: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1', letterSpacing: 2 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    progressCount: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1' },
    progressBarTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 12 },
    progressBarFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 3 },
    rewardUnlocked: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', padding: 8, borderRadius: 8 },
    rewardText: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: '#059669' },
    footerNote: { fontSize: 11, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic' },
});
