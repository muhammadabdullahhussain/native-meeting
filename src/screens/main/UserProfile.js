import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function UserProfile({ route, navigation }) {
    // If no user is passed in route (e.g. testing), fallback to dummy
    const user = route.params?.user || {
        name: 'Unknown User',
        username: '@unknown',
        city: 'Unknown City',
        bio: 'No bio available.',
        interests: [],
        avatar: 'https://i.pravatar.cc/150?img=1',
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.safeContainer}>
            <View style={[styles.customHeader, { paddingTop: insets.top + theme.spacing.md }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{user.username || 'Profile'}</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        {user.isOnline && <View style={styles.onlineIndicator} />}
                    </View>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.username}>{user.username}</Text>

                    <View style={styles.locationContainer}>
                        <Feather name="map-pin" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.locationText}>{user.city}</Text>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.primaryButton}>
                            <Feather name="user-plus" size={18} color={theme.colors.surface} />
                            <Text style={styles.primaryButtonText}>Connect</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('ChatRoom', { user })}
                        >
                            <Feather name="message-circle" size={18} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.bio}>{user.bio}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Interests</Text>
                    <View style={styles.interestsContainer}>
                        {user.interests && user.interests.map((interest, index) => (
                            <View key={index} style={styles.interestChip}>
                                <Text style={styles.interestText}>{interest}</Text>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        paddingRight: theme.spacing.md,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    container: {
        flex: 1,
        backgroundColor: theme.colors.background, // Used off-white background to separate sections
    },
    content: {
        paddingBottom: theme.spacing.xxl,
    },
    header: {
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: theme.colors.surface,
        ...theme.shadows.small,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: theme.spacing.sm,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.success,
        borderWidth: 3,
        borderColor: theme.colors.surface,
    },
    name: {
        fontSize: theme.typography.sizes.h2,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: 2,
    },
    username: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.primary,
        marginBottom: theme.spacing.sm,
        fontFamily: theme.typography.fontFamily.medium,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    locationText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textMuted,
        marginLeft: 6,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: theme.spacing.lg,
        justifyContent: 'center',
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.round, // Modern fully rounded buttons
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
        ...theme.shadows.medium,
    },
    primaryButtonText: {
        color: theme.colors.surface,
        marginLeft: theme.spacing.sm,
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: theme.typography.sizes.body,
    },
    secondaryButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.small,
    },
    section: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        marginTop: theme.spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.title,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    bio: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text,
        lineHeight: 24,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    interestChip: {
        backgroundColor: theme.colors.primaryLight + '15',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.round,
        borderWidth: 1,
        borderColor: theme.colors.primaryLight + '50',
    },
    interestText: {
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.sizes.caption,
    }
});
