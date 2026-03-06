import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, Platform, StatusBar, Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';

const { width: screenWidth } = Dimensions.get('window');

const getPlans = (t) => [
    { id: 'monthly', label: t('premium.monthly', 'Monthly'), price: '$3.99', perMonth: '$3.99', period: 'monthly', savings: null, popular: false },
    { id: 'biannual', label: t('premium.six_months', '6 Months'), price: '$20', perMonth: '$3.33', period: 'for 6 months', savings: 'Save 17%', popular: false },
    { id: 'yearly', label: t('premium.yearly', 'Yearly'), price: '$32', perMonth: '$2.67', period: 'per year', savings: 'Save 33% 🔥', popular: true },
    { id: 'lifetime', label: t('premium.lifetime', 'Lifetime'), price: '$99', perMonth: 'One-time', period: 'forever', savings: 'Best Value 💎', popular: false },
];

const getFeatureComparison = (t) => [
    { feature: t('premium.features.unlimited_convo', 'Unlimited Conversations'), free: '30 limit', premium: 'Unlimited' },
    { feature: t('premium.features.custom_interests', 'Custom Interest Tags'), free: '✗', premium: '✓' },
    { feature: t('interests_manager.title', 'Interests'), free: '30 max', premium: 'Unlimited' },
    { feature: t('connections.group.create_public', 'Create Public Groups'), free: '✗', premium: '✓' },
    { feature: t('connections.group.discovery', 'Group Discovery'), free: 'Via referral (1)', premium: 'Unlimited' },
    { feature: t('premium.features.verified_badge', 'Verified Profile Badge'), free: '✗', premium: '👑' },
    { feature: t('premium.features.priority_search', 'Priority in Search'), free: '✗', premium: '✓' },
    { feature: t('premium.features.see_who_likes', 'See Who Likes You'), free: '✗', premium: '✓' },
    { feature: t('premium.features.incognito', 'Incognito Mode'), free: '✗', premium: '✓' },
    { feature: t('premium.features.advanced_filters', 'Advanced Discovery Filters'), free: 'Basic', premium: 'All filters' },
];

const getHighlights = (t) => [
    { icon: 'tag', title: t('premium.features.custom_interests'), desc: t('interests_manager.add_unlimited_desc', "Add unlimited interests & custom tags that others can discover."), color: '#8B5CF6', bg: '#F5F3FF' },
    { icon: 'message-circle', title: t('premium.features.unlimited_convo'), desc: t('premium.highlights.unlimited_chats_desc', 'No 30-chat limit. Connect with as many people as you want.'), color: '#6366F1', bg: '#EEF2FF' },
    { icon: 'users', title: t('premium.highlights.create_groups', 'Create Public Groups'), desc: t('premium.highlights.create_groups_desc', 'Your groups appear in discovery for people with matching interests.'), color: '#0EA5E9', bg: '#EFF9FF' },
    { icon: 'zap', title: t('premium.highlights.priority_discovery', 'Priority Discovery'), desc: t('premium.highlights.priority_desc', 'Your profile appears first in search results near you.'), color: '#F59E0B', bg: '#FFFBEB' },
    { icon: 'eye', title: t('premium.highlights.profile_viewers', 'Profile Viewers'), desc: t('premium.highlights.viewers_desc', 'See exactly who viewed your profile in the last 7 days.'), color: '#A855F7', bg: '#FAF5FF' },
    { icon: 'star', title: t('premium.features.verified_badge'), desc: t('premium.highlights.badge_desc', 'Stand out with an exclusive 👑 badge on your profile.'), color: '#EC4899', bg: '#FDF2F8' },
];

export default function Premium({ navigation }) {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const PLANS = getPlans(t);
    const FEATURE_COMPARISON = getFeatureComparison(t);
    const HIGHLIGHTS = getHighlights(t);
    const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top;
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [showComparison, setShowComparison] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const plan = PLANS.find(p => p.id === selectedPlan);

    const handleSelectPlan = (id) => {
        Haptics.selectionAsync();
        setSelectedPlan(id);
    };

    const handleUpgrade = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Call backend API
            await authService.upgradeToPremium(selectedPlan);

            // Update local user context
            updateUser({ isPremium: true });

            showToast(t('premium.welcome_toast', 'Welcome to Premium! 👑'), t('premium.welcome_msg', `You are now a Premium member. Enjoy unlimited access!`), 'success');
            navigation.goBack();
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast(t('common.error'), error.message || t('premium.failed_payment', 'Payment failed'), 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={s.root}>
            <ScrollView showsVerticalScrollIndicator={false} bounces contentContainerStyle={{ paddingBottom: 40 }}>
                {/* HERO GRADIENT */}
                <LinearGradient
                    colors={['#4C1D95', '#6D28D9', '#7C3AED', '#A855F7']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[s.hero, { paddingTop: safeTop + 8 }]}
                >
                    {/* Close button */}
                    <TouchableOpacity style={[s.closeBtn, { top: safeTop + 8 }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Feather name="x" size={18} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>

                    {/* Crown */}
                    <View style={s.crownWrap}>
                        <Text style={{ fontSize: 52 }}>👑</Text>
                    </View>
                    <Text style={s.heroTitle}>{user?.isPremium ? t('premium.active') : t('premium.go_premium')}</Text>
                    <Text style={s.heroSub}>
                        {user?.isPremium
                            ? t('premium.active_sub', "You're enjoying the elite BondUs experience with no limits. Thank you for being a part of our premium community!")
                            : t('premium.unlock_experience')}
                    </Text>

                    {/* Floating stats */}
                    <View style={s.statsRow}>
                        {[
                            { num: '10K+', label: t('premium.premium_users') },
                            { num: '4.9★', label: t('premium.app_rating') },
                            { num: '3x', label: t('premium.more_matches') },
                        ].map((stat, i) => (
                            <View key={i} style={s.statItem}>
                                <Text style={s.statNum}>{stat.num}</Text>
                                <Text style={s.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </LinearGradient>

                {/* PLAN SELECTOR */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('premium.choose_plan')}</Text>
                    <Text style={s.sectionSub}>{t('premium.cancel_anytime')}</Text>
                    <View style={s.plansRow}>
                        {PLANS.map(plan => (
                            <TouchableOpacity
                                key={plan.id}
                                style={[s.planCard, selectedPlan === plan.id && s.planCardActive]}
                                onPress={() => handleSelectPlan(plan.id)}
                                activeOpacity={0.85}
                            >
                                {plan.popular && (
                                    <View style={s.popularBadge}>
                                        <Text style={s.popularText}>{t('premium.popular', 'POPULAR')}</Text>
                                    </View>
                                )}
                                {plan.savings && !plan.popular && (
                                    <View style={[s.popularBadge, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                                        <Text style={[s.popularText, { color: '#15803D' }]}>{plan.savings}</Text>
                                    </View>
                                )}
                                <Text style={[s.planLabel, selectedPlan === plan.id && s.planLabelActive]}>{plan.label}</Text>
                                <Text style={[s.planPrice, selectedPlan === plan.id && s.planPriceActive]}>{plan.price}</Text>
                                <Text style={[s.planPeriod, selectedPlan === plan.id && s.planPeriodActive]}>{plan.period}</Text>
                                {selectedPlan === plan.id && (
                                    <View style={s.planCheck}>
                                        <Feather name="check" size={12} color="#FFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Per month breakdown */}
                    <View style={s.breakdown}>
                        <Text style={s.breakdownText}>
                            {t('premium.billed_as', { amount: plan.price, defaultValue: `Billed as ${plan.price}` })}
                            {plan.id !== 'lifetime' && (
                                <> • <Text style={s.breakdownBold}>{plan.perMonth}/mo</Text></>
                            )}
                        </Text>
                        {plan.savings && <Text style={s.breakdownSavings}>{plan.savings} {plan.id !== 'lifetime' ? t('premium.vs_monthly') : ''}</Text>}
                    </View>
                </View>

                {/* FEATURE HIGHLIGHTS */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('premium.what_you_get')}</Text>
                    <View style={s.highlightsGrid}>
                        {HIGHLIGHTS.map((h, i) => (
                            <View key={i} style={s.highlightCard}>
                                <View style={[s.highlightIcon, { backgroundColor: h.bg }]}>
                                    <Feather name={h.icon} size={20} color={h.color} />
                                </View>
                                <Text style={s.highlightTitle}>{h.title}</Text>
                                <Text style={s.highlightDesc}>{h.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* COMPARISON TABLE */}
                <View style={s.section}>
                    <TouchableOpacity style={s.compareToggle} onPress={() => setShowComparison(!showComparison)} activeOpacity={0.8}>
                        <Text style={s.compareToggleText}>{t('premium.compare_table')}</Text>
                        <Feather name={showComparison ? 'chevron-up' : 'chevron-down'} size={18} color="#6366F1" />
                    </TouchableOpacity>

                    {showComparison && (
                        <View style={s.compareTable}>
                            <View style={s.compareHeader}>
                                <Text style={[s.compareCol, { flex: 2.5 }]}>{t('premium.feature', 'Feature')}</Text>
                                <Text style={s.compareCol}>{t('premium.free', 'Free')}</Text>
                                <Text style={[s.compareCol, { color: '#7C3AED' }]}>{t('premium.premium', 'Premium')}</Text>
                            </View>
                            {FEATURE_COMPARISON.map((row, i) => (
                                <View key={i} style={[s.compareRow, i % 2 === 0 && s.compareRowAlt]}>
                                    <Text style={[s.compareCell, { flex: 2.5, color: '#334155' }]}>{row.feature}</Text>
                                    <Text style={[s.compareCell, row.free === '✗' && s.compareCellNo]}>{row.free}</Text>
                                    <Text style={[s.compareCell, { color: '#7C3AED', fontFamily: theme.typography.fontFamily.bold }]}>{row.premium}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* UPGRADE CTA */}
                <View style={s.ctaSection}>
                    <TouchableOpacity
                        style={[s.ctaBtn, user?.isPremium && { opacity: 0.8 }]}
                        onPress={user?.isPremium ? null : handleUpgrade}
                        activeOpacity={0.9}
                        disabled={isProcessing || user?.isPremium}
                    >
                        <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                            <Text style={s.ctaText}>
                                {isProcessing
                                    ? t('premium.processing')
                                    : user?.isPremium
                                        ? t('premium.active')
                                        : t('premium.upgrade_btn', { price: plan.price, defaultValue: `Upgrade to Premium · ${plan.price}` })}
                            </Text>
                            {!isProcessing && !user?.isPremium && <Feather name="arrow-right" size={18} color="#FFF" style={{ marginLeft: 8 }} />}
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={s.ctaNote}>🔒 {t('premium.secure_note')}</Text>
                    <TouchableOpacity style={s.restoreBtn} onPress={() => showToast(t('premium.restore_purchase'), t('premium.no_purchases', 'No previous purchases found.'), 'info')} activeOpacity={0.8}>
                        <Text style={s.restoreBtnText}>{t('premium.restore_purchase')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },

    // HERO
    hero: { paddingHorizontal: 24, paddingBottom: 36, alignItems: 'center', position: 'relative' },
    closeBtn: { position: 'absolute', top: 0, right: 20, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    crownWrap: { marginTop: 40, marginBottom: 12, width: 90, height: 90, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    heroTitle: { fontSize: 30, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 10, textAlign: 'center' },
    heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12, marginBottom: 24 },
    statsRow: { flexDirection: 'row', gap: 0, width: '100%', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8 },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 2 },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: theme.typography.fontFamily.medium },

    // SECTIONS
    section: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 },
    sectionTitle: { fontSize: 22, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 4 },
    sectionSub: { fontSize: 14, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, marginBottom: 20 },

    // PLANS GRID (2x2)
    plansRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
    planCard: {
        width: (screenWidth - 32 - 12) / 2, // 2 columns minus horizontal padding and gap
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
        paddingVertical: 20,
        paddingHorizontal: 12,
        alignItems: 'center',
        position: 'relative',
        marginBottom: 4
    },
    planCardActive: {
        borderColor: '#7C3AED',
        backgroundColor: '#FAF5FF',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        alignSelf: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#7C3AED',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#A855F7',
        zIndex: 5
    },
    popularText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
    planLabel: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    planLabelActive: { color: '#7C3AED' },
    planPrice: { fontSize: 26, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    planPriceActive: { color: '#7C3AED' },
    planPeriod: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    planPeriodActive: { color: '#A855F7' },
    planCheck: { marginTop: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },

    breakdown: { backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
    breakdownText: { fontSize: 14, color: '#1E293B', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center' },
    breakdownBold: { fontFamily: theme.typography.fontFamily.bold, color: '#7C3AED' },
    breakdownSavings: { fontSize: 13, color: '#059669', fontFamily: theme.typography.fontFamily.bold, textAlign: 'center', marginTop: 4 },

    // HIGHLIGHTS
    highlightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
    highlightCard: { width: (screenWidth - 32 - 12) / 2, backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    highlightIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    highlightTitle: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 6 },
    highlightDesc: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, lineHeight: 19 },

    // COMPARISON
    compareToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
    compareToggleText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#475569' },
    compareTable: { marginTop: 12, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
    compareHeader: { flexDirection: 'row', backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 12 },
    compareCol: { flex: 1, fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', textAlign: 'center' },
    compareRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    compareRowAlt: { backgroundColor: '#F8FAFC' },
    compareCell: { flex: 1, fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center' },
    compareCellNo: { color: '#CBD5E1' },

    // CTA
    ctaSection: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20 },
    ctaBtn: { borderRadius: 20, overflow: 'hidden', marginBottom: 16, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 },
    ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
    ctaText: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    ctaNote: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', marginBottom: 14 },
    restoreBtn: { alignItems: 'center', paddingVertical: 8 },
    restoreBtnText: { fontSize: 14, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, textDecorationLine: 'underline' },
});
