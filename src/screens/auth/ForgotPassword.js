import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

export default function ForgotPassword({ navigation }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleReset = () => {
        setError('');

        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        Alert.alert(
            "Check your email",
            "We've sent a password reset link to your email address.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
        );
    };

    return (
        <LinearGradient
            colors={['#E8F2FF', '#FFFFFF', '#FAFAFA']}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={styles.headerNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={'#1A1A1A'} />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <View style={styles.iconWrapper}>
                                <LinearGradient
                                    colors={[theme.colors.primary, '#00539F']}
                                    style={styles.iconGradient}
                                >
                                    <Feather name="key" size={36} color={theme.colors.surface} />
                                </LinearGradient>
                            </View>
                            <Text style={styles.title}>Reset Password</Text>
                            <Text style={styles.subtitle}>
                                Enter the email associated with your account and we'll send an email with instructions.
                            </Text>
                        </View>

                        <View style={styles.formCard}>
                            {error ? (
                                <View style={styles.errorBox}>
                                    <Feather name="alert-circle" size={16} color={theme.colors.error} style={{ marginRight: 6 }} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

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

                            <TouchableOpacity onPress={handleReset} activeOpacity={0.8} style={styles.buttonShadow}>
                                <LinearGradient
                                    colors={[theme.colors.primary, '#00539F']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.primaryGradientBtn}
                                >
                                    <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                                    <Feather name="send" size={20} color={theme.colors.surface} style={{ marginLeft: 8 }} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
        shadowOpacity: 0.1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxl,
        marginTop: theme.spacing.md,
    },
    iconWrapper: {
        marginBottom: theme.spacing.xl,
        ...theme.shadows.medium,
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    iconGradient: {
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
        marginBottom: theme.spacing.sm,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: theme.spacing.md,
    },
    formCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: theme.spacing.xl,
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
        marginBottom: theme.spacing.xl,
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
});
