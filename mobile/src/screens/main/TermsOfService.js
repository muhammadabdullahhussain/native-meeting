import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function TermsOfService({ navigation }) {
    const insets = useSafeAreaInsets();

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
                    <Text style={s.headerTitle}>Terms of Service</Text>
                    <View style={{ width: 38 }} />
                </View>
                <Text style={s.headerSubTitle}>Last Updated: March 2026</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.card}>
                    <Text style={s.sectionTitle}>1. Welcome to BondUs</Text>
                    <Text style={s.paragraph}>
                        By using the BondUs application, you agree to these Terms of Service. Please read them carefully. We provide a platform for users to connect based on shared interests and geographical proximity.
                    </Text>

                    <Text style={s.sectionTitle}>2. Account Registration</Text>
                    <Text style={s.paragraph}>
                        You must be at least 18 years old to create an account. You agree to provide accurate, complete, and updated information. You are responsible for safeguarding your password and notifying us of any unauthorized use of your account.
                    </Text>

                    <Text style={s.sectionTitle}>3. User Content & Conduct</Text>
                    <Text style={s.paragraph}>
                        You are solely responsible for the content you post. You agree not to post content that is illegal, defamatory, abusive, or infringing on intellectual property. We reserve the right to remove any content or ban users who violate these rules.
                    </Text>

                    <Text style={s.sectionTitle}>4. Premium Services</Text>
                    <Text style={s.paragraph}>
                        Some features are billed on a subscription or one-time basis ("Premium Services"). Payments are non-refundable except where required by law. You can cancel your subscription at any time through your device's account settings.
                    </Text>

                    <Text style={s.sectionTitle}>5. Termination</Text>
                    <Text style={s.paragraph}>
                        We may suspend or terminate your access to the app at any time, for any reason, including violation of these terms.
                    </Text>

                    <Text style={s.sectionTitle}>6. Liability</Text>
                    <Text style={s.paragraph}>
                        BondUs is provided "as is". We do not guarantee that the app will be uninterrupted or error-free. We are not liable for any interactions you have with other users outside of the app.
                    </Text>
                </View>
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
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },

    sectionTitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 8, marginTop: 16 },
    paragraph: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#64748B', lineHeight: 22, textAlign: 'justify' },
});
