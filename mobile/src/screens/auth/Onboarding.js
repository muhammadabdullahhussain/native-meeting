import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Dimensions, Animated, FlatList, StatusBar, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        emoji: '🌍',
        title: 'Meet People\nNearby',
        subtitle: 'Discover real people just around the corner who share your passions — not strangers online.',
        gradient: ['#0F172A', '#1D3461', '#6366F1'],
        accent: '#818CF8',
        features: ['Location-based discovery', 'See who\'s online now', 'Up to 25 km radius'],
    },
    {
        id: '2',
        emoji: '⚡',
        title: 'Connect Over\nShared Interests',
        subtitle: 'Choose from 200+ interests — from Chess to Startups, Coffee to Jazz. Your vibe finds your tribe.',
        gradient: ['#1E1B4B', '#312E81', '#7C3AED'],
        accent: '#A78BFA',
        features: ['200+ interests to choose from', 'Smart match scoring', 'Interest-based groups'],
    },
    {
        id: '3',
        emoji: '🔒',
        title: 'Safe &\nRespectful',
        subtitle: 'Messages need acceptance before becoming conversations. You control who enters your world.',
        gradient: ['#0C4A6E', '#075985', '#0EA5E9'],
        accent: '#7DD3FC',
        features: ['Message request system', 'Block & report users', '30-conversation limit (free)'],
    },
];

export default function Onboarding({ navigation }) {
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            const next = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
            setCurrentIndex(next);
        } else {
            navigation.replace('Login');
        }
    };

    const handleSkip = () => navigation.replace('Login');

    const renderSlide = ({ item, index }) => (
        <LinearGradient
            colors={item.gradient}
            style={s.slide}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
            {/* Skip */}
            {index < SLIDES.length - 1 && (
                <TouchableOpacity
                    style={[s.skipBtn, { top: insets.top + 12 }]}
                    onPress={handleSkip} activeOpacity={0.7}
                >
                    <Text style={s.skipText}>Skip</Text>
                    <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
            )}

            {/* Big emoji */}
            <View style={s.emojiWrap}>
                <View style={[s.emojiCircle, { borderColor: item.accent + '40' }]}>
                    <Text style={s.emoji}>{item.emoji}</Text>
                </View>
                {/* Decorative rings */}
                <View style={[s.ring, s.ring1, { borderColor: item.accent + '20' }]} />
                <View style={[s.ring, s.ring2, { borderColor: item.accent + '12' }]} />
            </View>

            {/* Text */}
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.subtitle}>{item.subtitle}</Text>

            {/* Feature pills */}
            <View style={s.featuresRow}>
                {item.features.map((f, i) => (
                    <View key={i} style={[s.featurePill, { borderColor: item.accent + '40', backgroundColor: item.accent + '15' }]}>
                        <Feather name="check" size={11} color={item.accent} />
                        <Text style={[s.featureText, { color: item.accent }]}>{f}</Text>
                    </View>
                ))}
            </View>
        </LinearGradient>
    );

    const slide = SLIDES[currentIndex];
    const isLast = currentIndex === SLIDES.length - 1;

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={item => item.id}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            />

            {/* BOTTOM BAR */}
            <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                {/* Dots */}
                <View style={s.dots}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
                        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
                        return (
                            <Animated.View
                                key={i}
                                style={[s.dot, { width: dotWidth, opacity, backgroundColor: i <= currentIndex ? '#6366F1' : '#CBD5E1' }]}
                            />
                        );
                    })}
                </View>

                {/* CTA */}
                <TouchableOpacity style={s.ctaBtn} onPress={handleNext} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#6366F1', '#7C3AED']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.ctaGrad}
                    >
                        <Text style={s.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
                        <Feather name={isLast ? 'arrow-right' : 'chevron-right'} size={18} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Already have account */}
                {isLast && (
                    <TouchableOpacity onPress={() => navigation.replace('Login')} style={s.loginLink} activeOpacity={0.7}>
                        <Text style={s.loginLinkText}>Already have an account? <Text style={s.loginLinkBold}>Log in</Text></Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0F172A' },

    slide: { width, height, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

    skipBtn: {
        position: 'absolute', right: 20,
        flexDirection: 'row', alignItems: 'center', gap: 2,
        paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    skipText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: theme.typography.fontFamily.medium },

    emojiWrap: { position: 'relative', marginBottom: 40, justifyContent: 'center', alignItems: 'center' },
    emojiCircle: { width: 130, height: 130, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
    emoji: { fontSize: 62 },
    ring: { position: 'absolute', borderRadius: 9999, borderWidth: 1.5 },
    ring1: { width: 170, height: 170 },
    ring2: { width: 215, height: 215 },

    title: { fontSize: 38, fontFamily: theme.typography.fontFamily.bold, color: '#FFF', textAlign: 'center', lineHeight: 46, marginBottom: 16 },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.65)', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', lineHeight: 24, marginBottom: 32 },

    featuresRow: { gap: 10, alignItems: 'flex-start', width: '100%' },
    featurePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1 },
    featureText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold },

    // BOTTOM
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 20, backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 16 },
    dot: { height: 8, borderRadius: 4 },

    ctaBtn: {
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 14,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0px 6px 14px rgba(99, 102, 241, 0.35)',
            }
        }),
    },
    ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56 },
    ctaText: { fontSize: 17, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },

    loginLink: { alignItems: 'center', paddingVertical: 8 },
    loginLinkText: { fontSize: 14, color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
    loginLinkBold: { color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },
});
