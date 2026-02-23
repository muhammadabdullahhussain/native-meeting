import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

export default function Login({ navigation }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    // Animation specific
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        // Run animation on mount and when toggling login/signup
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, [isLogin]);

    const handleAuth = () => {
        setError('');

        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (!isLogin && !name.trim()) {
            setError('Full Name is required for signup.');
            return;
        }

        if (isLogin) {
            navigation.replace('MainApp');
        } else {
            navigation.navigate('ProfileSetup');
        }
    };

    return (
        <LinearGradient
            colors={['#E8F2FF', '#FFFFFF', '#FAFAFA']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.brandContainer}>
                            <LinearGradient
                                colors={[theme.colors.primary, '#00539F']}
                                style={styles.brandGradient}
                            >
                                <Feather name="layers" size={40} color={theme.colors.surface} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? 'Sign in to continue to Connect' : 'Join the most elite professional network'}
                        </Text>
                    </Animated.View>

                    <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {error ? (
                            <View style={styles.errorBox}>
                                <Feather name="alert-circle" size={16} color={theme.colors.error} style={{ marginRight: 6 }} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {!isLogin && (
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <View style={styles.inputContainer}>
                                    <Feather name="user" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        value={name}
                                        onChangeText={setName}
                                        placeholderTextColor={theme.colors.textMuted + '80'}
                                    />
                                </View>
                            </View>
                        )}

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="mail" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="name@example.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor={theme.colors.textMuted + '80'}
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="lock" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    placeholderTextColor={theme.colors.textMuted + '80'}
                                />
                            </View>
                        </View>

                        {isLogin && (
                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={handleAuth} activeOpacity={0.8} style={styles.buttonShadow}>
                            <LinearGradient
                                colors={[theme.colors.primary, '#00539F']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.primaryGradientBtn}
                            >
                                <Text style={styles.primaryButtonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                                <Feather name="arrow-right" size={20} color={theme.colors.surface} style={{ marginLeft: 8 }} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[styles.socialSection, { opacity: fadeAnim }]}>
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialButtons}>
                            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                                <Svg width="24" height="24" viewBox="0 0 48 48">
                                    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                    <Path fill="none" d="M0 0h48v48H0z" />
                                </Svg>
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                                <Svg width="24" height="24" viewBox="0 0 24 24">
                                    <Path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </Svg>
                                <Text style={styles.socialButtonText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {isLogin ? 'Don\'t have an account? ' : 'Already have an account? '}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={styles.footerLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxl,
        marginTop: Platform.OS === 'ios' ? 40 : theme.spacing.xl,
    },
    brandContainer: {
        marginBottom: theme.spacing.lg,
        ...theme.shadows.medium,
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    brandGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#1A1A1A',
        marginBottom: theme.spacing.xs,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textMuted,
        textAlign: 'center',
        maxWidth: '80%',
        lineHeight: 22,
    },
    formCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        ...theme.shadows.medium,
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error + '10',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: theme.typography.sizes.caption,
        fontFamily: theme.typography.fontFamily.medium,
    },
    inputWrapper: {
        marginBottom: theme.spacing.lg,
    },
    inputLabel: {
        fontSize: 13,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#4A4A4A',
        marginBottom: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        paddingHorizontal: theme.spacing.md,
        height: 56,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily.medium,
        height: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: theme.spacing.xl,
        marginTop: -theme.spacing.sm,
    },
    forgotPasswordText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.bold,
    },
    buttonShadow: {
        ...theme.shadows.medium,
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    primaryGradientBtn: {
        flexDirection: 'row',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: theme.colors.surface,
        fontSize: 18,
        fontFamily: theme.typography.fontFamily.bold,
        letterSpacing: 0.5,
    },
    socialSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.sm,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E9ECEF',
    },
    dividerText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        fontFamily: theme.typography.fontFamily.medium,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: theme.spacing.md,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: theme.spacing.md,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E9ECEF',
        ...theme.shadows.small,
        shadowOpacity: 0.05,
    },
    socialButtonText: {
        marginLeft: theme.spacing.sm,
        fontSize: 15,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#1A1A1A',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingVertical: theme.spacing.md,
    },
    footerText: {
        color: theme.colors.textMuted,
        fontSize: 15,
    },
    footerLink: {
        color: theme.colors.primary,
        fontSize: 15,
        fontFamily: theme.typography.fontFamily.bold,
    },
});
