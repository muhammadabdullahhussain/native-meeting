import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { DUMMY_NOTIFICATIONS } from '../../data/dummy';

export default function Notifications({ navigation }) {
    const [notifications, setNotifications] = useState(
        DUMMY_NOTIFICATIONS.map(n => ({ ...n, isRead: false }))
    );
    const insets = useSafeAreaInsets();

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const handlePress = (id) => {
        setNotifications(current =>
            current.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    };

    const getIconData = (type) => {
        switch (type) {
            case 'like':
                return { name: 'heart', color: theme.colors.secondary, bg: theme.colors.secondary + '20' };
            case 'match':
                return { name: 'star', color: '#F1C40F', bg: '#F1C40F20' };
            case 'message':
                return { name: 'message-circle', color: theme.colors.primary, bg: theme.colors.primary + '20' };
            default:
                return { name: 'bell', color: theme.colors.textMuted, bg: theme.colors.textMuted + '20' };
        }
    };

    const renderItem = ({ item }) => {
        const iconData = getIconData(item.type);

        return (
            <TouchableOpacity
                style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                onPress={() => handlePress(item.id)}
            >
                <View style={styles.leftContent}>
                    <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                    <View style={[styles.iconBadge, { backgroundColor: iconData.bg }]}>
                        <Feather name={iconData.name} size={12} color={iconData.color} />
                    </View>
                </View>

                <View style={styles.textContent}>
                    <Text style={styles.messageText}>
                        <Text style={styles.userName}>{item.user.name}</Text> {item.message}
                    </Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>

                {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="x" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                </View>
                <TouchableOpacity onPress={markAllRead}>
                    <Text style={styles.markReadText}>Mark all read</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: theme.spacing.md,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.h2,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    markReadText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.medium,
    },
    listContent: {
        paddingBottom: theme.spacing.xl,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    unreadItem: {
        backgroundColor: theme.colors.primaryLight + '10', // Extremely subtle tint for unread
    },
    leftContent: {
        position: 'relative',
        marginRight: theme.spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    iconBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    textContent: {
        flex: 1,
        paddingRight: theme.spacing.sm,
    },
    messageText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text,
        lineHeight: 20,
        marginBottom: 4,
    },
    userName: {
        fontFamily: theme.typography.fontFamily.bold,
    },
    timeText: {
        fontSize: theme.typography.sizes.small,
        color: theme.colors.textMuted,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginLeft: theme.spacing.sm,
    },
    separator: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginLeft: 76, // Align with text
    }
});
