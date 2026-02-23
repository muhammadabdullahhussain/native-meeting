import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function Settings({ navigation }) {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const insets = useSafeAreaInsets();

    const SectionTitle = ({ title }) => (
        <Text style={styles.sectionTitle}>{title}</Text>
    );

    const SettingRow = ({ icon, title, subtitle, rightElement, onPress }) => (
        <TouchableOpacity
            style={styles.settingRow}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Feather name={icon} size={20} color={theme.colors.text} />
                </View>
                <View>
                    <Text style={styles.settingTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.settingRight}>
                {rightElement || <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <SectionTitle title="Account" />
                <View style={styles.sectionCard}>
                    <SettingRow
                        icon="user"
                        title="Edit Profile"
                        onPress={() => navigation.navigate('UserProfile', { isEdit: true })}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="lock"
                        title="Change Password"
                        onPress={() => { }}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="shield"
                        title="Privacy Settings"
                        onPress={() => { }}
                    />
                </View>

                <SectionTitle title="Preferences" />
                <View style={styles.sectionCard}>
                    <SettingRow
                        icon="bell"
                        title="Push Notifications"
                        rightElement={
                            <Switch
                                value={pushEnabled}
                                onValueChange={setPushEnabled}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            />
                        }
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="mail"
                        title="Email Notifications"
                        rightElement={
                            <Switch
                                value={emailEnabled}
                                onValueChange={setEmailEnabled}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            />
                        }
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="map-pin"
                        title="Location Services"
                        subtitle="Used to find nearby connections"
                        rightElement={
                            <Switch
                                value={locationEnabled}
                                onValueChange={setLocationEnabled}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            />
                        }
                    />
                </View>

                <SectionTitle title="Support" />
                <View style={styles.sectionCard}>
                    <SettingRow icon="help-circle" title="Help Center" onPress={() => { }} />
                    <View style={styles.divider} />
                    <SettingRow icon="file-text" title="Terms of Service" onPress={() => { }} />
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => navigation.replace('Auth')} // Return to login
                >
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.h1,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    content: {
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.title,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    sectionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.small,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    settingTitle: {
        fontSize: theme.typography.sizes.body,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text,
    },
    settingSubtitle: {
        fontSize: theme.typography.sizes.small,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginLeft: 68, // Aligns with text
    },
    logoutButton: {
        marginTop: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        alignItems: 'center',
        ...theme.shadows.small,
    },
    logoutText: {
        fontSize: theme.typography.sizes.title,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.error,
    },
    versionText: {
        textAlign: 'center',
        color: theme.colors.textMuted,
        fontSize: theme.typography.sizes.small,
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.xxl,
    }
});
