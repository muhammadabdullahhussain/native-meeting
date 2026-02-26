import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    ScrollView, Modal, TextInput, Platform, StatusBar, Alert, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const LF_META = {
    'Coffee Chat': { emoji: '☕', bg: '#FEF9C3', text: '#854D0E' },
    'Collab Partner': { emoji: '🤝', bg: '#DCFCE7', text: '#166534' },
    'Networking': { emoji: '🌐', bg: '#DBEAFE', text: '#1E40AF' },
    'Mentorship': { emoji: '🎓', bg: '#EDE9FE', text: '#5B21B6' },
    'Friends': { emoji: '👋', bg: '#FCE7F3', text: '#9D174D' },
};

// Interest chip palette — 8 beautiful pastel pairs
const IC_BG = ['#DBEAFE', '#DCFCE7', '#FEF9C3', '#FCE7F3', '#EDE9FE', '#FFEDD5', '#CFFAFE', '#F0FDF4'];
const IC_TEXT = ['#1E40AF', '#166534', '#854D0E', '#9D174D', '#5B21B6', '#9A3412', '#155E75', '#14532D'];

const TABS = ['About', 'Interests', 'More'];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Profile({ navigation }) {
    const { user: authUser, updateUser: updateAuthUser } = useAuth();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top;

    const [activeTab, setActiveTab] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [activePhoto, setActivePhoto] = useState(0);
    const [editModal, setEditModal] = useState(false);
    const [shareModal, setShareModal] = useState(false);

    // Initialize derived state from Auth
    const [user, setUser] = useState({
        ...authUser,
        // Fallbacks for missing fields
        interests: authUser?.interests || [],
        lookingFor: authUser?.lookingFor || [],
        banner: authUser?.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200',
        conversations: 14,
        responseRate: 97,
        activeStatus: 'Today',
        availability: ['Weekdays', 'Evenings'],
        memberSince: 'Feb 2026',
    });

    const [form, setForm] = useState({});
    const openEdit = () => {
        setForm({
            name: user.name,
            username: user.username,
            city: user.city,
            bio: user.bio,
            jobTitle: user.jobTitle,
            company: user.company,
            avatar: user.avatar,
            banner: user.banner,
        });
        setEditModal(true);
    };

    const pickImage = async (type) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Permission needed', 'Please allow photo access to change your photos.', 'info');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: type === 'avatar' ? [1, 1] : [16, 9],
            quality: 0.6,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            try {
                setIsUploading(true);
                const localUri = result.assets[0].uri;

                // Real Upload to Cloudinary
                const uploadResult = await authService.uploadImage(localUri);

                if (uploadResult.success) {
                    const newUrl = uploadResult.url;

                    // 1. Update Backend
                    await authService.updateProfile({ [type]: newUrl });

                    // 2. Update Auth Context (Persistence)
                    await updateAuthUser({ [type]: newUrl });

                    // 3. Update Local State (Immediate UI)
                    setForm(f => ({ ...f, [type]: newUrl }));
                    setUser(u => ({ ...u, [type]: newUrl }));

                    showToast('Success', 'Photo updated successfully!', 'success');
                }
            } catch (error) {
                console.error('Upload failed:', error);
                showToast('Upload Failed', error.message || 'Could not upload image.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const saveEdit = async () => {
        try {
            setIsUploading(true);
            // 1. Update Backend
            await authService.updateProfile(form);

            // 2. Update Auth Context
            await updateAuthUser(form);

            // 3. Local State
            setUser(u => ({ ...u, ...form }));
            setEditModal(false);
            showToast('Success', 'Profile updated!', 'success');
        } catch (error) {
            showToast('Error', error.message || 'Could not save changes', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={s.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                bounces
                stickyHeaderIndices={[5]}
            >
                {/* BLOCK 0 — PREMIUM HERO */}
                <View style={s.hero}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200' }}
                        style={s.banner}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(10, 102, 194, 0.4)', 'transparent', 'rgba(255,255,255,1)']}
                        style={s.heroOverlay}
                    />

                    {/* Bridge Avatar with Edit Icon */}
                    <View style={s.avatarBridge}>
                        <View style={s.avatarOuterRing}>
                            <Image source={{ uri: user.avatar }} style={s.avatar} />
                            <TouchableOpacity
                                style={s.avatarEditIcon}
                                activeOpacity={0.8}
                                onPress={() => pickImage('avatar')}
                            >
                                <Feather name="camera" size={14} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Nav buttons — Top Right Glassmorphic */}
                    <View style={[s.coverNav, { position: 'absolute', top: Math.max(safeTop, 16), right: 16 }]}>
                        <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate('Settings')}>
                            <Feather name="settings" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.navBtn} onPress={() => setShareModal(true)}>
                            <Feather name="share-2" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* BLOCK 1 — IDENTITY */}
                <View style={s.identity}>
                    <View style={s.nameRow}>
                        <Text style={s.name}>{user.name}</Text>
                        {user.isPremium && <View style={s.crownBadge}><Text>👑</Text></View>}
                    </View>
                    <Text style={s.headline}>{user.jobTitle}{user.company ? ` · ${user.company}` : ''}</Text>
                    <View style={s.locationRow}>
                        <Feather name="map-pin" size={12} color="#94A3B8" />
                        <Text style={s.locationText}> {user.city}</Text>
                    </View>
                    <View style={s.statusRow}>
                        <View style={s.onlineDot} />
                        <Text style={s.statusText}>{user.activeStatus === 'Today' ? 'Active Today' : `Last active ${user.activeStatus}`}</Text>
                    </View>


                </View>

                {/* STATS */}
                <View style={s.statsRow}>
                    <Stat n={user.interests?.length || 0} label="Interests" color="#6366F1" />
                    <View style={s.statSep} />
                    <Stat n={`${user.conversations}/30`} label="Chats" color={user.conversations >= 26 ? '#F97316' : '#10B981'} />
                    <View style={s.statSep} />
                    <Stat n={`${user.responseRate}%`} label="Response" color="#0EA5E9" />
                </View>

                {/* CTA */}
                <View style={s.ctaRow}>
                    <TouchableOpacity style={s.editBtn} onPress={openEdit} activeOpacity={0.88}>
                        <LinearGradient colors={[theme.colors.primary, '#084B8A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.editBtnGrad}>
                            <Feather name="edit-2" size={16} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={s.editBtnText}>Edit Profile</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.shareSecondaryBtn} onPress={() => setShareModal(true)}>
                        <Feather name="share-2" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* PREMIUM */}
                {!user.isPremium && (
                    <TouchableOpacity onPress={() => navigation.navigate('Premium')} style={s.premiumBanner}>
                        <LinearGradient colors={['#0EA5E9', theme.colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.premiumBannerGrad}>
                            <Text style={s.premiumIcon}>💎</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={s.premiumTitle}>Premium Membership</Text>
                                <Text style={s.premiumSub}>Unlock all features · $3.99/mo</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* TABS */}
                <View style={s.tabBarWrap}>
                    <View style={s.tabBar}>
                        {TABS.map((tab, i) => (
                            <TouchableOpacity key={tab} style={[s.tabPill, activeTab === i && s.tabPillActive]} onPress={() => setActiveTab(i)}>
                                <Text style={[s.tabLabel, activeTab === i && s.tabLabelActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* TAB CONTENT */}
                <View style={s.tabContent}>
                    {activeTab === 0 && (
                        <View style={s.tabPane}>
                            <View style={s.card}><CardLabel label="About Me" icon="user" /><Text style={s.bioText}>{user.bio}</Text></View>
                            <View style={s.card}>
                                <CardLabel label="Looking For" icon="search" />
                                <View style={s.tagsWrap}>
                                    {(user.lookingFor || []).map(item => {
                                        const m = LF_META[item] || { emoji: '⚡', bg: '#F1F5F9', text: '#475569' };
                                        return (
                                            <View key={item} style={[s.lfTag, { backgroundColor: m.bg }]}>
                                                <Text style={s.lfTagEmoji}>{m.emoji}</Text>
                                                <Text style={[s.lfTagText, { color: m.text }]}>{item}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                            <View style={s.card}>
                                <CardLabel label="Details" icon="info" />
                                <InfoRow icon="briefcase" value={`${user.jobTitle}${user.company ? ` at ${user.company}` : ''}`} />
                                <InfoRow icon="map-pin" value={user.city} />
                                <InfoRow icon="clock" value={user.availability.join(' · ')} last />
                            </View>
                        </View>
                    )}

                    {activeTab === 1 && (
                        <View style={s.tabPane}>
                            <View style={s.interestTopRow}>
                                <Text style={s.interestCount}>{(user.interests || []).length} of 30 interests</Text>
                                <TouchableOpacity style={s.manageBtn} onPress={() => navigation.navigate('InterestManager')}>
                                    <Feather name="sliders" size={13} color="#6366F1" style={{ marginRight: 5 }} />
                                    <Text style={s.manageBtnText}>Manage</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={s.progressTrack}>
                                <LinearGradient colors={['#6366F1', '#A855F7']} style={[s.progressFill, { width: `${((user.interests || []).length / 30) * 100}%` }]} />
                            </View>
                            <View style={s.chipsGrid}>
                                {(user.interests || []).map((name, i) => (
                                    <View key={i} style={[s.chip, { backgroundColor: IC_BG[i % IC_BG.length] }]}>
                                        <Text style={[s.chipText, { color: IC_TEXT[i % IC_TEXT.length] }]}>{name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {activeTab === 2 && (
                        <View style={s.tabPane}>
                            <View style={s.card}>
                                <CardLabel label="Conversations" icon="message-circle" />
                                <View style={s.meterRow}>
                                    <Text style={s.meterBig}>{user.conversations}</Text>
                                    <Text style={s.meterOf}>/30</Text>
                                    <View style={{ flex: 1 }} /><Text style={s.meterRemain}>{30 - user.conversations} left</Text>
                                </View>
                                <View style={s.meterTrack}><View style={[s.meterFill, { width: `${(user.conversations / 30) * 100}%`, backgroundColor: user.conversations >= 26 ? '#F97316' : '#10B981' }]} /></View>
                                {!user.isPremium && <TouchableOpacity onPress={() => navigation.navigate('Premium')}><Text style={s.meterUpgrade}>Unlock unlimited with Premium →</Text></TouchableOpacity>}
                            </View>
                            <View style={s.card}>
                                <CardLabel label="Share Profile" icon="share-2" />
                                <View style={s.qrBox}>
                                    <LinearGradient colors={['#EEF2FF', '#EDE9FE']} style={s.qrInner}>
                                        <Feather name="link-2" size={32} color="#6366F1" />
                                        <Text style={s.qrUrl}>interesta.app/{user.username}</Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* ══════════════════════════════════════════════
                EDIT MODAL
            ══════════════════════════════════════════════ */}
            < Modal visible={editModal} animationType="slide" transparent >
                <View style={s.overlay}>
                    <View style={s.sheet}>
                        <View style={s.sheetHandle} />
                        <View style={s.sheetHeader}>
                            <Text style={s.sheetTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setEditModal(false)}>
                                <Feather name="x" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                            {/* ── PHOTO PICKERS ── */}
                            <View style={s.editPhotosSection}>
                                <Text style={s.eLabel}>Profile Imagery</Text>

                                {/* Banner Picker */}
                                <TouchableOpacity style={s.bannerPicker} onPress={() => pickImage('banner')} activeOpacity={0.8}>
                                    <Image source={{ uri: form.banner }} style={s.bannerPickerImg} />
                                    <View style={s.pickerOverlay}>
                                        <Feather name="camera" size={20} color="#FFF" />
                                        <Text style={s.pickerText}>Change Cover</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Avatar Picker */}
                                <View style={s.avatarPickerRow}>
                                    <TouchableOpacity style={s.avPicker} onPress={() => pickImage('avatar')} activeOpacity={0.8}>
                                        <Image source={{ uri: form.avatar }} style={s.avPickerImg} />
                                        <View style={s.avPickerOverlay}>
                                            <Feather name="edit-2" size={14} color="#FFF" />
                                        </View>
                                    </TouchableOpacity>
                                    <View style={s.avPickerInfo}>
                                        <Text style={s.avPickerTitle}>Profile Photo</Text>
                                        <Text style={s.avPickerSub}>Professional & clear photos perform best.</Text>
                                    </View>
                                </View>
                            </View>

                            <EField label="Full Name" icon="user" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                            <EField label="Username" icon="at-sign" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} lower />
                            <EField label="Job Title" icon="briefcase" value={form.jobTitle} onChange={v => setForm(f => ({ ...f, jobTitle: v }))} />
                            <EField label="City" icon="map-pin" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
                            <EField label="Bio" icon="edit-3" value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} multi />
                        </ScrollView>
                        <TouchableOpacity style={s.sheetSave} onPress={saveEdit} activeOpacity={0.88}>
                            <LinearGradient
                                colors={['#6366F1', '#7C3AED']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={s.sheetSaveGrad}
                            >
                                <Text style={s.sheetSaveText}>Save Changes</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal >

            {/* ══════════════════════════════════════════════
                SHARE MODAL
            ══════════════════════════════════════════════ */}
            < Modal visible={shareModal} animationType="slide" transparent statusBarTranslucent >
                <View style={s.overlay}>
                    <View style={[s.sheet, { paddingBottom: 36 }]}>
                        <View style={s.sheetHandle} />

                        {/* Header */}
                        <View style={s.sheetHeader}>
                            <Text style={s.sheetTitle}>Share Profile</Text>
                            <TouchableOpacity onPress={() => setShareModal(false)}>
                                <Feather name="x" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Profile preview card */}
                        <View style={s.sharePreviewCard}>
                            <LinearGradient
                                colors={['#0EA5E9', '#6366F1', '#7C3AED']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={s.sharePreviewGrad}
                            >
                                <Image source={{ uri: user.avatar }} style={s.sharePreviewAvatar} />
                                <View style={s.sharePreviewInfo}>
                                    <Text style={s.sharePreviewName}>{user.name}</Text>
                                    <Text style={s.sharePreviewJob}>{user.jobTitle}</Text>
                                    <View style={s.sharePreviewInterests}>
                                        {user.interests.slice(0, 3).map((t, i) => (
                                            <View key={i} style={s.sharePreviewChip}>
                                                <Text style={s.sharePreviewChipText}>{t}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Link row */}
                        <View style={s.shareLinkRow}>
                            <View style={s.shareLinkIcon}>
                                <Feather name="link-2" size={16} color="#6366F1" />
                            </View>
                            <Text style={s.shareLinkText} numberOfLines={1}>
                                interesta.app/{user.username}
                            </Text>
                            <TouchableOpacity
                                style={s.shareLinkCopyBtn}
                                onPress={() => {
                                    /* Clipboard.setString(...) */
                                    showToast('Copied! ✅', 'Link copied to clipboard', 'success');
                                }}
                            >
                                <Feather name="copy" size={15} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Share options grid */}
                        <Text style={s.shareViaLabel}>Share via</Text>
                        <View style={s.shareGridRow}>
                            {[
                                { icon: 'message-circle', label: 'WhatsApp', color: '#25D366', bg: '#F0FDF4' },
                                { icon: 'twitter', label: 'Twitter', color: '#1DA1F2', bg: '#EFF9FF' },
                                { icon: 'linkedin', label: 'LinkedIn', color: '#0A66C2', bg: '#EFF6FF' },
                                { icon: 'mail', label: 'Email', color: '#6366F1', bg: '#EEF2FF' },
                                { icon: 'instagram', label: 'Instagram', color: '#E1306C', bg: '#FFF0F4' },
                                { icon: 'more-horizontal', label: 'More', color: '#64748B', bg: '#F8FAFC' },
                            ].map(opt => (
                                <TouchableOpacity
                                    key={opt.label}
                                    style={s.shareGridItem}
                                    onPress={() => showToast(opt.label, `Share via ${opt.label} — coming soon!`, 'info')}
                                    activeOpacity={0.75}
                                >
                                    <View style={[s.shareGridIcon, { backgroundColor: opt.bg }]}>
                                        <Feather name={opt.icon} size={22} color={opt.color} />
                                    </View>
                                    <Text style={s.shareGridLabel}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal >
        </View >
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────────────────────
function Stat({ n, label, color }) {
    return (
        <View style={s.statItem}>
            <Text style={[s.statN, { color: color || theme.colors.text }]}>{n}</Text>
            <Text style={s.statLabel}>{label}</Text>
        </View>
    );
}

function CardLabel({ label, icon }) {
    return (
        <View style={s.cardLabelRow}>
            <Feather name={icon} size={14} color={theme.colors.primary} style={{ marginRight: 7 }} />
            <Text style={s.cardLabel}>{label}</Text>
        </View>
    );
}

function InfoRow({ icon, value, last }) {
    return (
        <View style={[s.infoRow, !last && s.infoRowBorder]}>
            <View style={s.infoIconBox}>
                <Feather name={icon} size={14} color="#6366F1" />
            </View>
            <Text style={s.infoValue} numberOfLines={2}>{value}</Text>
        </View>
    );
}

function EField({ label, icon, value, onChange, multi, lower }) {
    return (
        <View style={s.eField}>
            <Text style={s.eLabel}>{label}</Text>
            <View style={[s.eRow, multi && { height: 90, alignItems: 'flex-start', paddingTop: 14 }]}>
                <Feather name={icon} size={15} color="#94A3B8" style={{ marginRight: 10 }} />
                <TextInput
                    style={[s.eInput, multi && { textAlignVertical: 'top' }]}
                    value={value}
                    onChangeText={onChange}
                    multiline={multi}
                    autoCapitalize={lower ? 'none' : 'sentences'}
                    placeholderTextColor="#CBD5E1"
                />
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },

    // HERO
    hero: { height: 300, backgroundColor: '#FFF', marginBottom: 20 },
    banner: { width: '100%', height: 260 },
    heroOverlay: { ...StyleSheet.absoluteFillObject },
    coverNav: { flexDirection: 'row', gap: 12 },
    navBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },

    // AVATAR BRIDGE
    avatarBridge: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
    avatarOuterRing: {
        width: 124, height: 124, borderRadius: 62, backgroundColor: '#FFF',
        padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 15,
        position: 'relative',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 58 },
    avatarEditIcon: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },

    // IDENTITY
    identity: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    name: { fontSize: 28, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    crownBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
    headline: { fontSize: 15, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, marginBottom: 8, textAlign: 'center' },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    locationText: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    statusRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
    onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E', marginRight: 6 },
    statusText: { fontSize: 11, color: '#166534', fontFamily: theme.typography.fontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.4 },

    // STATS
    statsRow: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    statItem: { flex: 1, alignItems: 'center' },
    statN: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, marginBottom: 2 },
    statLabel: { fontSize: 10, color: '#94A3B8', fontFamily: theme.typography.fontFamily.bold, textTransform: 'uppercase', letterSpacing: 1 },
    statSep: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

    // BUTTONS
    ctaRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
    editBtn: { flex: 1, borderRadius: 16, overflow: 'hidden', ...theme.shadows.medium },
    editBtnGrad: { flexDirection: 'row', height: 56, alignItems: 'center', justifyContent: 'center' },
    editBtnText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', letterSpacing: 0.3 },
    shareSecondaryBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EDF5FD', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D1E4F8' },

    // PREMIUM BANNER
    premiumBanner: { marginHorizontal: 24, borderRadius: 22, overflow: 'hidden', marginBottom: 16, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
    premiumBannerGrad: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
    premiumIcon: { fontSize: 32 },
    premiumTitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 2 },
    premiumSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: theme.typography.fontFamily.medium },

    // TAB BAR
    tabBarWrap: { backgroundColor: '#F8FAFC', paddingHorizontal: 24, paddingVertical: 12 },
    tabBar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 4 },
    tabPill: { flex: 1, paddingVertical: 11, borderRadius: 13, alignItems: 'center' },
    tabPillActive: { backgroundColor: '#6366F1', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    tabLabel: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#64748B' },
    tabLabelActive: { color: '#FFF', fontFamily: theme.typography.fontFamily.bold },

    // TAB CONTENT
    tabContent: { paddingHorizontal: 24 },
    tabPane: { paddingTop: 8 },

    // CARD
    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
    cardLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    cardLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1 },

    // BIO
    bioText: { fontSize: 16, color: '#334155', fontFamily: theme.typography.fontFamily.medium, lineHeight: 26 },

    // LOOKING FOR
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    lfTag: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
    lfTagEmoji: { fontSize: 16 },
    lfTagText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold },

    // INFO ROWS
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    infoIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    infoValue: { flex: 1, fontSize: 15, color: '#334155', fontFamily: theme.typography.fontFamily.medium },

    // INTERESTS
    interestTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
    interestCount: { fontSize: 14, color: '#64748B', fontFamily: theme.typography.fontFamily.medium },
    manageBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    manageBtnText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1' },
    progressTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },
    chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
    chipText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold },

    // METER
    meterRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
    meterBig: { fontSize: 36, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    meterOf: { fontSize: 20, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginLeft: 2 },
    meterRemain: { fontSize: 14, color: '#64748B', fontFamily: theme.typography.fontFamily.medium },
    meterTrack: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', marginBottom: 14 },
    meterFill: { height: 10, borderRadius: 5 },
    meterUpgrade: { fontSize: 14, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold, textAlign: 'center' },

    // QR / SHARE
    qrBox: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
    qrInner: { alignItems: 'center', paddingVertical: 28 },
    qrUrl: { fontSize: 14, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold, marginTop: 10 },

    // MODAL
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: 32, maxHeight: '92%' },
    sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
    sheetTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },

    // PHOTOS EDIT
    editPhotosSection: { marginBottom: 24 },
    bannerPicker: { width: '100%', height: 140, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: 16 },
    bannerPickerImg: { width: '100%', height: '100%' },
    pickerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', gap: 6 },
    pickerText: { color: '#FFF', fontSize: 13, fontFamily: theme.typography.fontFamily.bold },

    avatarPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avPicker: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative' },
    avPickerImg: { width: '100%', height: '100%' },
    avPickerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    avPickerInfo: { flex: 1 },
    avPickerTitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    avPickerSub: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },

    eField: { marginBottom: 18 },
    eLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    eRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 16, height: 56 },
    eInput: { flex: 1, fontSize: 16, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium },
    sheetSave: { borderRadius: 18, overflow: 'hidden', marginTop: 10 },
    sheetSaveGrad: { height: 58, justifyContent: 'center', alignItems: 'center' },
    sheetSaveText: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    // SHARE MODAL
    sharePreviewCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
    sharePreviewGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    sharePreviewAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
    sharePreviewInfo: { flex: 1 },
    sharePreviewName: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 2 },
    sharePreviewJob: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: theme.typography.fontFamily.medium, marginBottom: 10 },
    sharePreviewInterests: { flexDirection: 'row', gap: 8 },
    sharePreviewChip: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    sharePreviewChipText: { fontSize: 11, color: '#FFF', fontFamily: theme.typography.fontFamily.bold },

    shareLinkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', paddingLeft: 16, paddingRight: 8, paddingVertical: 8, gap: 12, marginBottom: 24 },
    shareLinkIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    shareLinkText: { flex: 1, fontSize: 14, color: '#334155', fontFamily: theme.typography.fontFamily.medium },
    shareLinkCopyBtn: { backgroundColor: '#6366F1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },

    shareViaLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18 },
    shareGridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' },
    shareGridItem: { width: '30%', alignItems: 'center', gap: 8 },
    shareGridIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    shareGridLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#64748B', textAlign: 'center' },
});
