import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { DUMMY_CHATS, DUMMY_USERS } from '../../data/dummy';

export default function ChatList({ navigation }) {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isNewChatModalVisible, setNewChatModalVisible] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    const filteredChats = DUMMY_CHATS.filter(chat =>
        chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = DUMMY_USERS.filter(user =>
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const renderChatItem = ({ item }) => {
        const isUnread = item.unreadCount > 0;
        return (
            <TouchableOpacity
                style={[styles.chatCard, isUnread && styles.chatCardUnread]}
                onPress={() => navigation.navigate('ChatRoom', { user: item.user, chatData: item })}
                onLongPress={() => { }} // Placeholder for long press menu
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                    {item.user.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.userName, isUnread && styles.userNameUnread]} numberOfLines={1}>
                            {item.user.name}
                        </Text>
                        <Text style={[styles.timeText, isUnread && styles.timeTextUnread]}>
                            {item.timestamp}
                        </Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text
                            style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                            numberOfLines={1}
                        >
                            {item.lastMessage}
                        </Text>
                        {isUnread && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Feather name="message-square" size={48} color={theme.colors.border} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Start a conversation with someone nearby!</Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setNewChatModalVisible(true)}
            >
                <Text style={styles.emptyButtonText}>Start Chat</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
                <View>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <Text style={styles.headerSubtitle}>Your conversations</Text>
                </View>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setNewChatModalVisible(true)}
                >
                    <Feather name="plus" size={24} color={theme.colors.surface} />
                </TouchableOpacity>
            </View>

            <View style={[styles.searchWrapper, isSearchFocused && styles.searchWrapperFocused]}>
                <Feather name="search" size={20} color={isSearchFocused ? theme.colors.primary : theme.colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search messages..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Feather name="x-circle" size={18} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredChats}
                keyExtractor={item => item.id}
                renderItem={renderChatItem}
                contentContainerStyle={[styles.listContent, filteredChats.length === 0 && { flex: 1 }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={EmptyState}
            />

            {/* New Chat Modal */}
            <Modal
                visible={isNewChatModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setNewChatModalVisible(false)}
            >
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setNewChatModalVisible(false)}>
                            <Feather name="chevron-down" size={28} color={theme.colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>New Message</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.modalSearchContainer}>
                        <Feather name="search" size={20} color={theme.colors.textMuted} />
                        <TextInput
                            style={styles.modalSearchInput}
                            placeholder="To: Search name or @username"
                            placeholderTextColor={theme.colors.textMuted}
                            value={userSearchQuery}
                            onChangeText={setUserSearchQuery}
                            autoFocus
                        />
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>Suggested</Text>
                        {filteredUsers.map(user => (
                            <TouchableOpacity
                                key={user.id}
                                style={styles.userItem}
                                onPress={() => {
                                    setNewChatModalVisible(false);
                                    navigation.navigate('ChatRoom', { user });
                                }}
                            >
                                <View style={styles.avatarWrapper}>
                                    <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                                    {user.isOnline && <View style={styles.userOnlineIndicator} />}
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userItemName}>{user.name}</Text>
                                    <Text style={styles.userItemUsername}>{user.username}</Text>
                                </View>
                                <TouchableOpacity style={styles.chatNowButton}>
                                    <Text style={styles.chatNowText}>Chat</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Modern very light gray
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.medium,
        marginTop: -2,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.lg,
        marginVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        height: 52,
        borderRadius: 26, // Pill shape
        ...theme.shadows.small,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    searchWrapperFocused: {
        borderColor: theme.colors.primary,
        ...theme.shadows.medium,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: 16,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily.regular,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: 20,
    },
    chatCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        ...theme.shadows.small,
        alignItems: 'center',
    },
    chatCardUnread: {
        backgroundColor: '#F1F5FF', // Subtle blue for unread
        borderWidth: 1,
        borderColor: 'rgba(10, 102, 194, 0.1)',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: theme.colors.success,
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    chatInfo: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 17,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        flex: 1,
        marginRight: 8,
    },
    userNameUnread: {
        color: theme.colors.primary,
    },
    timeText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.medium,
    },
    timeTextUnread: {
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.bold,
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.textMuted,
        marginRight: 12,
    },
    lastMessageUnread: {
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily.bold,
    },
    badge: {
        backgroundColor: theme.colors.primary,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: theme.colors.surface,
        fontSize: 11,
        fontFamily: theme.typography.fontFamily.bold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
        fontSize: 15,
        color: theme.colors.textMuted,
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
        ...theme.shadows.medium,
    },
    emptyButtonText: {
        color: theme.colors.surface,
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: theme.colors.text,
    },
    modalContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.textMuted,
        paddingHorizontal: 20,
        paddingVertical: 15,
        textTransform: 'uppercase',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    avatarWrapper: {
        position: 'relative',
    },
    userAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    userOnlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.success,
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    userItemName: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    userItemUsername: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },
    chatNowButton: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chatNowText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.bold,
    }
});
