import './src/i18n/i18n';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ToastProvider } from './src/context/ToastContext';
import { Toast } from './src/components/Toast';
import RootStack from './src/navigation/RootStack';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from hiding until we are ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#080E1D' }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <ToastProvider>
                <RootStack />
                <Toast />
                <StatusBar style="auto" />
              </ToastProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
