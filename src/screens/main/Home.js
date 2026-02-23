import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, Alert, Modal, TextInput, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { DUMMY_FEED } from '../../data/dummy';

const { width, height } = Dimensions.get('window');

export default function Home({ navigation }) {
    // Stateful dummy logic for premium interactivity
    const [feedData, setFeedData] = useState(
        DUMMY_FEED.map(post => ({
            ...post,
            hasLiked: false,
            hasSaved: false, // Added for bookmark toggle
        }))
    );

    const [isCommentModalVisible, setCommentModalVisible] = useState(false);
    const [isPostModalVisible, setPostModalVisible] = useState(false);
    const [isShareModalVisible, setShareModalVisible] = useState(false);
    const [currentPostText, setCurrentPostText] = useState('');
    const insets = useSafeAreaInsets();

    const handleLike = (postId) => {
        setFeedData(current =>
            current.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        hasLiked: !post.hasLiked,
                        likes: post.hasLiked ? post.likes - 1 : post.likes + 1
                    };
                }
                return post;
            })
        );
    };

    const handleSave = (postId) => {
        setFeedData(current =>
            current.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        hasSaved: !post.hasSaved
                    };
                }
                return post;
            })
        );
    };

    const handleShare = () => {
        setShareModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => navigation.navigate('UserProfile', { user: item.user })}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                        {item.user.isOnline && <View style={styles.onlineIndicator} />}
                    </View>
                    <View style={styles.userTextContainer}>
                        <Text style={styles.userName}>{item.user.name}</Text>
                        <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                    <Feather name="more-horizontal" size={22} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.actionRow}>
                    <View style={styles.leftActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleLike(item.id)}
                            activeOpacity={0.6}
                        >
                            <Feather
                                name={item.hasLiked ? "heart" : "heart"}
                                size={24}
                                color={item.hasLiked ? "#E02424" : theme.colors.text}
                                fill={item.hasLiked ? "#E02424" : "transparent"}
                            />
                            <Text style={[styles.actionText, item.hasLiked && styles.actionTextActive]}>{item.likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => setCommentModalVisible(true)}>
                            <Feather name="message-circle" size={24} color={theme.colors.text} />
                            <Text style={styles.actionText}>{item.comments}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                            <Feather name="send" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.bookmarkButton} onPress={() => handleSave(item.id)}>
                        <Feather
                            name={item.hasSaved ? "bookmark" : "bookmark"}
                            size={24}
                            color={item.hasSaved ? theme.colors.primary : theme.colors.text}
                            fill={item.hasSaved ? theme.colors.primary : "transparent"}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.captionContainer}>
                    <Text style={styles.captionText}>
                        <Text style={styles.captionUser}>{item.user.name}</Text> {item.details}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
                <Text style={styles.headerTitle}>Connect</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                        <Feather name="bell" size={24} color={theme.colors.text} />
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={feedData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.feed}
                showsVerticalScrollIndicator={false}
            />

            {/* Floating Action Button for Create Post */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => setPostModalVisible(true)}
            >
                <Feather name="plus" size={28} color={theme.colors.surface} />
            </TouchableOpacity>

            {/* Create Post Modal */}
            <Modal visible={isPostModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>New Post</Text>
                        <TouchableOpacity onPress={() => {
                            setPostModalVisible(false);
                            setCurrentPostText('');
                            Alert.alert("Success", "Post created successfully!");
                        }}>
                            <Text style={styles.saveText}>Share</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.postInputWrapper}>
                        <Image source={{ uri: 'https://i.pravatar.cc/150?img=5' }} style={styles.modalAvatar} />
                        <TextInput
                            style={styles.postTextInput}
                            placeholder="What's on your mind?"
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                            autoFocus
                            value={currentPostText}
                            onChangeText={setCurrentPostText}
                        />
                    </View>
                    <View style={styles.addMediaRow}>
                        <TouchableOpacity style={styles.mediaButton}>
                            <Feather name="image" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mediaButton}>
                            <Feather name="video" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mediaButton}>
                            <Feather name="map-pin" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Comments Modal (Bottom Sheet Simulator) */}
            <Modal
                visible={isCommentModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCommentModalVisible(false)}
            >
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity
                        style={styles.overlayDismiss}
                        activeOpacity={1}
                        onPress={() => setCommentModalVisible(false)}
                    />
                    <View style={styles.bottomSheetContainer}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.modalHeaderFixed}>
                            <View style={{ width: 40 }} />
                            <Text style={styles.commentsTitle}>Comments</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setCommentModalVisible(false)}>
                                <Feather name="x" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                            <View style={styles.dummyComment}>
                                <Image source={{ uri: 'https://i.pravatar.cc/150?img=12' }} style={styles.commentAvatar} />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUsername}>Alex Rivera</Text>
                                    <Text style={styles.commentText}>This looks amazing! Where is this located?</Text>
                                    <View style={styles.commentActions}>
                                        <Text style={styles.commentTime}>2h</Text>
                                        <TouchableOpacity><Text style={styles.commentActionText}>Reply</Text></TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.dummyComment}>
                                <Image source={{ uri: 'https://i.pravatar.cc/150?img=33' }} style={styles.commentAvatar} />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUsername}>Sarah Jenkins</Text>
                                    <Text style={styles.commentText}>Great shot! Let's connect next week.</Text>
                                    <View style={styles.commentActions}>
                                        <Text style={styles.commentTime}>4h</Text>
                                        <TouchableOpacity><Text style={styles.commentActionText}>Reply</Text></TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={[styles.addCommentInput, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 15 }]}>
                            <TextInput
                                style={styles.commentField}
                                placeholder="Add a comment..."
                                placeholderTextColor={theme.colors.textMuted}
                            />
                            <TouchableOpacity>
                                <Text style={styles.postCommentText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Custom Share Bottom Sheet */}
            <Modal
                visible={isShareModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShareModalVisible(false)}
            >
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity
                        style={styles.overlayDismiss}
                        activeOpacity={1}
                        onPress={() => setShareModalVisible(false)}
                    />
                    <View style={styles.shareSheetContainer}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.modalHeaderFixed}>
                            <View style={{ width: 40 }} />
                            <Text style={styles.shareTitle}>Share Post</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setShareModalVisible(false)}>
                                <Feather name="x" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.shareOptionsRow}>
                            <TouchableOpacity style={styles.shareOption} onPress={() => {
                                Alert.alert("Copied", "Post link copied to clipboard!");
                                setShareModalVisible(false);
                            }}>
                                <View style={[styles.shareIconContainer, { backgroundColor: '#E3F2FD' }]}>
                                    <Feather name="link" size={24} color={theme.colors.primary} />
                                </View>
                                <Text style={styles.shareOptionText}>Copy Link</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shareOption} onPress={() => {
                                Alert.alert("Saved", "Post saved to collections successfully!");
                                setShareModalVisible(false);
                            }}>
                                <View style={[styles.shareIconContainer, { backgroundColor: '#FFF9C4' }]}>
                                    <Feather name="bookmark" size={24} color="#FBC02D" />
                                </View>
                                <Text style={styles.shareOptionText}>Save</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shareOption}>
                                <View style={[styles.shareIconContainer, { backgroundColor: '#E8F5E9' }]}>
                                    <Feather name="message-circle" size={24} color="#2E7D32" />
                                </View>
                                <Text style={styles.shareOptionText}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shareOption}>
                                <View style={[styles.shareIconContainer, { backgroundColor: '#FCE4EC' }]}>
                                    <Feather name="instagram" size={24} color="#C2185B" />
                                </View>
                                <Text style={styles.shareOptionText}>Instagram</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.h1,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary, // Premium branding
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.secondary,
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    feed: {
        paddingBottom: 100, // Room for FAB
    },
    card: {
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
        borderRadius: 20,
        marginHorizontal: theme.spacing.sm,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.success,
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    userTextContainer: {
        marginLeft: theme.spacing.sm,
    },
    userName: {
        fontSize: 15,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    timeText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.medium,
    },
    moreButton: {
        padding: theme.spacing.xs,
    },
    imageContainer: {
        width: '100%',
        paddingHorizontal: theme.spacing.sm,
    },
    postImage: {
        width: '100%',
        height: width * 1.1,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
    },
    cardFooter: {
        padding: theme.spacing.md,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    leftActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    actionTextActive: {
        color: '#E02424',
    },
    captionContainer: {
        marginTop: 4,
    },
    captionText: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily.regular,
    },
    captionUser: {
        fontFamily: theme.typography.fontFamily.bold,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
        elevation: 8,
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
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cancelText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    modalTitle: {
        fontSize: 17,
        fontFamily: theme.typography.fontFamily.bold,
    },
    saveText: {
        fontSize: 16,
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.bold,
    },
    postInputWrapper: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
    },
    modalAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: theme.spacing.md,
    },
    postTextInput: {
        flex: 1,
        fontSize: 17,
        color: theme.colors.text,
        minHeight: 120,
        paddingTop: 8,
    },
    addMediaRow: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingHorizontal: 20,
        backgroundColor: '#FAFCFF',
    },
    mediaButton: {
        marginRight: 25,
    },
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    overlayDismiss: {
        flex: 1,
    },
    bottomSheetContainer: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: height * 0.75,
        ...theme.shadows.large,
    },
    sheetHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    commentsTitle: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        textAlign: 'center',
        flex: 1,
    },
    commentsList: {
        flex: 1,
    },
    dummyComment: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    commentContent: {
        flex: 1,
        marginLeft: 12,
    },
    commentUsername: {
        fontSize: 13,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    commentText: {
        fontSize: 14,
        color: theme.colors.text,
        marginTop: 2,
        lineHeight: 18,
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 6,
        alignItems: 'center',
    },
    commentTime: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginRight: 15,
    },
    commentActionText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.bold,
    },
    addCommentInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: theme.colors.surface,
    },
    commentField: {
        flex: 1,
        height: 44,
        backgroundColor: '#F8FAFC',
        borderRadius: 22,
        paddingHorizontal: 15,
        fontSize: 15,
        marginRight: 12,
    },
    postCommentText: {
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: 15,
    },
    shareSheetContainer: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: 40,
    },
    shareTitle: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
        textAlign: 'center',
        flex: 1,
    },
    modalHeaderFixed: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareOptionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    shareOption: {
        alignItems: 'center',
        width: 80,
    },
    shareIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    shareOptionText: {
        fontSize: 12,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily.medium,
    }
});
