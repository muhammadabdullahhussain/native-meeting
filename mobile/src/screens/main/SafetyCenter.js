import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';

const SAFETY_TIPS = [
    {
        icon: 'users',
        title: 'Meeting in Public',
        desc: 'Always meet in a well-lit, public place for the first few times. Never meet at your home or their home.',
        color: '#EEF2FF',
        iconColor: '#6366F1'
    },
    {
        icon: 'share-2',
        title: 'Share Your Plans',
        desc: 'Tell a friend or family member who you are meeting, where you are going, and when you expect to be back.',
        color: '#F0FDF4',
        iconColor: '#22C55E'
    },
    {
        icon: 'phone',
        title: 'Stay in the App',
        desc: 'Keep your conversations on Weezy until you really get to know someone. It is safer for you and helps us protect you.',
        color: '#FFF7ED',
        iconColor: '#F97316'
    },
    {
        icon: 'shield',
        title: 'Report Harassment',
        desc: 'If someone makes you feel uncomfortable or unsafe, block and report them immediately. We take these reports very seriously.',
        color: '#FEF2F2',
        iconColor: '#EF4444'
    },
    {
        icon: 'eye-off',
        title: 'Protect Your Info',
        desc: 'Do not share your home address, social security number, or financial information with people you just met.',
        color: '#F5F3FF',
        iconColor: '#8B5CF6'
    }
];

export default function SafetyCenter({ navigation }) {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    return (
        <View style={s.root}>
            <LinearGradient
                colors={['#0F172A', '#1D3461', '#6366F1']}
                style={[s.header, { paddingTop: insets.top + 12 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={s.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Feather name="arrow-left" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Safety Center</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={s.headerSub}>Tips and tools to keep you safe in our community.</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                <View style={s.heroBox}>
                    <View style={s.heroIconBox}>
                        <Feather name="shield" size={32} color="#6366F1" />
                    </View>
                    <Text style={s.heroTitle}>Your Safety is Priority #1</Text>
                    <Text style={s.heroDesc}>
                        Weezy is a place for real connections. Use these tips to ensure every encounter is positive and safe.
                    </Text>
                </View>

                {SAFETY_TIPS.map((tip, i) => (
                    <View key={i} style={s.card}>
                        <View style={[s.iconBox, { backgroundColor: tip.color }]}>
                            <Feather name={tip.icon} size={20} color={tip.iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.cardTitle}>{tip.title}</Text>
                            <Text style={s.cardDesc}>{tip.desc}</Text>
                        </View>
                    </View>
                ))}

                <View style={s.footer}>
                    <Text style={s.footerTitle}>Need immediate help?</Text>
                    <Text style={s.footerDesc}>If you are in immediate danger, please contact your local emergency services.</Text>
                    <TouchableOpacity style={s.supportBtn} onPress={() => showToast('Support', 'Connecting you to our safety team...', 'info')}>
                        <Text style={s.supportBtnText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 20, paddingBottom: 24 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: theme.typography.fontFamily.medium, lineHeight: 20, paddingRight: 40 },

    content: { padding: 20 },
    heroBox: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
    heroIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    heroTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 8 },
    heroDesc: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', lineHeight: 20 },

    card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', gap: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 4 },
    cardDesc: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, lineHeight: 18 },

    footer: { marginTop: 12, alignItems: 'center', padding: 24, backgroundColor: '#F1F5F9', borderRadius: 20 },
    footerTitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 4 },
    footerDesc: { fontSize: 13, color: '#64748B', fontFamily: theme.typography.fontFamily.medium, textAlign: 'center', marginBottom: 16 },
    supportBtn: { backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    supportBtnText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#6366F1' },
});
