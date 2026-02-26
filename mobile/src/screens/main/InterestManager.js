import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    FlatList, TextInput, Platform, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { INTEREST_CATEGORIES } from '../../data/interests';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { useToast } from '../../context/ToastContext';

const MAX_FREE_INTERESTS = 30;

export default function InterestManager({ navigation }) {
    const { user: authUser, updateAuthUser } = useAuth();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top;

    const [selectedInterests, setSelectedInterests] = useState(authUser?.interests || []);
    const [search, setSearch] = useState('');
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [customTag, setCustomTag] = useState('');
    const [view, setView] = useState('mine'); // 'mine' | 'browse'
    const [isSaving, setIsSaving] = useState(false);

    const isPremium = authUser?.isPremium || false;
    const limit = isPremium ? Infinity : MAX_FREE_INTERESTS;
    const usedCount = selectedInterests.length;
    const isFull = usedCount >= limit;
    const pct = Math.min(100, (usedCount / MAX_FREE_INTERESTS) * 100);

    const toggleInterest = (name) => {
        if (selectedInterests.includes(name)) {
            setSelectedInterests(prev => prev.filter(i => i !== name));
        } else if (!isFull) {
            setSelectedInterests(prev => [...prev, name]);
        }
    };

    const addCustomTag = () => {
        const tag = customTag.trim();
        if (tag && !selectedInterests.includes(tag) && !isFull) {
            setSelectedInterests(prev => [...prev, tag]);
            setCustomTag('');
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            // 1. Update Backend
            await authService.updateProfile({ interests: selectedInterests });

            // 2. Update Context
            await updateAuthUser({ interests: selectedInterests });

            showToast('Success', 'Interests updated!', 'success');
            navigation.goBack();
        } catch (error) {
            showToast('Error', error.message || 'Could not save interests', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCategories = search
        ? INTEREST_CATEGORIES.map(cat => ({
            ...cat,
            subInterests: cat.subInterests.filter(s =>
                s.toLowerCase().includes(search.toLowerCase())
            ),
        })).filter(cat => cat.subInterests.length > 0)
        : INTEREST_CATEGORIES;

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={[styles.header, { paddingTop: safeTop + 8 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Interests</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                    <Text style={[styles.doneBtn, isSaving && { opacity: 0.5 }]}>
                        {isSaving ? 'Saving...' : 'Done'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* COUNTER BAR */}
            <View style={styles.counterWrap}>
                <View style={styles.counterRow}>
                    <Text style={styles.counterLabel}>
                        <Text style={[styles.counterNum, usedCount >= MAX_FREE_INTERESTS && { color: '#EF4444' }]}>
                            {usedCount}
                        </Text>
                        /{isPremium ? '∞' : MAX_FREE_INTERESTS} interests selected
                    </Text>
                    {!isPremium && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Premium')}
                            style={styles.premiumChip}
                        >
                            <Text style={styles.premiumChipText}>👑 Go Unlimited</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {!isPremium && (
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct >= 90 ? '#EF4444' : theme.colors.primary }]} />
                    </View>
                )}
            </View>

            {/* TABS */}
            <View style={styles.tabsRow}>
                {['mine', 'browse'].map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tab, view === t && styles.tabActive]}
                        onPress={() => setView(t)}
                    >
                        <Text style={[styles.tabText, view === t && styles.tabTextActive]}>
                            {t === 'mine' ? 'My Interests' : 'Browse All'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {view === 'mine' ? (
                /* ── MY INTERESTS VIEW ── */
                <ScrollView contentContainerStyle={styles.myWrap} showsVerticalScrollIndicator={false}>
                    {/* Custom tag input (Premium) */}
                    {isPremium ? (
                        <View style={styles.customRow}>
                            <TextInput
                                style={styles.customInput}
                                placeholder="Add a custom interest tag..."
                                placeholderTextColor="#94A3B8"
                                value={customTag}
                                onChangeText={setCustomTag}
                                onSubmitEditing={addCustomTag}
                            />
                            <TouchableOpacity style={styles.customAddBtn} onPress={addCustomTag}>
                                <Feather name="plus" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.premiumBanner}
                            onPress={() => navigation.navigate('Premium')}
                            activeOpacity={0.88}
                        >
                            <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumBannerGrad}>
                                <Text style={styles.premiumBannerText}>👑 Premium — Add custom interest tags + unlimited interests</Text>
                                <Feather name="chevron-right" size={16} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.myLabel}>Your interests (tap to remove)</Text>
                    <View style={styles.chipsWrap}>
                        {selectedInterests.map((interest, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.myChip}
                                onPress={() => toggleInterest(interest)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.myChipText}>{interest}</Text>
                                <Feather name="x" size={12} color={theme.colors.primary} style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        ))}
                        {selectedInterests.length === 0 && (
                            <Text style={styles.emptyNote}>No interests selected yet. Browse to add some!</Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.browseMoreBtn} onPress={() => setView('browse')}>
                        <Feather name="plus-circle" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.browseMoreText}>Browse more interests</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                /* ── BROWSE ALL VIEW ── */
                <View style={{ flex: 1 }}>
                    {/* Search */}
                    <View style={styles.searchBar}>
                        <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search interests..."
                            placeholderTextColor="#94A3B8"
                            value={search}
                            onChangeText={setSearch}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Feather name="x-circle" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.browseScroll}>
                        {filteredCategories.map(cat => (
                            <View key={cat.id} style={styles.catBlock}>
                                <TouchableOpacity
                                    style={styles.catHeader}
                                    onPress={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient colors={cat.color} style={styles.catEmojiBg}>
                                        <Text style={styles.catEmoji}>{cat.emoji}</Text>
                                    </LinearGradient>
                                    <Text style={styles.catName}>{cat.name}</Text>
                                    <Text style={styles.catCount}>
                                        {cat.subInterests.filter(s => selectedInterests.includes(s)).length || ''} selected
                                    </Text>
                                    <Feather
                                        name={expandedCategory === cat.id ? 'chevron-up' : 'chevron-down'}
                                        size={18} color="#94A3B8"
                                    />
                                </TouchableOpacity>

                                {(expandedCategory === cat.id || search) && (
                                    <View style={styles.subWrap}>
                                        {cat.subInterests.map((sub, i) => {
                                            const isSelected = selectedInterests.includes(sub);
                                            const disabled = !isSelected && isFull;
                                            return (
                                                <TouchableOpacity
                                                    key={i}
                                                    style={[styles.subChip, isSelected && styles.subChipActive, disabled && styles.subChipDisabled]}
                                                    onPress={() => !disabled && toggleInterest(sub)}
                                                    activeOpacity={disabled ? 1 : 0.8}
                                                >
                                                    {isSelected && (
                                                        <Feather name="check" size={11} color="#FFF" style={{ marginRight: 5 }} />
                                                    )}
                                                    <Text style={[styles.subChipText, isSelected && styles.subChipTextActive, disabled && styles.subChipTextDisabled]}>
                                                        {sub}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        ))}

                        {isFull && !isPremium && (
                            <TouchableOpacity
                                style={styles.limitBanner}
                                onPress={() => navigation.navigate('Premium')}
                                activeOpacity={0.88}
                            >
                                <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.limitBannerGrad}>
                                    <Text style={styles.limitBannerText}>
                                        🎯 You've reached the 30 interest limit. Upgrade to Premium for unlimited interests!
                                    </Text>
                                    <Text style={styles.limitBannerCta}>Upgrade Now →</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // HEADER
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    doneBtn: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },

    // COUNTER
    counterWrap: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    counterLabel: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#64748B' },
    counterNum: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },
    premiumChip: { backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FED7AA' },
    premiumChipText: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#C2410C' },
    progressTrack: { height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 5, borderRadius: 3 },

    // TABS
    tabsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: theme.colors.primary },
    tabText: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#94A3B8' },
    tabTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },

    // MY INTERESTS
    myWrap: { padding: 20, paddingBottom: 40 },
    customRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    customInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, height: 46, fontSize: 14, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium, borderWidth: 1, borderColor: '#E2E8F0' },
    customAddBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    premiumBanner: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
    premiumBannerGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    premiumBannerText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', flex: 1, marginRight: 8 },
    myLabel: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    myChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#BFDBFE' },
    myChipText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },
    emptyNote: { fontSize: 14, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    browseMoreBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    browseMoreText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },

    // BROWSE
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, marginHorizontal: 20, marginVertical: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium },
    browseScroll: { paddingHorizontal: 20, paddingBottom: 40 },
    catBlock: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    catHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    catEmojiBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    catEmoji: { fontSize: 20 },
    catName: { flex: 1, fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    catCount: { fontSize: 12, color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold, marginRight: 4 },
    subWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
    subChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' },
    subChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    subChipDisabled: { opacity: 0.4 },
    subChipText: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#64748B' },
    subChipTextActive: { color: '#FFF', fontFamily: theme.typography.fontFamily.bold },
    subChipTextDisabled: { color: '#CBD5E1' },
    limitBanner: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    limitBannerGrad: { padding: 18 },
    limitBannerText: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#FFF', marginBottom: 10, lineHeight: 20 },
    limitBannerCta: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
});
