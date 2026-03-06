import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Switch, Alert, Platform, StatusBar,
    Image, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ModernPlaceholder } from '../../components/common/ModernPlaceholder';
import { authService } from '../../api/authService';
import DeleteAccountModal from '../../components/modals/DeleteAccountModal';
import { useTranslation } from 'react-i18next';

// ─── Distance Slider (simple range via +/- buttons) ────────────────────────
function DistanceControl({ value, onChange }) {
    return (
        <View style={s.sliderRow}>
            <TouchableOpacity
                style={s.sliderBtn}
                onPress={() => onChange(Math.max(5, value - 5))}
                activeOpacity={0.7}
            >
                <Feather name="minus" size={16} color="#6366F1" />
            </TouchableOpacity>
            <View style={s.sliderValueBox}>
                <Text style={s.sliderValue}>{value} km</Text>
            </View>
            <TouchableOpacity
                style={s.sliderBtn}
                onPress={() => onChange(Math.min(100, value + 5))}
                activeOpacity={0.7}
            >
                <Feather name="plus" size={16} color="#6366F1" />
            </TouchableOpacity>
        </View>
    );
}

// ─── Change Password Modal ─────────────────────────────────────────────────
function PasswordModal({ visible, onClose, showToast }) {
    const { t } = useTranslation();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);

    const reset = () => { setCurrent(''); setNext(''); setConfirm(''); };

    const handleSubmit = async () => {
        if (!current || !next || !confirm) {
            showToast('Missing fields', 'Please fill all fields', 'error');
            return;
        }
        if (next !== confirm) {
            showToast('Mismatch', 'New passwords do not match', 'error');
            return;
        }
        if (next.length < 6) {
            showToast('Too short', 'Password must be at least 6 characters', 'error');
            return;
        }
        try {
            setLoading(true);
            await authService.changePassword(current, next);
            showToast('✅ Done', 'Password changed successfully', 'success');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            reset();
            onClose();
        } catch (err) {
            showToast('Error', err.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
            <View style={s.modalOverlay}>
                <View style={s.modalSheet}>
                    <View style={s.modalHeader}>
                        <Text style={s.modalTitle}>{t('settings.pass_modal_title')}</Text>
                        <TouchableOpacity onPress={() => { reset(); onClose(); }}>
                            <Feather name="x" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>{t('settings.current_pass')}</Text>
                        <View style={s.inputRow}>
                            <TextInput
                                style={s.input}
                                value={current}
                                onChangeText={setCurrent}
                                secureTextEntry={!showCurrent}
                                placeholder={t('settings.pass_placeholder')}
                                placeholderTextColor="#CBD5E1"
                            />
                            <TouchableOpacity onPress={() => setShowCurrent(v => !v)}>
                                <Feather name={showCurrent ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>{t('settings.new_pass')}</Text>
                        <View style={s.inputRow}>
                            <TextInput
                                style={s.input}
                                value={next}
                                onChangeText={setNext}
                                secureTextEntry={!showNext}
                                placeholder={t('settings.pass_min_chars')}
                                placeholderTextColor="#CBD5E1"
                            />
                            <TouchableOpacity onPress={() => setShowNext(v => !v)}>
                                <Feather name={showNext ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>{t('settings.confirm_pass')}</Text>
                        <View style={s.inputRow}>
                            <TextInput
                                style={s.input}
                                value={confirm}
                                onChangeText={setConfirm}
                                secureTextEntry
                                placeholder={t('settings.pass_repeat')}
                                placeholderTextColor="#CBD5E1"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={s.primaryBtn}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={s.primaryBtnText}>{t('settings.save_password')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Settings({ navigation }) {
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const { showToast } = useToast();
    const { user: authUser, logout, updateUser } = useAuth();

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Discovery prefs (from user.settings)
    const [maxDistance, setMaxDistance] = useState(authUser?.settings?.discovery?.maxDistance || 25);
    const [showMe, setShowMe] = useState(authUser?.settings?.discovery?.showMe ?? true);
    const [blurLocation, setBlurLocation] = useState(authUser?.settings?.discovery?.blurLocation ?? false);

    // Notification prefs
    const [pushEnabled, setPushEnabled] = useState(authUser?.settings?.notifications?.push ?? true);
    const [emailEnabled, setEmailEnabled] = useState(authUser?.settings?.notifications?.email ?? false);
    const [msgEnabled, setMsgEnabled] = useState(authUser?.settings?.notifications?.messages ?? true);
    const [connEnabled, setConnEnabled] = useState(authUser?.settings?.notifications?.connections ?? true);

    // Privacy prefs
    const [showOnlineStatus, setShowOnlineStatus] = useState(authUser?.settings?.privacy?.showOnlineStatus ?? true);

    // Debounced settings sync
    const saveSettings = useCallback(async (discovery, notifications, privacy) => {
        try {
            setIsSavingSettings(true);
            const response = await authService.updateSettings({ discovery, notifications, privacy });
            if (response.success && response.data?.settings) {
                // Sync to global AuthContext
                updateUser({ settings: response.data.settings });
            }
        } catch (err) {
            showToast('Sync Failed', 'Could not save preference', 'error');
        } finally {
            setIsSavingSettings(false);
        }
    }, [updateUser]);

    const handleDiscoveryToggle = (field, value) => {
        const newDiscovery = {
            maxDistance,
            showMe,
            blurLocation,
            [field]: value,
        };
        saveSettings(newDiscovery, null, null);
    };

    const handleNotifToggle = (field, value) => {
        saveSettings(null, { [field]: value }, null);
    };

    const handlePrivacyToggle = (field, value) => {
        saveSettings(null, null, { [field]: value });
    };

    const handleDistanceChange = (val) => {
        setMaxDistance(val);
        saveSettings({ maxDistance: val }, null, null);
    };

    const handleLogout = () => {
        Alert.alert(t('settings.logout_title', 'Log Out'), t('settings.logout_confirm', 'Are you sure you want to log out?'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.logout_btn', 'Log Out'), style: 'destructive', onPress: () => logout() }
        ]);
    };

    const changeLanguage = async (code) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await i18n.changeLanguage(code);
        setShowLanguageModal(false);
        showToast('Success', 'Language updated!', 'success');
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await authService.deleteMe();
            logout();
        } catch (err) {
            showToast('Error', err.message || 'Failed to delete account', 'error');
        }
    };

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* GRADIENT HEADER */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[s.header, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={s.headerNav}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{t('settings.title')}</Text>
                    {isSavingSettings ? (
                        <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" />
                    ) : (
                        <View style={{ width: 30 }} />
                    )}
                </View>

                {/* Profile preview */}
                <View style={s.profilePreview}>
                    {authUser?.avatar ? (
                        <Image source={{ uri: authUser.avatar }} style={s.profileAvatar} />
                    ) : (
                        <ModernPlaceholder name={authUser?.name} size={50} style={s.profileAvatar} />
                    )}
                    <View style={s.profileInfo}>
                        <Text style={s.profileName}>{authUser?.name || t('settings.anonymous_user')}</Text>
                        <Text style={s.profileSub}>
                            {authUser?.username ? `@${authUser.username}` : authUser?.email} · {authUser?.city || t('settings.no_city')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={s.profileEditBtn}
                        onPress={() => navigation.navigate('MainApp', { screen: 'Profile', params: { edit: true } })}
                    >
                        <Feather name="edit-2" size={18} color="#FFF" />
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
                                <Text style={s.premiumTitle}>{t('settings.upgrade_premium')}</Text>
                                <Text style={s.premiumSub}>{t('settings.premium_sub')}</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                <SectionLabel label={t('settings.discovery_prefs')} />
                <View style={s.card}>
                    <View style={s.settingBlock}>
                        <View style={s.settingBlockHeader}>
                            <View style={[s.rowIconBox, { backgroundColor: '#DCFCE7' }]}>
                                <Feather name="radio" size={16} color="#15803D" />
                            </View>
                            <Text style={s.rowLabel}>{t('settings.max_distance')}</Text>
                        </View>
                        <DistanceControl value={maxDistance} onChange={handleDistanceChange} />
                    </View>
                    <Divider />
                    <ToggleRow
                        icon="users"
                        iconBg="#EEF2FF"
                        iconColor="#6366F1"
                        label={t('settings.show_me')}
                        sub={t('settings.show_me_sub')}
                        value={showMe}
                        onValueChange={(val) => {
                            setShowMe(val);
                            handleDiscoveryToggle('showMe', val);
                        }}
                    />
                    <Divider />
                    <ToggleRow
                        icon="eye-off"
                        iconBg="#F5F3FF"
                        iconColor="#7C3AED"
                        label={t('settings.blur_location')}
                        sub={t('settings.blur_location_sub')}
                        value={blurLocation}
                        onValueChange={(val) => {
                            setBlurLocation(val);
                            handleDiscoveryToggle('blurLocation', val);
                        }}
                    />
                </View>

                <SectionLabel label={t('settings.privacy_visibility')} />
                <View style={s.card}>
                    <ToggleRow
                        icon="activity"
                        iconBg="#F0FDF4"
                        iconColor="#22C55E"
                        label={t('settings.show_online')}
                        sub={t('settings.show_online_sub')}
                        value={showOnlineStatus}
                        onValueChange={(val) => {
                            setShowOnlineStatus(val);
                            handlePrivacyToggle('showOnlineStatus', val);
                        }}
                    />
                </View>

                <SectionLabel label={t('settings.app_settings')} />
                <View style={s.card}>
                    <SettingRow
                        icon="globe"
                        iconBg="#F0F9FF"
                        iconColor="#0EA5E9"
                        label={t('settings.app_language')}
                        sub={
                            [
                                { code: 'en', label: 'English' },
                                { code: 'ur', label: 'Urdu (اردو)' },
                                { code: 'hi', label: 'Hindi (हिन्दी)' },
                                { code: 'es', label: 'Spanish (Español)' },
                                { code: 'fr', label: 'French (Français)' },
                                { code: 'ar', label: 'Arabic (العربية)' },
                                { code: 'zh', label: 'Chinese (中文)' },
                                { code: 'ru', label: 'Russian (Русский)' },
                                { code: 'pt', label: 'Portuguese (Português)' },
                                { code: 'bn', label: 'Bengali (বাংলা)' },
                                { code: 'de', label: 'German (Deutsch)' },
                                { code: 'id', label: 'Indonesian (Bahasa)' }
                            ].find(l => l.code === i18n.language)?.label || 'English'
                        }
                        onPress={() => setShowLanguageModal(true)}
                    />
                </View>

                {/* 
                <SectionLabel label="Notification Preferences" />
                <View style={s.card}>
                    <ToggleRow
                        icon="bell"
                        iconBg="#EEF2FF"
                        iconColor="#6366F1"
                        label="Push Notifications"
                        sub="Real-time alerts on your device"
                        value={pushEnabled}
                        onValueChange={(val) => {
                            setPushEnabled(val);
                            handleNotifToggle('push', val);
                        }}
                    />
                    <Divider />
                    <ToggleRow
                        icon="mail"
                        iconBg="#EFF9FF"
                        iconColor="#0EA5E9"
                        label="Email Notifications"
                        sub="Weekly digest and important updates"
                        value={emailEnabled}
                        onValueChange={(val) => {
                            setEmailEnabled(val);
                            handleNotifToggle('email', val);
                        }}
                    />
                    <Divider />
                    <ToggleRow
                        icon="message-circle"
                        iconBg="#DCFCE7"
                        iconColor="#15803D"
                        label="New Message Alerts"
                        sub="When someone sends you a message"
                        value={msgEnabled}
                        onValueChange={(val) => {
                            setMsgEnabled(val);
                            handleNotifToggle('messages', val);
                        }}
                    />
                    <Divider />
                    <ToggleRow
                        icon="user-plus"
                        iconBg="#FFEDD5"
                        iconColor="#EA580C"
                        label="Connection Alerts"
                        sub="New requests and accepted connections"
                        value={connEnabled}
                        onValueChange={(val) => {
                            setMsgEnabled(val);
                            handleNotifToggle('connections', val);
                        }}
                    />
                </View>
                */}

                {/* ACCOUNT */}
                <SectionLabel label={t('settings.account')} />
                <View style={s.card}>
                    <SettingRow
                        icon="user" iconBg="#EEF2FF" iconColor="#6366F1"
                        label={t('settings.edit_profile')}
                        onPress={() => navigation.navigate('MainApp', { screen: 'Profile', params: { edit: true } })}
                    />
                    <Divider />
                    <SettingRow
                        icon="lock" iconBg="#EDE9FE" iconColor="#7C3AED"
                        label={t('settings.change_password')}
                        onPress={() => setShowPasswordModal(true)}
                    />
                    <Divider />
                    <SettingRow
                        icon="award" iconBg="#F5F3FF" iconColor="#7C3AED"
                        label={t('settings.premium_membership')}
                        sub={authUser?.isPremium ? t('settings.premium_status_active') : t('settings.premium_status_inactive')}
                        onPress={() => navigation.navigate('Premium')}
                    />
                </View>

                {/* SUPPORT */}
                <SectionLabel label={t('settings.support_legal')} />
                <View style={s.card}>
                    <SettingRow
                        icon="shield" iconBg="#EEF2FF" iconColor="#6366F1"
                        label={t('settings.safety_center')}
                        onPress={() => navigation.navigate('SafetyCenter')}
                    />
                    <Divider />
                    <SettingRow
                        icon="help-circle" iconBg="#F1F5F9" iconColor="#64748B"
                        label={t('settings.help_faq')}
                        onPress={() => navigation.navigate('HelpCenter')}
                    />
                    <Divider />
                    <SettingRow
                        icon="file-text" iconBg="#F1F5F9" iconColor="#64748B"
                        label={t('settings.terms_of_service')}
                        onPress={() => navigation.navigate('TermsOfService')}
                    />
                    <Divider />
                    <SettingRow
                        icon="shield" iconBg="#F1F5F9" iconColor="#64748B"
                        label={t('settings.privacy_policy')}
                        onPress={() => navigation.navigate('PrivacyPolicy')}
                    />
                </View>

                {/* DANGER ZONE */}
                <SectionLabel label={t('settings.account_actions')} />
                <View style={s.card}>
                    <TouchableOpacity style={s.dangerRow} onPress={handleLogout} activeOpacity={0.75}>
                        <View style={[s.rowIconBox, { backgroundColor: '#FEF2F2' }]}>
                            <Feather name="log-out" size={16} color="#EF4444" />
                        </View>
                        <Text style={[s.dangerLabel, { color: '#EF4444' }]}>{t('settings.logout')}</Text>
                        <Feather name="chevron-right" size={18} color="#EF4444" />
                    </TouchableOpacity>
                    <Divider />
                    <TouchableOpacity style={s.dangerRow} onPress={handleDelete} activeOpacity={0.75}>
                        <View style={[s.rowIconBox, { backgroundColor: '#FEF2F2' }]}>
                            <Feather name="trash-2" size={16} color="#DC2626" />
                        </View>
                        <Text style={[s.dangerLabel, { color: '#DC2626' }]}>{t('settings.delete_account')}</Text>
                        <Feather name="chevron-right" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>

                <Text style={s.version}>{t('settings.version_info')}</Text>
                <View style={{ height: 40 }} />
            </ScrollView>

            <PasswordModal
                visible={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                showToast={showToast}
            />

            <DeleteAccountModal
                visible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onDeleteDelted={confirmDelete}
            />

            {/* Language Selection Modal */}
            <Modal visible={showLanguageModal} animationType="fade" transparent>
                <View style={s.modalOverlay}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setShowLanguageModal(false)}
                    />
                    <View style={s.modalSheet}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{t('language.select_title')}</Text>
                            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowLanguageModal(false)} activeOpacity={0.7}>
                                <Feather name="x" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={true} style={s.languageScroll} contentContainerStyle={s.languageScrollContent}>
                            {[
                                { code: 'en', label: 'English', flag: '🇺🇸' },
                                { code: 'ur', label: 'Urdu (اردو)', flag: '🇵🇰' },
                                { code: 'hi', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
                                { code: 'es', label: 'Spanish (Español)', flag: '🇪🇸' },
                                { code: 'fr', label: 'French (Français)', flag: '🇫🇷' },
                                { code: 'ar', label: 'Arabic (العربية)', flag: '🇸🇦' },
                                { code: 'zh', label: 'Chinese (中文)', flag: '🇨🇳' },
                                { code: 'ru', label: 'Russian (Русский)', flag: '🇷🇺' },
                                { code: 'pt', label: 'Portuguese (Português)', flag: '🇧🇷' },
                                { code: 'bn', label: 'Bengali (বাংলা)', flag: '🇧🇩' },
                                { code: 'de', label: 'German (Deutsch)', flag: '🇩🇪' },
                                { code: 'id', label: 'Indonesian (Bahasa)', flag: '🇮🇩' }
                            ].map((lang) => {
                                const isActive = i18n.language === lang.code;
                                return (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[s.langOption, isActive && s.langOptionActive]}
                                        onPress={() => changeLanguage(lang.code)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[s.langFlagBox, isActive && s.langFlagBoxActive]}>
                                            <Text style={s.langFlag}>{lang.flag}</Text>
                                        </View>
                                        <Text style={[s.langText, isActive && s.langTextActive]}>{lang.label}</Text>
                                        {isActive && (
                                            <View style={s.langCheckBadge}>
                                                <Feather name="check" size={14} color="#FFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionLabel({ label }) {
    return <Text style={s.sectionLabel}>{label}</Text>;
}

function Divider() {
    return <View style={s.divider} />;
}

function SettingRow({ icon, label, sub, iconColor, iconBg, onPress }) {
    return (
        <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
            <View style={[s.rowIconBox, { backgroundColor: iconBg || '#F1F5F9' }]}>
                <Feather name={icon} size={16} color={iconColor || '#64748B'} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{label}</Text>
                {sub && <Text style={s.rowSub}>{sub}</Text>}
            </View>
            <Feather name="chevron-right" size={17} color="#CBD5E1" />
        </TouchableOpacity>
    );
}

function ToggleRow({ icon, label, sub, iconColor, iconBg, value, onValueChange }) {
    return (
        <View style={s.row}>
            <View style={[s.rowIconBox, { backgroundColor: iconBg || '#F1F5F9' }]}>
                <Feather name={icon} size={16} color={iconColor || '#64748B'} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{label}</Text>
                {sub && <Text style={s.rowSub}>{sub}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E2E8F0', true: '#818CF8' }}
                thumbColor={value ? '#6366F1' : '#F1F5F9'}
                ios_backgroundColor="#E2E8F0"
            />
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },

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

    premiumBanner: {
        borderRadius: 18, overflow: 'hidden', marginBottom: 20,
        elevation: 6,
        ...Platform.select({
            ios: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
        }),
    },
    premiumBannerGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    premiumEmoji: { fontSize: 26 },
    premiumTitle: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 2 },
    premiumSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: theme.typography.fontFamily.medium },

    sectionLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    divider: { height: 1, backgroundColor: '#F8FAFC', marginLeft: 60 },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
    rowIconBox: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    rowLabel: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#0F172A' },
    rowSub: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginTop: 1 },
    dangerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
    dangerLabel: { flex: 1, fontSize: 15, fontFamily: theme.typography.fontFamily.bold },

    version: { fontSize: 12, color: '#CBD5E1', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', marginTop: 8 },

    // Distance slider
    settingBlock: { padding: 16 },
    settingBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sliderBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    sliderValueBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', paddingVertical: 9 },
    sliderValue: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#64748B', marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
    input: { flex: 1, paddingVertical: 13, fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#0F172A' },
    primaryBtn: { backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    primaryBtnText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    // Language Modal Specifics
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center'
    },
    languageScroll: {
        maxHeight: 450,
        marginTop: 10
    },
    languageScrollContent: {
        paddingBottom: 20
    },
    langOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        // Premium subtle shadow
        elevation: 2,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
    },
    langOptionActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#818CF8',
        shadowColor: "#6366F1",
        shadowOpacity: 0.1,
    },
    langFlagBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    langFlagBoxActive: {
        backgroundColor: '#FFF',
    },
    langFlag: {
        fontSize: 22
    },
    langText: {
        flex: 1,
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.medium,
        color: '#475569'
    },
    langTextActive: {
        color: '#6366F1',
        fontFamily: theme.typography.fontFamily.bold,
    },
    langCheckBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
