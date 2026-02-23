import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../theme/theme';
import { Feather } from '@expo/vector-icons';

export default function Splash({ navigation }) {
    const scaleValue = useRef(new Animated.Value(0.5)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Parallel animation: scale up and fade in
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 1,
                tension: 10,
                friction: 2,
                useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();

        // Navigate to Auth stack after 2.5 seconds
        const timer = setTimeout(() => {
            // replace so user cannot go back to splash screen
            navigation.replace('Auth');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation, scaleValue, opacityValue]);

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.logoContainer,
                {
                    opacity: opacityValue,
                    transform: [{ scale: scaleValue }]
                }
            ]}>
                <View style={styles.iconCircle}>
                    <Feather name="users" size={60} color={theme.colors.surface} />
                </View>
                <Animated.Text style={[styles.title, { opacity: opacityValue }]}>
                    Meetup Demo
                </Animated.Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.sizes.h1,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.surface,
        letterSpacing: 1,
    },
});
