import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';

const SkeletonCard = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.card, { opacity }]}>
            <View style={styles.avatar} />
            <View style={styles.content}>
                <View style={styles.title} />
                <View style={styles.message} />
                <View style={styles.time} />
            </View>
        </Animated.View>
    );
};

export const NotificationSkeleton = () => {
    return (
        <View style={{ padding: 16 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#E2E8F0',
        marginRight: 14,
    },
    content: {
        flex: 1,
        gap: 6,
    },
    title: {
        width: '40%',
        height: 14,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    message: {
        width: '90%',
        height: 12,
        borderRadius: 4,
        backgroundColor: '#F1F5F9',
    },
    time: {
        width: '20%',
        height: 10,
        borderRadius: 4,
        backgroundColor: '#F1F5F9',
        marginTop: 4,
    },
});
