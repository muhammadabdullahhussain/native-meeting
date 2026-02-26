import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';

const DUMMY_NOTIFICATIONS = [
    {
        id: '1', type: 'message_request',
        avatar: 'https://i.pravatar.cc/150?img=12', name: 'Alex Johnson',
        message: 'sent you a message request: "Hey! Would love to chat about your work in Tech 🚀"',
        time: '2 min ago', isRead: false,
    },
    {
        id: '2', type: 'message_request',
        avatar: 'https://i.pravatar.cc/150?img=20', name: 'Maria Garcia',
        message: 'sent you a message request: "Love your photography! Care to collaborate? 📸"',
        time: '15 min ago', isRead: false,
    },
    {
        id: '3', type: 'group_request',
        avatar: 'https://i.pravatar.cc/150?img=33', name: 'David Kim',
        message: 'wants to join your group "Coffee & Conversations ☕"',
        time: '1 hour ago', isRead: false,
    },
    {
        id: '4', type: 'group_accepted',
        avatar: 'https://i.pravatar.cc/150?img=47', name: 'Tech Founders Hub 🚀',
        message: 'Your request to join was accepted! Start connecting with members.',
        time: '2 hours ago', isRead: true,
    },
    {
        id: '5', type: 'interest',
        avatar: 'https://i.pravatar.cc/150?img=55', name: 'Sophia Lee',
        message: 'is nearby and shares your interest in Design and Photography 📸',
        time: '3 hours ago', isRead: true,
    },
    {
        id: '6', type: 'message_request',
        avatar: 'https://i.pravatar.cc/150?img=60', name: 'Emma Wilson',
        message: 'sent you a message request: "Saw you like hiking — any trail recommendations around SF?"',
        time: 'Yesterday', isRead: true,
    },
    {
        id: '7', type: 'nearby',
        avatar: 'https://i.pravatar.cc/150?img=28', name: 'Liam Patel',
        message: 'is only 0.8 km away and shares 4 interests with you!',
        time: 'Yesterday', isRead: true,
    },
];

const getNotificationIcon = (type) => {
    switch (type) {
        case 'message_request': return { name: 'send', bg: '#EEF2FF', color: '#6366F1' };
        case 'group_request': return { name: 'users', bg: '#FEF3C7', color: '#D97706' };
        case 'group_accepted': return { name: 'check-circle', bg: '#F0FDF4', color: '#22C55E' };
        case 'connected': return { name: 'message-circle', bg: '#F0FDF4', color: '#22C55E' };
        case 'interest': return { name: 'zap', bg: '#EEF2FF', color: '#6366F1' };
        case 'nearby': return { name: 'map-pin', bg: '#FDF4FF', color: '#A855F7' };
        case 'message': return { name: 'message-square', bg: '#EDE9FE', color: '#7C3AED' };
        default: return { name: 'bell', bg: '#F1F5F9', color: '#64748B' };
    }
};

export default function Notifications({ navigation }) {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
    const [selectedTab, setSelectedTab] = useState('All');

    const tabs = ['All', 'Requests', 'Activity', 'Messages'];

    const filteredNotifications = notifications.filter(n => {
        if (selectedTab === 'All') return true;
        if (selectedTab === 'Requests') return n.type === 'message_request' || n.type === 'group_request';
        if (selectedTab === 'Activity') return n.type === 'interest' || n.type === 'nearby';
        if (selectedTab === 'Messages') return n.type === 'message' || n.type === 'group_accepted' || n.type === 'connected';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const markRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const acceptRequest = (id, name) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, type: 'connected', message: 'accepted your request! You can now chat.', isRead: true } : n
        ));
        showToast('Accepted! ✅', `You are now connected with ${name}.`, 'success');
    };

    const declineRequest = (id, name) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const acceptGroupRequest = (id, name) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, type: 'group_accepted', message: `accepted ${name}'s join request.`, isRead: true } : n
        ));
    };

    const declineGroupRequest = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const renderNotification = ({ item }) => {
        const icon = getNotificationIcon(item.type);
        const isActionable = item.type === 'message_request' && item.isRead === false;
        const isGroupRequest = item.type === 'group_request';
        return (
            <TouchableOpacity
                style={[styles.notifCard, !item.isRead && styles.unreadCard]}
                onPress={() => markRead(item.id)}
                activeOpacity={0.8}
            >
                <View style={styles.notifLeft}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                        <View style={[styles.iconBadge, { backgroundColor: icon.bg }]}>
                            <Feather name={icon.name} size={11} color={icon.color} />
                        </View>
                    </View>
                </View>
                <View style={styles.notifBody}>
                    <Text style={styles.notifName}>{item.name} <Text style={styles.notifMessage}>{item.message}</Text></Text>
                    <Text style={styles.notifTime}>{item.time}</Text>

                    {/* Message Request actions */}
                    {isActionable && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.declineAction} onPress={() => declineRequest(item.id, item.name)} activeOpacity={0.8}>
                                <Text style={styles.declineActionText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptAction} onPress={() => acceptRequest(item.id, item.name)} activeOpacity={0.85}>
                                <Text style={styles.acceptActionText}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Group Join Request actions */}
                    {isGroupRequest && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.declineAction} onPress={() => declineGroupRequest(item.id)} activeOpacity={0.8}>
                                <Text style={styles.declineActionText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptAction} onPress={() => acceptGroupRequest(item.id, item.name)} activeOpacity={0.85}>
                                <Text style={styles.acceptActionText}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* DARK GRADIENT HEADER */}
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[styles.header, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        {unreadCount > 0 && (
                            <Text style={styles.headerSubtitle}>{unreadCount} new updates</Text>
                        )}
                    </View>
                    {unreadCount > 0 && (
                        <TouchableOpacity onPress={markAllRead} style={styles.markAllButton}>
                            <Feather name="check-circle" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.markAllText}>Mark all read</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View style={styles.tabsRow}>
                    {tabs.map(tab => {
                        const count = tab === 'Requests'
                            ? notifications.filter(n => !n.isRead && (n.type === 'message_request' || n.type === 'group_request')).length
                            : 0;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, selectedTab === tab && styles.activeTab]}
                                onPress={() => setSelectedTab(tab)}
                            >
                                <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
                                {count > 0 && (
                                    <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{count}</Text></View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>

            {/* List */}
            <FlatList
                data={filteredNotifications}
                keyExtractor={item => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Feather name="bell-off" size={40} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>All caught up!</Text>
                        <Text style={styles.emptySubtitle}>No notifications in this category yet.</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: theme.typography.fontFamily.medium,
        marginTop: 2,
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    markAllText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontFamily: theme.typography.fontFamily.bold,
    },
    tabsRow: {
        flexDirection: 'row',
        gap: 4,
        paddingBottom: 0,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 2.5,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#FFF',
    },
    tabText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.medium,
        color: 'rgba(255,255,255,0.5)',
    },
    activeTabText: {
        color: '#FFF',
        fontFamily: theme.typography.fontFamily.bold,
    },
    tabBadge: { width: 17, height: 17, borderRadius: 8.5, backgroundColor: '#FACC15', justifyContent: 'center', alignItems: 'center' },
    tabBadgeText: { fontSize: 9, color: '#0F172A', fontFamily: theme.typography.fontFamily.bold },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    unreadCard: {
        backgroundColor: '#F8FBFF',
        borderColor: '#DBEAFE',
    },
    notifLeft: {
        marginRight: 14,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#E2E8F0',
    },
    iconBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    notifBody: {
        flex: 1,
    },
    notifName: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        lineHeight: 20,
        marginBottom: 4,
    },
    notifMessage: {
        fontFamily: theme.typography.fontFamily.medium,
        color: '#64748B',
    },
    notifTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: theme.typography.fontFamily.medium,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginLeft: 10,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyIcon: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: theme.typography.fontFamily.medium,
        textAlign: 'center',
    },

    // ACTION BUTTONS (Accept / Decline)
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    declineAction: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
    declineActionText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#64748B' },
    acceptAction: { flex: 2, paddingVertical: 9, borderRadius: 12, backgroundColor: '#6366F1', alignItems: 'center' },
    acceptActionText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
});
