import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, UIManager, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const faqs = [
    {
        q: 'How does BondUs match me with others?',
        a: 'BondUs uses the preferences you set in Settings to show you nearby users who share similar interests. Ensure your profile is fully complete for the best experience.'
    },
    {
        q: 'How do I change my location radius?',
        a: 'Go to Settings -> Discovery Preferences. You can adjust the "Max Distance" slider to increase or decrease your search radius.'
    },
    {
        q: 'What are Group Passes?',
        a: 'Group Passes allow you to join premium groups for free. You earn a pass every time you invite 3 friends to the app.'
    },
    {
        q: 'How do I invite friends?',
        a: 'Go to Settings -> Invite Friends, or tap the crown icon in the Discover tab. Share your personal invite link via WhatsApp, SMS, or any other app.'
    },
    {
        q: 'I forgot my password. How do I reset it?',
        a: 'Log out of your account, then tap "Forgot Password" on the login screen. We will email you a link to securely reset it.'
    },
    {
        q: 'How do I delete my account?',
        a: 'Go to Settings -> Account Actions -> Delete Account. Please note that this action is irreversible and all your data will be permanently removed.'
    }
];

export default function HelpCenter({ navigation }) {
    const insets = useSafeAreaInsets();
    const [expanded, setExpanded] = useState(null);

    const toggleExpand = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(expanded === index ? null : index);
    };

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[s.header, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={s.headerNav}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Help & FAQ</Text>
                    <View style={{ width: 38 }} />
                </View>
                <Text style={s.headerSubTitle}>How can we help you today?</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.card}>
                    {faqs.map((item, idx) => {
                        const isExpanded = expanded === idx;
                        return (
                            <View key={idx}>
                                <TouchableOpacity
                                    style={[s.faqRow, isExpanded && s.faqRowExpanded]}
                                    onPress={() => toggleExpand(idx)}
                                    activeOpacity={0.7}
                                >
                                    <View style={s.faqTextContainer}>
                                        <Text style={[s.questionText, isExpanded && s.questionTextActive]}>{item.q}</Text>
                                    </View>
                                    <Feather
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color={isExpanded ? '#6366F1' : '#94A3B8'}
                                    />
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={s.answerContainer}>
                                        <Text style={s.answerText}>{item.a}</Text>
                                    </View>
                                )}

                                {idx < faqs.length - 1 && !isExpanded && <View style={s.divider} />}
                            </View>
                        );
                    })}
                </View>

                <TouchableOpacity style={s.contactBtn} activeOpacity={0.8}>
                    <Feather name="mail" size={20} color="#6366F1" />
                    <Text style={s.contactText}>Still need help? Contact Support</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 20, paddingBottom: 24 },
    headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    headerSubTitle: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

    scroll: { paddingHorizontal: 20, paddingTop: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },

    faqRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF' },
    faqTextContainer: { flex: 1, paddingRight: 12 },
    faqRowExpanded: { backgroundColor: '#F8FAFC' },
    questionText: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#0F172A', lineHeight: 22 },
    questionTextActive: { color: '#6366F1', fontFamily: theme.typography.fontFamily.bold },

    answerContainer: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#F8FAFC' },
    answerText: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#64748B', lineHeight: 22 },

    divider: { height: 1, backgroundColor: '#F1F5F9' },

    contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, backgroundColor: '#EEF2FF', borderRadius: 16, borderWidth: 1, borderColor: '#C7D2FE' },
    contactText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1' }
});
