import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';

const PremiumBadge = ({ size = 20, style }) => {
    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={theme.gradients.premium}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}
            >
                <MaterialCommunityIcons
                    name="crown"
                    size={size * 0.7}
                    color="#FFF"
                />
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 2,
        backgroundColor: theme.colors.surface,
        borderRadius: 99,
        ...theme.shadows.small,
    },
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default PremiumBadge;
