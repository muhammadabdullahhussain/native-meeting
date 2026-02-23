import { StatusBar } from 'expo-status-bar';
import RootStack from './src/navigation/RootStack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootStack />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
