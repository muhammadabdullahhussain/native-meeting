import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import ChatRoom from '../screens/main/ChatRoom';
import UserProfile from '../screens/main/UserProfile';
import Settings from '../screens/main/Settings';
import Notifications from '../screens/main/Notifications';
import Splash from '../screens/Splash';

const Stack = createNativeStackNavigator();

export default function RootStack() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
                <Stack.Screen name="Splash" component={Splash} />
                <Stack.Screen name="Auth" component={AuthStack} />
                <Stack.Screen name="MainApp" component={MainTabs} />
                <Stack.Screen
                    name="ChatRoom"
                    component={ChatRoom}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="UserProfile"
                    component={UserProfile}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Settings"
                    component={Settings}
                    options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                    name="Notifications"
                    component={Notifications}
                    options={{ presentation: 'modal', headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
