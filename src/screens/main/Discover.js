import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Modal, TextInput, Platform, LayoutAnimation, UIManager, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { DUMMY_USERS } from '../../data/dummy';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Discover({ navigation }) {
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [isFilterVisible, setFilterVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedExpertise, setSelectedExpertise] = useState(['Design', 'Coding']);
    const [distance, setDistance] = useState(15);
    const insets = useSafeAreaInsets();
    const [sliderWidth, setSliderWidth] = useState(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                if (sliderWidth > 0) {
                    // Use locationX which is relative to the sliderContainer
                    const relativeX = evt.nativeEvent.locationX;
                    const newDistance = Math.max(1, Math.min(50, Math.round((relativeX / sliderWidth) * 50)));
                    if (!isNaN(newDistance)) setDistance(newDistance);
                }
            },
            onPanResponderRelease: () => { },
        })
    ).current;

    const categories = ['All', 'Nearby', 'Trending', 'Startup', 'Design', 'Tech'];

    // Reactive Filtering Logic
    const filteredUsers = DUMMY_USERS.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' ||
            user.interests.includes(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const handleCategorySelect = (category) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedCategory(category);
    };

    const toggleExpertise = (tag) => {
        if (selectedExpertise.includes(tag)) {
            setSelectedExpertise(selectedExpertise.filter(t => t !== tag));
        } else {
            setSelectedExpertise([...selectedExpertise, tag]);
        }
    };

    const resetFilters = () => {
        setSelectedExpertise([]);
        setDistance(15);
        setSelectedCategory('All');
        setSearchQuery('');
    };

    const toggleConnect = (userId) => {
        if (connectedUsers.includes(userId)) {
            setConnectedUsers(connectedUsers.filter(id => id !== userId));
        } else {
            setConnectedUsers([...connectedUsers, userId]);
        }
    };

    const renderItem = ({ item }) => {
        const isConnected = connectedUsers.includes(item.id);

        return (
            <View style={styles.card}>
                <View style={styles.cardImageContainer}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.cardGradient}
                    />
                    {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.locationContainer}>
                        <Feather name="map-pin" size={12} color={theme.colors.textMuted} />
                        <Text style={styles.city} numberOfLines={1}>{item.city}</Text>
                    </View>

                    <View style={styles.interestsContainer}>
                        {item.interests.slice(0, 2).map((interest, index) => (
                            <View key={index} style={styles.interestBadge}>
                                <Text style={styles.interestText}>{interest}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => toggleConnect(item.id)}
                        style={styles.connectButtonContainer}
                    >
                        <LinearGradient
                            colors={isConnected ? ['#f0f0f0', '#e0e0e0'] : [theme.colors.primary, theme.colors.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.connectButtonGradient}
                        >
                            <Feather
                                name={isConnected ? "check" : "user-plus"}
                                size={14}
                                color={isConnected ? theme.colors.primary : theme.colors.surface}
                            />
                            <Text style={[styles.connectButtonText, isConnected && styles.connectedButtonText]}>
                                {isConnected ? 'Connected' : 'Connect'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const CategoryItem = ({ label }) => (
        <TouchableOpacity
            style={[styles.categoryCard, selectedCategory === label && styles.selectedCategoryCard]}
            onPress={() => handleCategorySelect(label)}
        >
            <Text style={[styles.categoryText, selectedCategory === label && styles.selectedCategoryText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Premium Header */}
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}
            >
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Discover</Text>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setFilterVisible(true)}
                    >
                        <Feather name="sliders" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Feather name="search" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search for inspiring people..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={theme.colors.textMuted}
                    />
                </View>
            </LinearGradient>

            <View style={styles.mainContent}>
                <View style={styles.categoryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                        {categories.map((cat) => (
                            <CategoryItem key={cat} label={cat} />
                        ))}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Feather name="users" size={48} color={theme.colors.border} />
                            <Text style={styles.emptyText}>No users found matching your search.</Text>
                        </View>
                    }
                />
            </View>

            {/* Premium Filter Modal */}
            <Modal
                visible={isFilterVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalIndicator} />

                        <View style={styles.modalHeader}>
                            <View style={{ width: 24 }} />
                            <Text style={styles.modalTitle}>Filter Users</Text>
                            <TouchableOpacity onPress={() => setFilterVisible(false)} style={styles.closeModalButton}>
                                <Feather name="x" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.filterSection}>
                            <View style={styles.filterSectionHeader}>
                                <Text style={styles.filterLabel}>Distance Range</Text>
                                <Text style={styles.filterValueText}>Within {distance}km</Text>
                            </View>
                            <View
                                style={styles.sliderContainer}
                                onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                                {...panResponder.panHandlers}
                            >
                                <View style={styles.sliderTrack} />
                                <LinearGradient
                                    colors={[theme.colors.primary, theme.colors.primaryLight]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.sliderActiveTrack, { width: `${(distance / 50) * 100}%` }]}
                                />
                                <View
                                    style={[styles.sliderThumb, { left: `${(distance / 50) * 100}%` }]}
                                />
                                <View style={styles.sliderLabels}>
                                    <Text style={styles.sliderBoundaryText}>1km</Text>
                                    <View style={[styles.sliderTooltip, { left: `${(distance / 50) * 100 - 10}%` }]}>
                                        <Text style={styles.sliderTooltipText}>{distance}km</Text>
                                    </View>
                                    <Text style={styles.sliderBoundaryText}>50km</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Expertise</Text>
                            <View style={styles.filterChips}>
                                {['Design', 'Coding', 'Marketing', 'Business', 'Music'].map(tag => {
                                    const isSelected = selectedExpertise.includes(tag);
                                    return (
                                        <TouchableOpacity
                                            key={tag}
                                            style={[styles.chip, isSelected && styles.selectedChip]}
                                            onPress={() => toggleExpertise(tag)}
                                        >
                                            {isSelected && <Feather name="check" size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />}
                                            <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>{tag}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setFilterVisible(false)}
                        >
                            <LinearGradient
                                colors={[theme.colors.primary, '#0055A5']}
                                style={styles.applyButtonGradient}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={resetFilters}
                        >
                            <Text style={styles.resetButtonText}>Reset all</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadows.medium,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 15,
        paddingHorizontal: theme.spacing.md,
        height: 48,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily.medium,
    },
    mainContent: {
        flex: 1,
    },
    categoryContainer: {
        paddingVertical: theme.spacing.md,
    },
    categoryScroll: {
        paddingHorizontal: theme.spacing.lg,
    },
    categoryCard: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        marginRight: theme.spacing.sm,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    selectedCategoryCard: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    categoryText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.textMuted,
    },
    selectedCategoryText: {
        color: theme.colors.surface,
    },
    gridContent: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        ...theme.shadows.small,
    },
    cardImageContainer: {
        height: 120,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
    },
    onlineIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.success,
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    cardContent: {
        padding: 12,
    },
    name: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: 2,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    city: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.medium,
        marginLeft: 4,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 12,
        height: 24,
    },
    interestBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    interestText: {
        fontSize: 10,
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.bold,
    },
    connectButtonContainer: {
        width: '100%',
        height: 34,
        borderRadius: 10,
        overflow: 'hidden',
    },
    connectButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    connectButtonText: {
        color: theme.colors.surface,
        fontSize: 12,
        fontFamily: theme.typography.fontFamily.bold,
        marginLeft: 6,
    },
    connectedButtonText: {
        color: theme.colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: theme.spacing.lg,
    },
    modalIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        textAlign: 'center',
    },
    closeModalButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterSection: {
        marginBottom: 30,
    },
    filterSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    filterLabel: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    filterValueText: {
        fontSize: 15,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    sliderContainer: {
        height: 50,
        justifyContent: 'center',
        marginTop: 10,
    },
    sliderTrack: {
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
    },
    sliderActiveTrack: {
        position: 'absolute',
        height: 4,
        borderRadius: 2,
    },
    sliderThumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        ...theme.shadows.small,
        shadowOpacity: 0.1,
        marginLeft: -12, // Center thumb on position
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    sliderBoundaryText: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: theme.typography.fontFamily.medium,
    },
    sliderTooltip: {
        position: 'absolute',
        top: -45,
        left: '30%', // Dummy alignment
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        ...theme.shadows.small,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sliderTooltipText: {
        fontSize: 12,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    filterChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    selectedChip: {
        backgroundColor: '#E8F2FF',
        borderColor: theme.colors.primary,
    },
    chipText: {
        fontSize: 14,
        color: '#64748B',
        fontFamily: theme.typography.fontFamily.medium,
    },
    selectedChipText: {
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.bold,
    },
    applyButton: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 10,
        ...theme.shadows.medium,
    },
    applyButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonText: {
        color: theme.colors.surface,
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
    },
    resetButton: {
        marginTop: 20,
        alignSelf: 'center',
    },
    resetButtonText: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: theme.typography.fontFamily.medium,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.medium,
        marginTop: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
    }
});
