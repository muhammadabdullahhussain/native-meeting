import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from '../screens/auth/Onboarding';
import Login from '../screens/auth/Login';
import ProfileSetup from '../screens/auth/ProfileSetup';
import ForgotPassword from '../screens/auth/ForgotPassword';
import LanguageSelection from '../screens/auth/LanguageSelection';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LanguageSelection" component={LanguageSelection} />
            <Stack.Screen name="Onboarding" component={Onboarding} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </Stack.Navigator>
    );
}
