import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Global Configuration for Interesta Platform
 * CENTRALIZED 10,000% RELIABILITY CONSTANTS
 */

// Dynamically grab IP from Expo's hostUri (works in Expo Go on physical device)
const debuggerHost = Constants.expoConfig?.hostUri;
let DYNAMIC_IP = '192.168.1.113'; // Fallback to current IP

if (debuggerHost) {
    DYNAMIC_IP = debuggerHost.split(':')[0];
}

export const LOCAL_IP = DYNAMIC_IP;

export const API_BASE_URL = Platform.select({
    ios: `http://${LOCAL_IP}:5001/api`,
    android: `http://${LOCAL_IP}:5001/api`,
    web: 'http://localhost:5001/api',
});

export const SOCKET_URL = Platform.select({
    ios: `http://${LOCAL_IP}:5001`,
    android: `http://${LOCAL_IP}:5001`,
    web: 'http://localhost:5001',
});

export const CONFIG = {
    API_BASE_URL,
    SOCKET_URL,
    MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
    DEFAULT_TIMEOUT: 10000,
};
