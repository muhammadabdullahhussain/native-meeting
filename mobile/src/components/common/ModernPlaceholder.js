import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GRADIENTS = [
    ['#6366F1', '#A855F7'], // Indigo to Purple
    ['#3B82F6', '#2DD4BF'], // Blue to Teal
    ['#F59E0B', '#EF4444'], // Amber to Red
    ['#10B981', '#3B82F6'], // Emerald to Blue
    ['#EC4899', '#8B5CF6'], // Pink to Violet
];

export const ModernPlaceholder = ({ name, size = 50, style }) => {
    // Get initials
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    // Pick a gradient based on the name length or hash
    const gradIndex = name ? name.length % GRADIENTS.length : 0;
    const colors = GRADIENTS[gradIndex];

    const fontSize = size * 0.4;

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { borderRadius: size / 2 }]}
            >
                <Text style={[styles.text, { fontSize }]}>{initials}</Text>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    gradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
