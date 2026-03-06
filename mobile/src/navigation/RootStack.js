import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

const DarkNavigationTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: '#080E1D',
        card: '#080E1D',
        text: '#FFFFFF',
        border: '#1E293B',
        notification: theme.colors.secondary,
    },
};

// Registration handled in App.js

// Auth screens
import AuthStack from './AuthStack';
import ForgotPassword from '../screens/auth/ForgotPassword';

// Main app screens
import MainTabs from './MainTabs';
import ChatRoom from '../screens/main/ChatRoom';
import UserProfile from '../screens/main/UserProfile';
import Settings from '../screens/main/Settings';
import Premium from '../screens/main/Premium';
import InterestManager from '../screens/main/InterestManager';
import GroupChat from '../screens/main/GroupChat';
import SafetyCenter from '../screens/main/SafetyCenter';
import Invite from '../screens/main/Invite';
import Splash from '../screens/Splash';
import HelpCenter from '../screens/main/HelpCenter';
import TermsOfService from '../screens/main/TermsOfService';
import PrivacyPolicy from '../screens/main/PrivacyPolicy';

const Stack = createNativeStackNavigator();

// ── Loading screen while checking session ─────────────────────────────────────
function AuthLoadingScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
            <ActivityIndicator color="#6366F1" size="large" />
        </View>
    );
}

export default function RootStack() {
    const { isAuthenticated } = useAuth();

    React.useEffect(() => {
        // Hide the native splash screen as soon as RootStack mounts
        // This ensures the transition is as smooth as possible
        const hideNativeSplash = async () => {
            try {
                // We add a tiny delay to ensure the custom Splash component has its first frame drawn
                await new Promise(resolve => setTimeout(resolve, 50));
                await SplashScreen.hideAsync();
            } catch (e) {
                // Already hidden or errored
            }
        };
        hideNativeSplash();
    }, []);

    return (
        <NavigationContainer theme={DarkNavigationTheme}>
            <Stack.Navigator
                screenOptions={{ headerShown: false, animation: 'fade' }}
                // Route user directly based on real session state
                initialRouteName="Splash"
            >
                <Stack.Screen name="Splash" component={Splash} />
                {!isAuthenticated ? (
                    // ── Auth Routes (not logged in) ─────────────────────────────
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : (
                    // ── Main App Routes (logged in) ─────────────────────────────
                    // ── Main App Routes (logged in) ─────────────────────────────
                    <>
                        <Stack.Screen name="MainApp" component={MainTabs} />
                        <Stack.Screen name="ChatRoom" component={ChatRoom} />
                        <Stack.Screen name="UserProfile" component={UserProfile} />
                        <Stack.Screen name="Settings" component={Settings} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Premium" component={Premium} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="InterestManager" component={InterestManager} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="GroupChat" component={GroupChat} />
                        <Stack.Screen name="SafetyCenter" component={SafetyCenter} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="Invite" component={Invite} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="HelpCenter" component={HelpCenter} />
                        <Stack.Screen name="TermsOfService" component={TermsOfService} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
