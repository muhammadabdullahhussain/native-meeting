import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme/theme';

import Home from '../screens/main/Home';
import Discover from '../screens/main/Discover';
import ChatList from '../screens/main/ChatList';
import Profile from '../screens/main/Profile';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: true,
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.text,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = 'home';
                    else if (route.name === 'Discover') iconName = 'compass';
                    else if (route.name === 'Chats') iconName = 'message-circle';
                    else if (route.name === 'Profile') iconName = 'user';

                    return <Feather name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textMuted,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                    paddingBottom: 5,
                }
            })}
        >
            <Tab.Screen name="Home" component={Home} options={{ headerShown: false }} />
            <Tab.Screen name="Discover" component={Discover} options={{ headerShown: false }} />
            <Tab.Screen name="Chats" component={ChatList} options={{ headerShown: false }} />
            <Tab.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        </Tab.Navigator>
    );
}
