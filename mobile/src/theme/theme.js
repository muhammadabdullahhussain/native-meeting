import { Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const theme = {
  layout: {
    screenWidth,
    screenHeight,
  },
  colors: {
    primary: '#0A66C2',      // LinkedIn/Modern Blue primary color for a premium feel
    primaryLight: '#70B5F9', // Lighter shade for highlights
    secondary: '#FF4500',    // Bright accent for notifications/likes
    background: '#FAFAFB',   // Very slightly off-white background
    surface: '#FFFFFF',      // Pure White for cards and containers
    text: '#191C1F',         // Very dark gray, softer than pure black
    textMuted: '#68737D',    // Gray for timestamps, secondary text
    border: '#EAECEE',       // Light border color
    success: '#14A351',      // Green for online indicator
    error: '#E74C3C',        // Red for errors
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  typography: {
    fontFamily: {
      regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
      medium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
      bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    },
    sizes: {
      h1: 32,
      h2: 24,
      h3: 20,
      title: 18,
      body: 15, // Slightly smaller body for a more refined look
      caption: 13,
      small: 11,
    },
  },
  borderRadius: {
    sm: 8,
    md: 16,     // Increased for a softer, modern look
    lg: 24,     // Increased for larger cards
    round: 9999, // For avatars and circular buttons
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    }
  },
};
