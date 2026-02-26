import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export const Skeleton = ({ width, height, borderRadius = 8, style }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [layoutWidth, setLayoutWidth] = React.useState(0);

    useEffect(() => {
        // Only start animation if we have a known width (important for percentages)
        if (typeof width === 'number' || layoutWidth > 0) {
            const startAnimation = () => {
                animatedValue.setValue(0);
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.linear,
                    useNativeDriver: Platform.OS !== 'web',
                }).start(() => startAnimation());
            };
            startAnimation();
        }
    }, [animatedValue, width, layoutWidth]);

    const finalWidth = typeof width === 'number' ? width : layoutWidth;

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-finalWidth || -100, finalWidth || 100],
    });

    const onLayout = (event) => {
        if (typeof width === 'string') {
            setLayoutWidth(event.nativeEvent.layout.width);
        }
    };

    return (
        <View
            style={[styles.container, { width, height, borderRadius }, style]}
            onLayout={onLayout}
        >
            {(typeof width === 'number' || layoutWidth > 0) && (
                <AnimatedGradient
                    colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            transform: [{ translateX }],
                        },
                    ]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
    },
});
