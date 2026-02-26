import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

// Base URL for Backend API
// TIP: Use your local IP (e.g., http://192.168.x.x:5000) for testing on physical devices
const LOCAL_IP = '192.168.1.26'; // Your local machine IP
const API_URL = Platform.select({
    ios: `http://${LOCAL_IP}:5000/api`,
    android: `http://${LOCAL_IP}:5000/api`,
    web: 'http://localhost:5000/api',
});

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10s timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('@interesta_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Helper to extract clean error messages
const getErrorMessage = (error) => {
    if (error.response) {
        // The server responded with a status code that falls out of the range of 2xx
        return error.response.data?.message || 'Server error occurred';
    } else if (error.request) {
        // The request was made but no response was received
        return 'Connection failed. Please check if the server is running and reachable.';
    } else {
        // Something happened in setting up the request that triggered an Error
        return error.message || 'An unexpected error occurred';
    }
};

export const authService = {
    register: async (userData) => {
        try {
            const response = await apiClient.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw { message: getErrorMessage(error) };
        }
    },

    login: async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            return response.data;
        } catch (error) {
            throw { message: getErrorMessage(error) };
        }
    },

    checkEmail: async (email) => {
        try {
            const response = await apiClient.post('/auth/check-email', { email });
            return response.data;
        } catch (error) {
            throw { message: getErrorMessage(error) };
        }
    },

    uploadImage: async (imageUri) => {
        try {
            const formData = new FormData();

            if (Platform.OS === 'web') {
                // On Web, we need to fetch the blob from the URI
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('image', blob, 'upload.jpg');
            } else {
                // On Native (iOS/Android)
                const uriParts = imageUri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                formData.append('image', {
                    uri: imageUri,
                    name: `upload.${fileType}`,
                    type: `image/${fileType}`,
                });
            }

            const response = await apiClient.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw { message: getErrorMessage(error) };
        }
    },

    updateProfile: async (userData) => {
        try {
            const response = await apiClient.patch('/auth/me', userData);
            return response.data;
        } catch (error) {
            throw { message: getErrorMessage(error) };
        }
    },

    updateLocation: async (latitude, longitude) => {
        try {
            const response = await apiClient.patch('/auth/me', {
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude], // MongoDB uses [lng, lat]
                },
            });
            return response.data;
        } catch (error) {
            console.error('Location sync failed:', error);
            throw { message: getErrorMessage(error) };
        }
    },

    getNearbyUsers: async (params = {}) => {
        try {
            // params can include maxDistance, interests, lookingFor
            const response = await apiClient.get('/users/discover', { params });
            return response.data;
        } catch (error) {
            throw { message: getErrorMessage(error) };
        }
    },
};

export default apiClient;
