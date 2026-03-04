import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';

const TypingIndicator = ({ dotColor = '#6366F1', dotSize = 6, spacing = 4, style }) => {
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animate = (anim, delay) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(anim, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.delay(400),
                ])
            );
        };

        const animation1 = animate(dot1, 0);
        const animation2 = animate(dot2, 200);
        const animation3 = animate(dot3, 400);

        animation1.start();
        animation2.start();
        animation3.start();

        return () => {
            animation1.stop();
            animation2.stop();
            animation3.stop();
        };
    }, [dot1, dot2, dot3]);

    const renderDot = (anim) => (
        <Animated.View
            style={[
                styles.dot,
                {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: dotColor,
                    marginHorizontal: spacing / 2,
                    opacity: anim,
                    transform: [{
                        scale: anim.interpolate({
                            inputRange: [0.3, 1],
                            outputRange: [0.8, 1.1]
                        })
                    }]
                }
            ]}
        />
    );

    return (
        <View style={[styles.container, style]}>
            {renderDot(dot1)}
            {renderDot(dot2)}
            {renderDot(dot3)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        backgroundColor: '#6366F1',
    },
});

export default TypingIndicator;
