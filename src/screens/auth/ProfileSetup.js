import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';

const AVAILABLE_INTERESTS = [
    'Tech', 'Music', 'Travel', 'Art', 'Fitness',
    'Startups', 'Coffee', 'Hiking', 'Food', 'Design',
    'Photography', 'Gaming'
];

export default function ProfileSetup({ navigation }) {
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [name, setName] = useState('');
    const [city, setCity] = useState('');

    const toggleInterest = (interest) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    return (
        <LinearGradient
            colors={['#E8F2FF', '#FFFFFF', '#FAFAFA']}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Setup Profile</Text>
                            <Text style={styles.subtitle}>Let's make your profile stand out</Text>
                        </View>

                        <View style={styles.imagePickerContainer}>
                            <TouchableOpacity style={styles.imagePicker} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={['#E8F2FF', '#FFFFFF']}
                                    style={styles.imagePickerGradient}
                                >
                                    <View style={styles.cameraIconContainer}>
                                        <Feather name="camera" size={24} color={theme.colors.surface} />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formCard}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <View style={styles.inputContainer}>
                                    <Feather name="user" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Jane Doe"
                                        value={name}
                                        onChangeText={setName}
                                        placeholderTextColor={theme.colors.textMuted + '80'}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>City or Location</Text>
                                <View style={styles.inputContainer}>
                                    <Feather name="map-pin" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. New York, NY"
                                        value={city}
                                        onChangeText={setCity}
                                        placeholderTextColor={theme.colors.textMuted + '80'}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.inputLabel, { marginTop: theme.spacing.sm }]}>Interests (Select at least 3)</Text>
                            <View style={styles.interestsContainer}>
                                {AVAILABLE_INTERESTS.map(interest => {
                                    const isSelected = selectedInterests.includes(interest);
                                    return (
                                        <TouchableOpacity
                                            key={interest}
                                            style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                                            onPress={() => toggleInterest(interest)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                                                {interest}
                                            </Text>
                                            {isSelected && <Feather name="check" size={14} color={theme.colors.surface} style={{ marginLeft: 4 }} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.buttonShadow,
                                    (selectedInterests.length < 3 || !name) && styles.primaryButtonDisabled
                                ]}
                                onPress={() => navigation.replace('MainApp')}
                                disabled={selectedInterests.length < 3 || !name}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={selectedInterests.length < 3 || !name ? ['#E9ECEF', '#E9ECEF'] : [theme.colors.primary, '#00539F']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.primaryGradientBtn}
                                >
                                    <Text style={[
                                        styles.primaryButtonText,
                                        (selectedInterests.length < 3 || !name) && { color: theme.colors.textMuted }
                                    ]}>
                                        Complete Setup
                                    </Text>
                                    <Feather
                                        name="arrow-right"
                                        size={20}
                                        color={(selectedInterests.length < 3 || !name) ? theme.colors.textMuted : theme.colors.surface}
                                        style={{ marginLeft: 8 }}
                                    />
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
    content: {
        padding: theme.spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 20 : theme.spacing.xl,
        paddingBottom: 40,
    },
    header: {
        marginBottom: theme.spacing.xl,
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
        fontSize: 16,
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    imagePickerContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        ...theme.shadows.medium,
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    imagePicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: '#E8F2FF',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    imagePickerGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
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
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text,
        height: '100%',
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    interestChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        marginBottom: theme.spacing.xs,
    },
    interestChipSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        ...theme.shadows.small,
    },
    interestText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.medium,
        color: '#4A4A4A',
    },
    interestTextSelected: {
        color: theme.colors.surface,
        fontFamily: theme.typography.fontFamily.bold,
    },
    buttonShadow: {
        ...theme.shadows.medium,
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        marginTop: theme.spacing.md,
    },
    primaryButtonDisabled: {
        shadowOpacity: 0,
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
