import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { useTranslation } from 'react-i18next';

import Discover from '../screens/main/Discover';
import Connections from '../screens/main/Connections';
import Notifications from '../screens/main/Notifications';
import Profile from '../screens/main/Profile';

import { useNotifications } from '../context/NotificationContext';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    const insets = useSafeAreaInsets();
    const { unreadCount } = useNotifications();
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true, // Re-enabled labels to match screenshot
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Discover') iconName = 'compass';
                    else if (route.name === 'Connections') iconName = 'message-square';
                    else if (route.name === 'Notifications') iconName = 'bell';
                    else if (route.name === 'Profile') iconName = 'user';

                    return (
                        <Feather
                            name={iconName}
                            size={24}
                            color={color}
                        />
                    );
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: '#64748B',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontFamily: theme.typography.fontFamily.medium,
                    paddingBottom: Platform.OS === 'ios' ? 0 : 4,
                },
                tabBarStyle: [
                    styles.tabBar,
                    {
                        height: 60 + insets.bottom,
                        paddingBottom: insets.bottom,
                    }
                ],
            })}
        >
            <Tab.Screen name="Discover" component={Discover} options={{ title: t('tabs.explore', 'Explore') }} />
            <Tab.Screen name="Connections" component={Connections} options={{ title: t('tabs.messages', 'Messages') }} />
            <Tab.Screen
                name="Notifications"
                component={Notifications}
                options={{
                    title: t('tabs.notifications', 'Notifications'),
                    tabBarBadge: unreadCount > 0 ? unreadCount : null,
                    tabBarBadgeStyle: {
                        backgroundColor: '#EF4444',
                        color: '#FFF',
                        fontSize: 10,
                        fontFamily: theme.typography.fontFamily.bold,
                    }
                }}
            />
            <Tab.Screen name="Profile" component={Profile} options={{ title: t('tabs.profile', 'Profile') }} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0', // Thin subtle border
        elevation: 0, // Removed elevation to match screenshot strict flat look
        shadowOpacity: 0,
    }
});
