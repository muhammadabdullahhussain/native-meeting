import React from 'react';
import {
    View, Text, StyleSheet, Modal,
    TouchableOpacity, Dimensions, ScrollView
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PremiumModal = ({ isVisible, onClose, onInvite, onUpgrade, type = 'generic' }) => {
    const benefits = [
        { icon: 'users', text: 'Create & Manage your own Groups', premium: true },
        { icon: 'message-circle', text: 'Unlimited active conversations', premium: true },
        { icon: 'zap', text: 'Custom interest tags', premium: true },
        { icon: 'shield', text: 'Premium Badge on profile', premium: true },
        { icon: 'map-pin', text: 'Unlimited Discovery radius', premium: true },
    ];

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

                <View style={styles.content}>
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC']}
                        style={styles.card}
                    >
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Feather name="x" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            {/* Header Icon */}
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={theme.gradients.premium}
                                    style={styles.iconCircle}
                                >
                                    <MaterialCommunityIcons name="crown" size={40} color="#FFF" />
                                </LinearGradient>
                            </View>

                            <Text style={styles.title}>
                                {type === 'limit' ? 'Limit Reached' : 'Go Premium'}
                            </Text>
                            <Text style={styles.subtitle}>
                                {type === 'limit'
                                    ? 'Upgrade to Premium for unlimited access or invite friends to earn a Group Pass.'
                                    : 'Unlock the full power of social discovery and build your own communities.'}
                            </Text>

                            {/* Benefits List */}
                            <View style={styles.benefitsContainer}>
                                {benefits.map((benefit, index) => (
                                    <View key={index} style={styles.benefitRow}>
                                        <View style={styles.benefitIconBox}>
                                            <Feather name={benefit.icon} size={16} color={theme.colors.primary} />
                                        </View>
                                        <Text style={styles.benefitText}>{benefit.text}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Actions */}
                            <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={theme.gradients.premium}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.upgradeGrad}
                                >
                                    <Text style={styles.upgradeBtnText}>Upgrade for $3.99/mo</Text>
                                    <Feather name="arrow-right" size={18} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.inviteBtn} onPress={onInvite} activeOpacity={0.7}>
                                <Text style={styles.inviteBtnText}>Invite 3 friends for 1 Group Pass</Text>
                            </TouchableOpacity>

                            <Text style={styles.footerNote}>Become part of our exclusive premium circle 🚀</Text>
                        </ScrollView>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    content: {
        width: SCREEN_WIDTH * 0.88,
        maxHeight: '80%',
        borderRadius: 32,
        overflow: 'hidden',
        ...theme.shadows.large,
    },
    card: {
        padding: 24,
        borderRadius: 32,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        alignItems: 'center',
        paddingTop: 12,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.premium,
    },
    title: {
        fontSize: 28,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: theme.colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    benefitsContainer: {
        width: '100%',
        marginBottom: 32,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    benefitIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    benefitText: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
        fontFamily: theme.typography.fontFamily.medium,
    },
    upgradeBtn: {
        width: '100%',
        height: 58,
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 16,
        ...theme.shadows.premium,
    },
    upgradeGrad: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    upgradeBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
    },
    inviteBtn: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    inviteBtnText: {
        color: theme.colors.text,
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.bold,
    },
    footerNote: {
        fontSize: 11,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.medium,
        opacity: 0.7,
    }
});

export default PremiumModal;
