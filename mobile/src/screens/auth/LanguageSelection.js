import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'ur', label: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa', flag: '🇮🇩' },
];

export default function LanguageSelection({ navigation }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(i18n.language || 'en');

  const handleSelect = (code) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(code);
  };

  const handleContinue = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await i18n.changeLanguage(selected);
    navigation.navigate('Onboarding');
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4F46E5', '#6366F1', '#818CF8']}
        style={[s.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={s.circle1} />
        <View style={s.circle2} />
        <View style={s.headerContent}>
          <View style={s.iconBg}>
            <Feather name="globe" size={32} color="#FFF" />
          </View>
          <Text style={s.title}>{t('language.select_title')}</Text>
          <Text style={s.subTitle}>{t('language.select_sub')}</Text>
        </View>
      </LinearGradient>

      <View style={s.content}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          <View style={s.grid}>
            {LANGUAGES.map((lang) => {
              const isSelected = selected === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(lang.code)}
                  style={[s.card, isSelected && s.cardSelected]}
                >
                  <View style={[s.flagCircle, isSelected && s.flagCircleSelected]}>
                    <Text style={s.flagText}>{lang.flag}</Text>
                  </View>
                  <View style={s.langInfo}>
                    <Text style={[s.langNative, isSelected && s.langNativeSelected]} numberOfLines={1}>
                      {lang.native}
                    </Text>
                    <Text style={s.langLabel} numberOfLines={1}>{lang.label}</Text>
                  </View>
                  {isSelected && (
                    <View style={s.checkCircle}>
                      <Feather name="check" size={10} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleContinue}
            style={s.button}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.buttonGrad}
            >
              <Text style={s.buttonText}>{t('common.next')}</Text>
              <Feather name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    alignItems: 'center',
  },
  iconBg: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 26,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 56) / 2,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    }),
  },
  cardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F5F7FF',
  },
  flagCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  flagCircleSelected: {
    backgroundColor: '#EEF2FF',
  },
  flagText: {
    fontSize: 24,
  },
  langInfo: {
    alignItems: 'center',
  },
  langNative: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
    marginBottom: 2,
  },
  langNativeSelected: {
    color: '#6366F1',
  },
  langLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    paddingTop: 16,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' },
    }),
  },
  buttonGrad: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFF',
  },
});
