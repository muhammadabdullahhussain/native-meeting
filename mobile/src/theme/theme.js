import { Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const theme = {
  layout: {
    screenWidth,
    screenHeight,
  },
  colors: {
    primary: '#6366F1',      // Modern Indigo
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    secondary: '#F43F5E',    // Rose accent
    accent: '#F59E0B',       // Amber/Gold for Premium elements
    background: '#FAFAFB',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    text: '#0F172A',         // Slate 900
    textMuted: '#64748B',    // Slate 500
    border: '#E2E8F0',       // Slate 200
    success: '#10B981',      // Emerald 500
    error: '#EF4444',        // Red 500
    glass: 'rgba(255, 255, 255, 0.7)',
    glassDark: 'rgba(15, 23, 42, 0.8)',
  },
  gradients: {
    primary: ['#6366F1', '#4F46E5'],
    premium: ['#F59E0B', '#D97706'], // Gold gradient
    surface: ['#FFFFFF', '#F8FAFC'],
    dark: ['#1E293B', '#0F172A'],
    success: ['#10B981', '#059669'],
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
      body: 15,
      caption: 13,
      small: 11,
    },
    lineHeight: {
      body: 22,
      title: 26,
    }
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    round: 9999,
  },
  shadows: {
    none: { elevation: 0, shadowOpacity: 0 },
    small: {
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
        web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
      })
    },
    medium: {
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: { elevation: 6 },
        web: { boxShadow: '0 8px 12px rgba(0,0,0,0.08)' }
      })
    },
    large: {
      ...Platform.select({
        ios: {
          shadowColor: '#6366F1', // Primary colored shadow for depth
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
        },
        android: { elevation: 12 },
        web: { boxShadow: '0 12px 24px rgba(99,102,241,0.12)' }
      })
    },
    premium: {
      ...Platform.select({
        ios: {
          shadowColor: '#F59E0B',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        android: { elevation: 10 },
        web: { boxShadow: '0 10px 20px rgba(245,158,11,0.2)' }
      })
    }
  },
  glass: {
    intensity: 15,
    tint: 'light',
  }
};
