import React, { useState, useEffect, useRef } from "react";
import * as Linking from "expo-linking";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/authService";
import { useToast } from "../../context/ToastContext";
import { useTranslation } from "react-i18next";

const INTEREST_PREVIEW = [
  "Chess ♟️",
  "Coffee ☕",
  "AI & ML 🤖",
  "Jazz 🎵",
  "Hiking 🏕️",
  "Startups 🚀",
];

export default function Login({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialReferralCode, setInitialReferralCode] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Handle deep link for referral code
    const handleDeepLink = (event) => {
      const { queryParams } = Linking.parse(event.url);
      if (queryParams?.code || queryParams?.ref) {
        const code = queryParams.code || queryParams.ref;
        setInitialReferralCode(code);
        setIsLogin(false); // Switch to registration if coming from a link
        showToast(
          t('auth.referral_detected'),
          t('auth.referral_applying', { code }),
          "success",
        );
      }
    };

    // Initial check
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Listen for new links while app is open
    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [isLogin]);

  const handleAuth = async () => {
    setError("");

    // Remove trailing spaces added by mobile keyboards
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Robust Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError(t('auth.v_email_req'));
      return;
    }

    if (!isLogin) {
      if (!name.trim() || name.trim().length < 3) {
        setError(t('auth.v_name_req'));
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
      if (!cleanPassword || !passwordRegex.test(cleanPassword)) {
        setError(t('auth.v_pass_req'));
        return;
      }
    } else {
      if (!cleanPassword || cleanPassword.length < 6) {
        setError(t('auth.v_pass_format'));
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const response = await authService.login(cleanEmail, cleanPassword);
        // API response is { success: true, token, data: { user } }
        await login(response.data.user, response.token);
        // Navigation handled automatically by RootStack auth guard
      } else {
        // Check if email already exists before proceeding
        await authService.checkEmail(cleanEmail);
        navigation.navigate("ProfileSetup", {
          name,
          email: cleanEmail,
          password: cleanPassword,
          referralCode: initialReferralCode,
        });
      }
    } catch (e) {
      const msg = e.message || t('common.error');
      setError(msg);
      showToast(t('auth.auth_error'), msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* TOP HERO SECTION */}
      <LinearGradient
        colors={["#0F172A", "#1D3461", "#1D4ED8"]}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🔗</Text>
          </View>
          <Text style={styles.logoName}>BondUs</Text>
        </View>

        <Text style={styles.heroTitle}>
          {isLogin ? t('auth.welcome_back') : t('auth.find_people')}
        </Text>
        <Text style={styles.heroSub}>
          {isLogin
            ? t('auth.login_sub')
            : t('auth.register_sub')}
        </Text>

        {/* Scrolling interest chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.interestScroll}
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
        >
          {INTEREST_PREVIEW.map((tag, i) => (
            <View key={i} style={styles.interestChip}>
              <Text style={styles.interestChipText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* FORM CARD */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tab toggle */}
          <View style={styles.toggleRow}>
            {[t('auth.sign_in'), t('auth.create_account')].map((label, i) => {
              const active = (i === 0) === isLogin;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                  onPress={() => setIsLogin(i === 0)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      active && styles.toggleTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('auth.full_name')}</Text>
                <View style={styles.inputRow}>
                  <Feather
                    name="user"
                    size={17}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={t('setup.name_placeholder')}
                    placeholderTextColor="#CBD5E1"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              <View style={styles.inputRow}>
                <Feather
                  name="mail"
                  size={17}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#CBD5E1"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <View style={styles.inputRow}>
                <Feather
                  name="lock"
                  size={17}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('setup.referral_placeholder').includes('perks') ? "At least 6 characters" : t('settings.pass_min_chars')}
                  placeholderTextColor="#CBD5E1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={17}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {isLogin && (
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>{t('auth.forgot_pass')}</Text>
              </TouchableOpacity>
            )}

            {error !== "" && (
              <View style={styles.errorBox}>
                <Feather
                  name="alert-circle"
                  size={14}
                  color="#EF4444"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={handleAuth}
              activeOpacity={0.88}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#1D4ED8", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.ctaText}>
                    {isLogin ? t('auth.sign_in') : t('auth.create_account')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('auth.or_continue')}</Text>
              <View style={styles.divider} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              {[
                { label: t('auth.google'), icon: "g", color: "#EA4335", id: 'Google' },
                { label: t('auth.apple'), icon: "", color: "#0F172A", id: 'Apple' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    showToast(
                      t('auth.social_soon_title'),
                      t('auth.social_soon_msg', { service: s.id }),
                      "info",
                    );
                  }}
                >
                  <Text style={[styles.socialIcon, { color: s.color }]}>
                    {s.id === "Google" ? "G" : ""}
                  </Text>
                  <Feather
                    name={s.id === "Apple" ? "smartphone" : "globe"}
                    size={18}
                    color={s.color}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.socialText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.terms}>
              {t('auth.terms_agree')}
              <Text style={styles.termsLink}>{t('settings.terms_of_service')}</Text>
              {t('auth.and')}
              <Text style={styles.termsLink}>{t('settings.privacy_policy')}</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // HERO
  hero: { paddingHorizontal: 24, paddingBottom: 24 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoEmoji: { fontSize: 22 },
  logoName: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 18,
    lineHeight: 22,
  },
  interestScroll: { marginHorizontal: -4 },
  interestChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  interestChipText: {
    fontSize: 12,
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
  },

  // FORM
  formScroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 13,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#FFF",
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px rgba(0,0,0,0.08)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#94A3B8",
  },
  toggleTextActive: {
    color: "#0F172A",
    fontFamily: theme.typography.fontFamily.bold,
  },

  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#475569",
    marginBottom: 8,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontFamily: theme.typography.fontFamily.medium,
  },
  eyeBtn: { padding: 4 },

  forgotRow: { alignSelf: "flex-end", marginBottom: 16 },
  forgotText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    fontFamily: theme.typography.fontFamily.medium,
    flex: 1,
  },

  ctaBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: "0px 6px 12px rgba(29, 78, 216, 0.3)" },
      default: {
        shadowColor: "#1D4ED8",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }),
    elevation: 6,
  },
  ctaGrad: { height: 56, justifyContent: "center", alignItems: "center" },
  ctaText: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    letterSpacing: 0.2,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: {
    fontSize: 13,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },

  socialRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  socialIcon: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
    marginRight: 4,
  },
  socialText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },

  terms: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
});
