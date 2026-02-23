import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, Alert, Modal, TextInput, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

// Reusable Image Grid for Instagram-style layout
const UserPostsGrid = ({ posts }) => {
    const itemWidth = (width - theme.spacing.lg * 2 - theme.spacing.xs * 2) / 3;
    return (
        <View style={styles.gridContainer}>
            {posts.map((img, index) => (
                <Image key={index} source={{ uri: img }} style={[styles.gridImage, { width: itemWidth, height: itemWidth }]} />
            ))}
        </View>
    );
};

export default function Profile({ navigation }) {
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isShareModalVisible, setShareModalVisible] = useState(false);

    // Real-time state for dummy user to show interactivity when edited
    const [user, setUser] = useState({
        name: 'Jane Doe',
        username: '@jane_doe',
        city: 'San Francisco, CA',
        bio: 'Product Designer & Coffee Enthusiast. Crafting digital experiences.',
        interests: ['Design', 'UI/UX', 'Photography', 'Travel'],
        avatar: 'https://i.pravatar.cc/150?img=5',
    });

    const [editForm, setEditForm] = useState({ name: user.name, bio: user.bio });

    const dummyPosts = [
        'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=400&q=80',
    ];

    const handleSaveProfile = () => {
        setUser({ ...user, name: editForm.name, bio: editForm.bio });
        setEditModalVisible(false);
    };

    const handleShare = () => {
        setShareModalVisible(true);
    };

    const insets = useSafeAreaInsets();
    const safeTop = Platform.OS === 'android' ? StatusBar.currentHeight : insets.top;

    return (
        <View style={styles.container}>
            {/* Elegant Solid Header ensuring absolutely no overlap */}
            <View style={[styles.headerBar, { paddingTop: safeTop }]}>
                <View style={styles.headerContentWrapper}>
                    <Text style={styles.headerUsername}>
                        {user.username}
                    </Text>
                    <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.navigate('Settings')}>
                        <Feather name="menu" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Profile Cover Banner */}
                <LinearGradient
                    colors={['#E8F2FF', '#FFFFFF']}
                    style={styles.coverBanner}
                />

                {/* Profile Info Top Section */}
                <View style={styles.profileTopContainer}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        <TouchableOpacity style={styles.addStoryButton}>
                            <Feather name="plus" size={16} color={theme.colors.surface} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statContainer}>
                            <Text style={styles.statNumber}>12</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statContainer}>
                            <Text style={styles.statNumber}>842</Text>
                            <Text style={styles.statLabel}>Connections</Text>
                        </View>
                        <View style={styles.statContainer}>
                            <Text style={styles.statNumber}>28</Text>
                            <Text style={styles.statLabel}>Events</Text>
                        </View>
                    </View>
                </View>

                {/* Bio Section */}
                <View style={styles.bioContainer}>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.bioText}>{user.bio}</Text>
                    <View style={styles.locationContainer}>
                        <Feather name="map-pin" size={12} color={theme.colors.textMuted} />
                        <Text style={styles.locationText}>{user.city}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.editProfileButton} onPress={() => setEditModalVisible(true)} activeOpacity={0.8}>
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
                        <Text style={styles.editProfileText}>Share Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Premium Interest Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestsScroll}>
                    {user.interests.map((interest, index) => (
                        <View key={index} style={styles.interestChip}>
                            <Text style={styles.interestText}>{interest}</Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.divider} />

                {/* Grid View */}
                <View style={styles.tabIcons}>
                    <Feather name="grid" size={24} color={theme.colors.text} />
                </View>

                <UserPostsGrid posts={dummyPosts} />

            </ScrollView>

            {/* Edit Profile Premium Modal */}
            <Modal visible={isEditModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TouchableOpacity onPress={handleSaveProfile} style={styles.saveButton}>
                            <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalForm}>
                        <View style={styles.editAvatarContainer}>
                            <Image source={{ uri: user.avatar }} style={styles.editAvatarImage} />
                            <TouchableOpacity style={styles.editAvatarBadge}>
                                <Feather name="camera" size={16} color={theme.colors.surface} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.modalLabel}>Full Name</Text>
                            <TextInput
                                style={styles.modalInputBox}
                                value={editForm.name}
                                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                                placeholder="Enter your full name"
                                placeholderTextColor={theme.colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.modalLabel}>Bio</Text>
                            <TextInput
                                style={[styles.modalInputBox, { height: 100, textAlignVertical: 'top' }]}
                                value={editForm.bio}
                                onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                                multiline
                                placeholder="Write a short bio about yourself..."
                                placeholderTextColor={theme.colors.textMuted}
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Custom Bottom Sheet for Share */}
            <Modal visible={isShareModalVisible} animationType="slide" transparent={true}>
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity style={styles.overlayDismiss} onPress={() => setShareModalVisible(false)} />
                    <View style={styles.shareSheetContainer}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.shareTitle}>Share Profile</Text>

                        <View style={styles.shareOptionsRow}>
                            <TouchableOpacity style={styles.shareOption} onPress={() => {
                                Alert.alert("Copied", "Profile link copied to clipboard!");
                                setShareModalVisible(false);
                            }}>
                                <View style={[styles.shareIconContainer, { backgroundColor: '#E3F2FD' }]}>
                                    <Feather name="link" size={24} color={theme.colors.primary} />
                                </View>
                                <Text style={styles.shareOptionText}>Copy Link</Text>
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

                            <TouchableOpacity style={styles.shareOption}>
                                <View style={[styles.shareIconContainer, { backgroundColor: '#F5F5F5' }]}>
                                    <Feather name="more-horizontal" size={24} color={theme.colors.text} />
                                </View>
                                <Text style={styles.shareOptionText}>More</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

//================================================================================
// STYLES
//================================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    headerBar: {
        backgroundColor: theme.colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        zIndex: 10,
    },
    headerContentWrapper: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    headerUsername: {
        fontSize: theme.typography.sizes.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    settingsIcon: {
        position: 'absolute',
        right: theme.spacing.lg,
    },
    coverBanner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120, // Reduced banner height to pull everything up
    },
    content: {
        paddingTop: 0,
        paddingBottom: theme.spacing.xxl,
    },
    profileTopContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 65, // Pulled up so avatar spans both banner and background
        marginBottom: theme.spacing.md,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: theme.spacing.xl,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: theme.colors.surface,
        ...theme.shadows.medium,
    },
    addStoryButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: theme.colors.surface,
        ...theme.shadows.small,
    },
    statsRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingRight: theme.spacing.md,
    },
    statContainer: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: theme.typography.sizes.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.text,
    },
    bioContainer: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.sm, // Pulled bio up closer to stats and avatar
        marginBottom: theme.spacing.lg,
    },
    name: {
        fontSize: theme.typography.sizes.title,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: 2,
    },
    bioText: {
        fontSize: theme.typography.sizes.body,
        lineHeight: 20,
        color: theme.colors.text,
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: theme.typography.sizes.small,
        color: theme.colors.textMuted,
        marginLeft: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    editProfileButton: {
        flex: 1,
        height: 40, // Taller, more clickable button
        borderRadius: theme.borderRadius.md, // Slightly less rounded for a mature look
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.small, // Soft elevation
    },
    shareButton: {
        flex: 1,
        height: 40,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.small,
    },
    editProfileText: {
        fontSize: theme.typography.sizes.caption,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    interestsScroll: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    interestChip: {
        paddingHorizontal: 18, // Slightly wider
        paddingVertical: 8,
        borderRadius: 24, // Pill shape
        backgroundColor: theme.colors.surface,
        ...theme.shadows.small, // Premium floating look
        marginHorizontal: 2, // Space for shadow
        marginBottom: 4,
    },
    interestText: {
        fontSize: theme.typography.sizes.small,
        fontFamily: theme.typography.fontFamily.bold, // Bolder text
        color: theme.colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.sm,
    },
    tabIcons: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.text,
        marginHorizontal: theme.spacing.lg,
        width: 60,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.xs,
        marginTop: theme.spacing.md,
    },
    gridImage: {
        borderRadius: theme.borderRadius.sm,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    cancelText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.medium,
    },
    modalTitle: {
        fontSize: theme.typography.sizes.title,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.surface,
        fontFamily: theme.typography.fontFamily.bold,
    },
    modalForm: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    editAvatarContainer: {
        alignSelf: 'center',
        marginBottom: theme.spacing.xl,
        position: 'relative',
    },
    editAvatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: theme.colors.surface,
        ...theme.shadows.small,
    },
    inputGroup: {
        marginBottom: theme.spacing.lg,
    },
    modalLabel: {
        fontSize: theme.typography.sizes.caption,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
        marginLeft: 4,
    },
    modalInputBox: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    },
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    overlayDismiss: {
        flex: 1,
    },
    shareSheetContainer: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: theme.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : theme.spacing.xl,
        ...theme.shadows.large,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: theme.spacing.lg,
    },
    shareTitle: {
        fontSize: theme.typography.sizes.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
    shareOptionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.sm,
    },
    shareOption: {
        alignItems: 'center',
    },
    shareIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    shareOptionText: {
        fontSize: theme.typography.sizes.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text,
    }
});
