import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Animated, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

export default function ForgotPassword({ navigation }) {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const checkScale = useRef(new Animated.Value(0)).current;

    const handleReset = () => {
        setError('');
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setSent(true);
        Animated.spring(checkScale, {
            toValue: 1,
            tension: 60,
            friction: 5,
            useNativeDriver: Platform.OS !== 'web'
        }).start();
    };

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* HERO */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[s.hero, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color="#FFF" />
                </TouchableOpacity>

                {!sent ? (
                    <>
                        <View style={s.heroIconWrap}>
                            <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={s.heroIcon}>
                                <Feather name="lock" size={32} color="#FFF" />
                            </LinearGradient>
                        </View>
                        <Text style={s.heroTitle}>Forgot Password?</Text>
                        <Text style={s.heroSub}>No worries — we'll email you reset instructions.</Text>
                    </>
                ) : (
                    <>
                        <Animated.View style={[s.heroIconWrap, { transform: [{ scale: checkScale }] }]}>
                            <View style={s.successIcon}>
                                <Feather name="check" size={36} color="#FFF" />
                            </View>
                        </Animated.View>
                        <Text style={s.heroTitle}>Email Sent! 🎉</Text>
                        <Text style={s.heroSub}>Check your inbox for reset instructions.</Text>
                    </>
                )}
            </LinearGradient>

            {/* FORM */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {!sent ? (
                        <>
                            {/* Email field */}
                            <View style={s.fieldGroup}>
                                <Text style={s.fieldLabel}>Email Address</Text>
                                <View style={s.fieldRow}>
                                    <Feather name="mail" size={17} color="#94A3B8" style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={s.fieldInput}
                                        placeholder="you@example.com"
                                        placeholderTextColor="#CBD5E1"
                                        value={email}
                                        onChangeText={v => { setEmail(v); setError(''); }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoFocus
                                    />
                                </View>
                            </View>

                            {error !== '' && (
                                <View style={s.errorBox}>
                                    <Feather name="alert-circle" size={14} color="#EF4444" style={{ marginRight: 8 }} />
                                    <Text style={s.errorText}>{error}</Text>
                                </View>
                            )}

                            <TouchableOpacity style={s.ctaBtn} onPress={handleReset} activeOpacity={0.88}>
                                <LinearGradient
                                    colors={['#6366F1', '#7C3AED']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={s.ctaGrad}
                                >
                                    <Text style={s.ctaText}>Send Reset Link</Text>
                                    <Feather name="send" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.backToLogin} onPress={() => navigation.goBack()}>
                                <Feather name="arrow-left" size={14} color="#6366F1" style={{ marginRight: 6 }} />
                                <Text style={s.backToLoginText}>Back to Sign In</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Success state */}
                            <View style={s.successCard}>
                                <Text style={s.successCardTitle}>What to do next:</Text>
                                {[
                                    { icon: 'mail', text: `We've sent a link to ${email}` },
                                    { icon: 'clock', text: 'The link expires in 30 minutes' },
                                    { icon: 'shield', text: 'Check your spam folder too' },
                                ].map((item, i) => (
                                    <View key={i} style={s.successStep}>
                                        <View style={s.successStepIcon}>
                                            <Feather name={item.icon} size={15} color="#6366F1" />
                                        </View>
                                        <Text style={s.successStepText}>{item.text}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.88}>
                                <LinearGradient
                                    colors={['#6366F1', '#7C3AED']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={s.ctaGrad}
                                >
                                    <Text style={s.ctaText}>Back to Sign In</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={s.resendRow} onPress={() => { setSent(false); setEmail(''); }}>
                                <Text style={s.resendText}>Didn't receive it? </Text>
                                <Text style={s.resendLink}>Resend email</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },

    hero: { paddingHorizontal: 24, paddingBottom: 32 },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    heroIconWrap: { marginBottom: 18 },
    heroIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
    heroTitle: { fontSize: 28, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', marginBottom: 8 },
    heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontFamily: theme.typography.fontFamily.medium, lineHeight: 22 },

    formScroll: { padding: 24, paddingBottom: 48 },

    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#475569', marginBottom: 8 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 52 },
    fieldInput: { flex: 1, fontSize: 15, color: '#0F172A', fontFamily: theme.typography.fontFamily.medium },

    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
    errorText: { fontSize: 13, color: '#DC2626', fontFamily: theme.typography.fontFamily.medium, flex: 1 },

    ctaBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        ...Platform.select({
            web: { boxShadow: '0 6px 12px rgba(99,102,241,0.3)' },
            default: {
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            }
        }),
        elevation: 6
    },
    ctaGrad: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    ctaText: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    backToLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    backToLoginText: { fontSize: 14, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },

    successCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    successCardTitle: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
    successStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    successStepIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    successStepText: { flex: 1, fontSize: 14, color: '#334155', fontFamily: theme.typography.fontFamily.medium, lineHeight: 20 },

    resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
    resendText: { fontSize: 14, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    resendLink: { fontSize: 14, color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
});
