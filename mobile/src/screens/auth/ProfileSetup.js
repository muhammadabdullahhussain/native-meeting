import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert,
    LayoutAnimation, UIManager
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';
import { INTEREST_CATEGORIES } from '../../data/interests';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { useToast } from '../../context/ToastContext';

const LOOKING_FOR_OPTIONS = [
    { label: 'Coffee Chat', emoji: '☕' },
    { label: 'Collab Partner', emoji: '🤝' },
    { label: 'Networking', emoji: '🌐' },
    { label: 'Mentorship', emoji: '🎓' },
    { label: 'Friends', emoji: '👋' },
];

const MAX_INTERESTS = 30;
const STEPS = ['About You', 'Your Interests', 'Looking For'];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileSetup({ navigation, route }) {
    const { login } = useAuth();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const passedName = route?.params?.name || '';

    const [step, setStep] = useState(0);
    const [name, setName] = useState(passedName);
    const [bio, setBio] = useState('');
    const [city, setCity] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [expandedCat, setExpandedCat] = useState(INTEREST_CATEGORIES[0]?.id);
    const [lookingFor, setLookingFor] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const detectLocation = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGpsLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast('Permission Denied', 'Please allow location access to auto-detect your city.', 'error');
                setGpsLoading(false);
                return;
            }
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const [place] = await Location.reverseGeocodeAsync({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            });
            if (place) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const cityName = [place.city || place.district, place.region].filter(Boolean).join(', ');
                setCity(cityName);
            }
        } catch (e) {
            showToast('Location Error', 'Could not detect location. Please enter manually.', 'info');
        } finally {
            setGpsLoading(false);
        }
    };

    const toggleInterest = (sub) => {
        Haptics.selectionAsync();
        if (selectedInterests.includes(sub)) {
            setSelectedInterests(prev => prev.filter(i => i !== sub));
        } else if (selectedInterests.length < MAX_INTERESTS) {
            setSelectedInterests(prev => [...prev, sub]);
        }
    };

    const toggleLookingFor = (label) => {
        Haptics.selectionAsync();
        setLookingFor(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Permission Needed', 'Please allow camera access to set a profile picture.', 'info');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            try {
                setIsUploading(true);
                const localUri = result.assets[0].uri;

                // Real Upload to Cloudinary
                const uploadResult = await authService.uploadImage(localUri);

                if (uploadResult.success) {
                    setAvatar(uploadResult.url);
                    showToast('Success', 'Profile photo uploaded!', 'success');
                }
            } catch (error) {
                console.error('Avatar upload failed:', error);
                showToast('Upload Failed', 'Could not upload photo. Using local preview temporarily.', 'error');
                setAvatar(result.assets[0].uri); // Fallback to local
            } finally {
                setIsUploading(false);
            }
        }
    };

    const canNext = () => {
        if (step === 0) return name.trim().length > 0 && city.trim().length > 0;
        if (step === 1) return selectedInterests.length >= 3;
        return lookingFor.length > 0;
    };

    const goNext = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (step < STEPS.length - 1) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setStep(s => s + 1);
        } else {
            // Finalize setup and register
            setIsSubmitting(true);
            try {
                const userData = {
                    name,
                    email: route.params?.email || '',
                    password: route.params?.password || '',
                    bio,
                    city,
                    jobTitle,
                    interests: selectedInterests,
                    lookingFor,
                    avatar
                };

                const data = await authService.register(userData);
                await login(data.user, data.token);
                // Navigation to MainApp handled by RootStack auth guard
            } catch (e) {
                const msg = e.message || 'Something went wrong';
                showToast('Setup Failed', msg, 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const goBack = () => {
        if (step > 0) setStep(s => s - 1);
        else navigation.goBack();
    };

    const progress = (step + 1) / STEPS.length;

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <LinearGradient
                colors={['#1E1B4B', '#3730A3', '#7C3AED']}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
            >
                <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                    <Feather name="arrow-left" size={20} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerStep}>Step {step + 1} of {STEPS.length}</Text>
                    <Text style={styles.headerTitle}>{STEPS[step]}</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* ── STEP 0: ABOUT YOU ── */}
                    {step === 0 && (
                        <View>
                            {/* Avatar picker */}
                            <View style={styles.avatarSection}>
                                <TouchableOpacity style={styles.avatarPicker} activeOpacity={0.8} onPress={pickAvatar}>
                                    <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.avatarPickerGrad}>
                                        {avatar ? (
                                            <Image source={{ uri: avatar }} style={styles.avatarImg} />
                                        ) : (
                                            <Feather name="camera" size={28} color="#FFF" />
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                                <Text style={styles.avatarHint}>{avatar ? 'Tap to change' : 'Add a photo (optional)'}</Text>
                            </View>

                            <Field icon="user" label="Full Name *" placeholder="e.g. Sofia Hernandez" value={name} onChangeText={setName} />
                            <Field icon="briefcase" label="Job Title / Role" placeholder="e.g. Product Designer" value={jobTitle} onChangeText={setJobTitle} />

                            {/* City — GPS-enabled field */}
                            <View style={styles.fieldWrap}>
                                <Text style={styles.fieldLabel}>City *</Text>
                                <View style={styles.cityRow}>
                                    <View style={styles.cityInputWrap}>
                                        <Feather name="map-pin" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                                        <TextInput
                                            style={styles.fieldInput}
                                            placeholder="e.g. San Francisco, CA"
                                            placeholderTextColor="#CBD5E1"
                                            value={city}
                                            onChangeText={setCity}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.gpsBtn}
                                        onPress={detectLocation}
                                        disabled={gpsLoading}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#6366F1', '#7C3AED']}
                                            style={styles.gpsBtnGrad}
                                        >
                                            {gpsLoading
                                                ? <ActivityIndicator size="small" color="#FFF" />
                                                : <Feather name="navigation" size={15} color="#FFF" />
                                            }
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                                {gpsLoading && (
                                    <Text style={styles.gpsHint}>📍 Detecting your location...</Text>
                                )}
                            </View>

                            <Field icon="edit-3" label="Short Bio" placeholder="What makes you interesting?" value={bio} onChangeText={setBio} multiline />
                        </View>
                    )}

                    {/* ── STEP 1: INTERESTS ── */}
                    {step === 1 && (
                        <View>
                            <View style={styles.stepIntro}>
                                <Text style={styles.stepIntroTitle}>Pick your interests</Text>
                                <Text style={styles.stepIntroSub}>Choose at least 3. You can add up to 30.</Text>
                                <View style={styles.interestCounter}>
                                    <Text style={styles.interestCounterText}>
                                        {selectedInterests.length}/{MAX_INTERESTS}
                                    </Text>
                                </View>
                            </View>

                            {/* Selected chips */}
                            {selectedInterests.length > 0 && (
                                <View style={styles.selectedWrap}>
                                    <Text style={styles.selectedLabel}>Selected:</Text>
                                    <View style={styles.chipsRow}>
                                        {selectedInterests.map(s => (
                                            <TouchableOpacity key={s} style={styles.selectedChip} onPress={() => toggleInterest(s)}>
                                                <Text style={styles.selectedChipText}>{s}</Text>
                                                <Feather name="x" size={10} color="#FFF" style={{ marginLeft: 4 }} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Category list */}
                            {INTEREST_CATEGORIES.map(cat => (
                                <View key={cat.id} style={styles.catBlock}>
                                    <TouchableOpacity
                                        style={styles.catHeader}
                                        onPress={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient colors={cat.color} style={styles.catEmoji}>
                                            <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                                        </LinearGradient>
                                        <Text style={styles.catName}>{cat.name}</Text>
                                        <Text style={styles.catSelected}>
                                            {cat.subInterests.filter(s => selectedInterests.includes(s)).length || ''}
                                        </Text>
                                        <Feather
                                            name={expandedCat === cat.id ? 'chevron-up' : 'chevron-down'}
                                            size={18} color="#94A3B8"
                                        />
                                    </TouchableOpacity>

                                    {expandedCat === cat.id && (
                                        <View style={styles.subChipsWrap}>
                                            {cat.subInterests.map(sub => {
                                                const sel = selectedInterests.includes(sub);
                                                const disabled = !sel && selectedInterests.length >= MAX_INTERESTS;
                                                return (
                                                    <TouchableOpacity
                                                        key={sub}
                                                        style={[styles.subChip, sel && styles.subChipSel, disabled && styles.subChipDisabled]}
                                                        onPress={() => !disabled && toggleInterest(sub)}
                                                        activeOpacity={disabled ? 1 : 0.75}
                                                    >
                                                        {sel && <Feather name="check" size={10} color="#FFF" style={{ marginRight: 4 }} />}
                                                        <Text style={[styles.subChipText, sel && styles.subChipTextSel]}>{sub}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ── STEP 2: LOOKING FOR ── */}
                    {step === 2 && (
                        <View>
                            <View style={styles.stepIntro}>
                                <Text style={styles.stepIntroTitle}>What are you looking for?</Text>
                                <Text style={styles.stepIntroSub}>This helps people understand how to connect with you. Pick all that apply.</Text>
                            </View>

                            {LOOKING_FOR_OPTIONS.map(opt => {
                                const sel = lookingFor.includes(opt.label);
                                return (
                                    <TouchableOpacity
                                        key={opt.label}
                                        style={[styles.lfCard, sel && styles.lfCardSel]}
                                        onPress={() => toggleLookingFor(opt.label)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.lfEmoji, sel && styles.lfEmojiSel]}>
                                            <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                                        </View>
                                        <Text style={[styles.lfLabel, sel && styles.lfLabelSel]}>{opt.label}</Text>
                                        {sel && (
                                            <View style={styles.lfCheck}>
                                                <Feather name="check" size={13} color="#FFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            <View style={styles.readyBanner}>
                                <Text style={styles.readyText}>
                                    🎉 Almost there! Tap "Finish" to start meeting people who share your interests.
                                </Text>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* BOTTOM CTA */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                {step === 1 && selectedInterests.length < 3 && (
                    <Text style={styles.bottomHint}>Select at least 3 interests to continue</Text>
                )}
                <TouchableOpacity
                    style={[styles.ctaBtn, (!canNext() || isSubmitting) && { opacity: 0.5 }]}
                    onPress={goNext}
                    disabled={!canNext() || isSubmitting}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={['#7C3AED', '#A855F7']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.ctaGrad}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.ctaText}>
                                {step < STEPS.length - 1 ? 'Continue →' : 'Finish & Explore! 🎉'}
                            </Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Reusable field component
function Field({ icon, label, placeholder, value, onChangeText, multiline }) {
    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.fieldRow, multiline && { height: 90, alignItems: 'flex-start', paddingTop: 14 }]}>
                <Feather name={icon} size={16} color="#94A3B8" style={styles.fieldIcon} />
                <TextInput
                    style={[styles.fieldInput, multiline && { textAlignVertical: 'top' }]}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // HEADER
    header: { paddingHorizontal: 20, paddingBottom: 20 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    headerCenter: { marginBottom: 16 },
    headerStep: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: theme.typography.fontFamily.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    headerTitle: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: 4, backgroundColor: '#FFF', borderRadius: 2 },

    scroll: { padding: 20, paddingBottom: 120 },

    // STEP 0
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatarPicker: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', marginBottom: 10, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
    avatarPickerGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    avatarImg: { width: '100%', height: '100%' },
    avatarHint: { fontSize: 13, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#475569', marginBottom: 8, marginLeft: 2 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 52 },
    fieldIcon: { marginRight: 10 },
    fieldInput: { flex: 1, fontSize: 15, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium },

    // GPS City field
    fieldWrap: { marginBottom: 16 },
    cityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cityInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 52 },
    gpsBtn: { borderRadius: 14, overflow: 'hidden', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    gpsBtnGrad: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
    gpsHint: { fontSize: 12, color: '#6366F1', fontFamily: theme.typography.fontFamily.medium, marginTop: 6, marginLeft: 4 },

    // STEP 1 - INTERESTS
    stepIntro: { alignItems: 'center', marginBottom: 20 },
    stepIntroTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 6 },
    stepIntroSub: { fontSize: 14, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', lineHeight: 20 },
    interestCounter: { backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', marginTop: 10 },
    interestCounterText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#7C3AED' },
    selectedWrap: { marginBottom: 16 },
    selectedLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
    selectedChipText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    catBlock: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    catHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    catEmoji: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    catName: { flex: 1, fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    catSelected: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: '#7C3AED', marginRight: 4 },
    subChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
    subChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    subChipSel: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    subChipDisabled: { opacity: 0.4 },
    subChipText: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#64748B' },
    subChipTextSel: { color: '#FFF', fontFamily: theme.typography.fontFamily.bold },

    // STEP 2 - LOOKING FOR
    lfCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#F1F5F9', gap: 14 },
    lfCardSel: { borderColor: theme.colors.primary, backgroundColor: '#EFF6FF' },
    lfEmoji: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    lfEmojiSel: { backgroundColor: '#DBEAFE' },
    lfLabel: { flex: 1, fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' },
    lfLabelSel: { color: '#7C3AED' },
    lfCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    readyBanner: { backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#BBF7D0' },
    readyText: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#166534', lineHeight: 21, textAlign: 'center' },

    // BOTTOM BAR
    bottomBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    bottomHint: { fontSize: 12, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', marginBottom: 10 },
    ctaBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    ctaGrad: { height: 56, justifyContent: 'center', alignItems: 'center' },
    ctaText: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
});
