import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function PrivacyPolicy({ navigation }) {
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
                    <Text style={s.headerTitle}>Privacy Policy</Text>
                    <View style={{ width: 38 }} />
                </View>
                <Text style={s.headerSubTitle}>Last Updated: March 2026</Text>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.card}>
                    <Text style={s.sectionTitle}>1. Information We Collect</Text>
                    <Text style={s.paragraph}>
                        When you use Interesta, we collect your name, email address, profile photos, interests, and location data. Your location is used to power our core "discovery" feature and match you with nearby users.
                    </Text>

                    <Text style={s.sectionTitle}>2. How We Use Information</Text>
                    <Text style={s.paragraph}>
                        We use your information to operate the platform, recommend connections, send push notifications about activity, and improve our services. You can control visibility such as "Show Me" and "Blur Location" in your Account Settings.
                    </Text>

                    <Text style={s.sectionTitle}>3. Sharing Your Information</Text>
                    <Text style={s.paragraph}>
                        We do not sell your personal data to third parties. We only share information necessary to provide the service (e.g., displaying your public profile to others) or when required by law enforcement.
                    </Text>

                    <Text style={s.sectionTitle}>4. Data Security</Text>
                    <Text style={s.paragraph}>
                        We implement strict security measures including JWT tokens, bcrypt password hashing, and secure HTTPS channels to protect your data. However, no electronic transmission over the internet can be entirely 100% secure.
                    </Text>

                    <Text style={s.sectionTitle}>5. Your Rights & Deletion</Text>
                    <Text style={s.paragraph}>
                        You have the right to access, edit, or delete your account at any time. If you choose "Delete Account" from Settings, all your personal information, active chats, and group memberships are immediately and permanently removed from our databases.
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
