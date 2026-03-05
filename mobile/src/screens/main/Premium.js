import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, Platform, StatusBar
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

const getPlans = (t) => [
    { id: 'monthly', label: t('premium.monthly', 'Monthly'), price: '$3.99', perMonth: '$3.99', period: 'monthly', savings: null, popular: false },
    { id: 'biannual', label: t('premium.six_months', '6 Months'), price: '$20', perMonth: '$3.33', period: 'for 6 months', savings: 'Save 17%', popular: false },
    { id: 'yearly', label: t('premium.yearly', 'Yearly'), price: '$32', perMonth: '$2.67', period: 'per year', savings: 'Save 33% 🔥', popular: true },
];

const getFeatureComparison = (t) => [
    { feature: t('premium.features.unlimited_convo', 'Unlimited Conversations'), free: '30 limit', premium: 'Unlimited' },
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
    { icon: 'message-circle', title: t('premium.features.unlimited_convo'), desc: t('premium.highlights.unlimited_chats_desc', 'No 30-chat limit. Connect with as many people as you want.'), color: '#6366F1', bg: '#EEF2FF' },
    { icon: 'users', title: t('premium.highlights.create_groups', 'Create Public Groups'), desc: t('premium.highlights.create_groups_desc', 'Your groups appear in discovery for people with matching interests.'), color: '#0EA5E9', bg: '#EFF9FF' },
    { icon: 'zap', title: t('premium.highlights.priority_discovery', 'Priority Discovery'), desc: t('premium.highlights.priority_desc', 'Your profile appears first in search results near you.'), color: '#F59E0B', bg: '#FFFBEB' },
    { icon: 'eye', title: t('premium.highlights.profile_viewers', 'Profile Viewers'), desc: t('premium.highlights.viewers_desc', 'See exactly who viewed your profile in the last 7 days.'), color: '#A855F7', bg: '#FAF5FF' },
    { icon: 'star', title: t('premium.features.verified_badge'), desc: t('premium.highlights.badge_desc', 'Stand out with an exclusive 👑 badge on your profile.'), color: '#EC4899', bg: '#FDF2F8' },
    { icon: 'sliders', title: t('premium.features.advanced_filters'), desc: t('premium.highlights.filters_desc', "Fine-tune your discovery by availability, vibe, and more."), color: '#22C55E', bg: '#F0FDF4' },
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
            await authService.upgradeToPremium();

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
                            {t('premium.billed_as', { amount: plan.price, defaultValue: `Billed as ${plan.price}` })} • <Text style={s.breakdownBold}>{plan.perMonth}/mo</Text>
                        </Text>
                        {plan.savings && <Text style={s.breakdownSavings}>{plan.savings} {t('premium.vs_monthly')}</Text>}
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
    section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4 },
    sectionTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 4 },
    sectionSub: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, marginBottom: 16 },

    // PLANS
    plansRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    planCard: { flex: 1, borderRadius: 18, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#FFF', padding: 14, alignItems: 'center', position: 'relative', paddingTop: 20 },
    planCardActive: { borderColor: '#7C3AED', backgroundColor: '#FAF5FF', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
    popularBadge: { position: 'absolute', top: -11, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: '#7C3AED', borderRadius: 20, borderWidth: 1, borderColor: '#A855F7' },
    popularText: { fontSize: 9, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
    planLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    planLabelActive: { color: '#7C3AED' },
    planPrice: { fontSize: 22, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 2 },
    planPriceActive: { color: '#7C3AED' },
    planPeriod: { fontSize: 11, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    planPeriodActive: { color: '#A855F7' },
    planCheck: { marginTop: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
    breakdown: { backgroundColor: '#F5F3FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#DDD6FE', marginBottom: 4 },
    breakdownText: { fontSize: 13, color: '#6D28D9', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center' },
    breakdownBold: { fontFamily: theme.typography.fontFamily.bold },
    breakdownSavings: { fontSize: 12, color: '#059669', fontFamily: theme.typography.fontFamily.bold, textAlign: 'center', marginTop: 2 },

    // HIGHLIGHTS
    highlightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    highlightCard: { width: '47.5%', backgroundColor: '#FFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    highlightIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    highlightTitle: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 4 },
    highlightDesc: { fontSize: 12, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, lineHeight: 18 },

    // COMPARISON
    compareToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#C7D2FE' },
    compareToggleText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#4338CA' },
    compareTable: { marginTop: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
    compareHeader: { flexDirection: 'row', backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 10 },
    compareCol: { flex: 1, fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', textAlign: 'center' },
    compareRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#FFF' },
    compareRowAlt: { backgroundColor: '#F8FAFC' },
    compareCell: { flex: 1, fontSize: 12, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center' },
    compareCellNo: { color: '#CBD5E1' },

    // CTA
    ctaSection: { paddingHorizontal: 20, paddingTop: 20 },
    ctaBtn: { borderRadius: 20, overflow: 'hidden', marginBottom: 12, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
    ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
    ctaText: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    ctaNote: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', marginBottom: 12 },
    restoreBtn: { alignItems: 'center', paddingVertical: 8 },
    restoreBtnText: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textDecorationLine: 'underline' },
});
