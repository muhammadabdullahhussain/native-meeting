import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { theme } from "../../theme/theme";
import { API_BASE_URL } from "../../config";
import { INTEREST_CATEGORIES } from "../../data/interests";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/authService";
import { useToast } from "../../context/ToastContext";
import LocationAutocomplete from "../../components/common/LocationAutocomplete";

const LOOKING_FOR_OPTIONS = [
  { label: "Coffee Chat", emoji: "☕" },
  { label: "Collab Partner", emoji: "🤝" },
  { label: "Networking", emoji: "🌐" },
  { label: "Mentorship", emoji: "🎓" },
  { label: "Friends", emoji: "👋" },
];

const MAX_INTERESTS = 30;
const STEPS = ["About You", "Your Interests", "Looking For"];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileSetup({ navigation, route }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const passedName = route?.params?.name || "";
  const passedReferralCode = route?.params?.referralCode || "";

  const [step, setStep] = useState(1);
  const [name, setName] = useState(passedName);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState(passedReferralCode);
  const [isVerifyingReferral, setIsVerifyingReferral] = useState(false);
  const [isReferralValid, setIsReferralValid] = useState(!!passedReferralCode);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState(null);
  const [lookingFor, setLookingFor] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // New Fields
  const [gender, setGender] = useState("Prefer not to say");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  React.useEffect(() => {
    // We no longer need to load from backend as we are using the local taxonomy
    if (step === 1 && expandedCat === null && INTEREST_CATEGORIES.length > 0) {
      setExpandedCat(INTEREST_CATEGORIES[0].id);
    }
  }, [step]);

  const detectLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast(
          "Permission Denied",
          "Please allow location access to auto-detect your city.",
          "error",
        );
        setGpsLoading(false);
        return;
      }
      // Try getting last known position first (fastest)
      let pos = await Location.getLastKnownPositionAsync({});

      // If last known is not available, get current position with timeout
      if (!pos) {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 5000, // 5 second timeout
        });
      }

      // Use Photon reverse geocode for better compatibility especially on Web
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const resp = await fetch(
        `${API_BASE_URL}/location/reverse?lon=${lon}&lat=${lat}`
      );
      const data = await resp.json();

      if (data && data.features && data.features.length > 0) {
        const place = data.features[0].properties;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const cityName = [place.city || place.name, place.state || place.country]
          .filter(Boolean)
          .join(", ");
        setCity(cityName);
      }
    } catch (e) {
      showToast(
        "Location Error",
        "Could not detect location. Please enter manually.",
        "info",
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const toggleInterest = (sub) => {
    Haptics.selectionAsync();
    if (selectedInterests.includes(sub)) {
      setSelectedInterests((prev) => prev.filter((i) => i !== sub));
    } else if (selectedInterests.length < MAX_INTERESTS) {
      setSelectedInterests((prev) => [...prev, sub]);
    }
  };

  const validateReferral = async (code) => {
    if (!code || code.length < 6) {
      setIsReferralValid(false);
      return;
    }
    setIsVerifyingReferral(true);
    try {
      const response = await authService.validateReferralCode(code);
      setIsReferralValid(response.success);
    } catch (e) {
      setIsReferralValid(false);
    } finally {
      setIsVerifyingReferral(false);
    }
  };

  const toggleLookingFor = (label) => {
    Haptics.selectionAsync();
    setLookingFor((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const pickBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast(
        "Permission Needed",
        "Please allow camera access to set a profile picture.",
        "info",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
        setIsUploading(true);
        const selectedAsset = result.assets[0];
        const localUri = selectedAsset.uri;

        setBanner(localUri);

        const uploadResult = await authService.uploadImage(selectedAsset);

        if (uploadResult.success) {
          setBanner(uploadResult.url);
          showToast("Success", "Profile banner updated!", "success");
        }
      } catch (error) {
        console.error("Banner upload failed:", error);
        showToast(
          "Upload Failed",
          error.message || "Could not upload banner. Please try again.",
          "error",
        );
        setBanner(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast(
        "Permission Needed",
        "Please allow camera access to set a profile picture.",
        "info",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
        setIsUploadingAvatar(true);
        const selectedAsset = result.assets[0];
        const localUri = selectedAsset.uri;

        setAvatar(localUri);

        const uploadResult = await authService.uploadImage(selectedAsset);

        if (uploadResult.success) {
          setAvatar(uploadResult.url);
          showToast("Success", "Profile photo updated!", "success");
        }
      } catch (error) {
        console.error("Avatar upload failed:", error);
        showToast(
          "Upload Failed",
          error.message || "Could not upload photo. Please try again.",
          "error",
        );
        setAvatar(null);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const canNext = () => {
    if (step === 0) {
      // Name: 3+ chars
      const nameValid = name.trim().length >= 3;
      // Username: 3-15 chars, alphanumeric + underscores
      const userRegex = /^[a-zA-Z0-9_]{3,15}$/;
      const usernameValid = userRegex.test(username.trim());
      // City: Not empty
      const cityValid = city.trim().length > 0;
      // Birthday: DD(1-31), MM(1-12), YYYY(reasonable range)
      const d = parseInt(birthDay);
      const m = parseInt(birthMonth);
      const y = parseInt(birthYear);
      const currentYear = new Date().getFullYear();
      const birthdayValid =
        d >= 1 && d <= 31 &&
        m >= 1 && m <= 12 &&
        y >= 1940 && y <= (currentYear - 13);

      return nameValid && usernameValid && cityValid && birthdayValid;
    }
    if (step === 1) return selectedInterests.length >= 3;
    return lookingFor.length > 0;
  };

  const goNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < STEPS.length - 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep((s) => s + 1);
    } else {
      // Finalize setup and register
      setIsSubmitting(true);
      try {
        // Derive interest categories from selected interests
        const categories = new Set();
        selectedInterests.forEach((interest) => {
          const cat = INTEREST_CATEGORIES.find((c) =>
            c.subInterests.includes(interest),
          );
          if (cat) categories.add(cat.name);
        });

        const userData = {
          name,
          username,
          email: route.params?.email || "",
          password: route.params?.password || "",
          bio,
          city,
          jobTitle,
          company,
          interests: selectedInterests,
          interestCategories: Array.from(categories),
          lookingFor,
          avatar,
          banner,
          gender,
          referralCode: isReferralValid ? referralCode : null,
          birthday: new Date(birthYear, birthMonth - 1, birthDay),
        };

        const response = await authService.register(userData);
        // API response is { success: true, token, data: { user } }
        await login(response.data.user, response.token);
        // Navigation to MainApp handled by RootStack auth guard
      } catch (e) {
        const msg = e.message || "Something went wrong";
        showToast("Setup Failed", msg, "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigation.goBack();
  };

  // Interest chip palette — 8 beautiful pastel pairs (matching Profile.js)
  const IC_BG = [
    "#DBEAFE",
    "#DCFCE7",
    "#FEF9C3",
    "#FCE7F3",
    "#EDE9FE",
    "#FFEDD5",
    "#CFFAFE",
    "#F0FDF4",
  ];
  const IC_TEXT = [
    "#1E40AF",
    "#166534",
    "#854D0E",
    "#9D174D",
    "#5B21B6",
    "#9A3412",
    "#155E75",
    "#14532D",
  ];

  const progress = (step + 1) / STEPS.length;

  const filteredCategories = search
    ? INTEREST_CATEGORIES.map((cat) => ({
      ...cat,
      subInterests: cat.subInterests.filter((s) =>
        s.toLowerCase().includes(search.toLowerCase()),
      ),
    })).filter((cat) => cat.subInterests.length > 0)
    : INTEREST_CATEGORIES;

  const pct = Math.min(100, (selectedInterests.length / MAX_INTERESTS) * 100);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#1E1B4B", "#3730A3", "#7C3AED"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerStep}>
            Step {step + 1} of {STEPS.length}
          </Text>
          <Text style={styles.headerTitle}>{STEPS[step]}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 0: ABOUT YOU ── */}
          {step === 0 ? (
            <View>
              {/* Visual Identity Section (Banner + Avatar) */}
              <View style={styles.profileSection}>
                <TouchableOpacity
                  style={styles.bannerContainer}
                  activeOpacity={0.9}
                  onPress={pickBanner}
                  disabled={isUploading}
                >
                  {banner ? (
                    <Image source={{ uri: banner }} style={styles.bannerImg} />
                  ) : (
                    <LinearGradient
                      colors={["#3730A3", "#7C3AED"]}
                      style={styles.bannerPlaceholder}
                    >
                      <Feather
                        name="image"
                        size={24}
                        color="rgba(255,255,255,0.6)"
                      />
                      <Text style={styles.bannerHint}>{t('setup.add_cover')}</Text>
                    </LinearGradient>
                  )}
                  {isUploading && (
                    <View style={styles.uploadOverlay}>
                      <ActivityIndicator color="#FFF" />
                    </View>
                  )}
                  <View style={styles.bannerEditIcon}>
                    <Feather name="camera" size={14} color="#FFF" />
                  </View>
                </TouchableOpacity>

                <View style={styles.avatarOverlap}>
                  <View style={styles.avatarPickerContainer}>
                    <TouchableOpacity
                      style={styles.avatarPicker}
                      activeOpacity={0.8}
                      onPress={pickAvatar}
                      disabled={isUploadingAvatar}
                    >
                      <LinearGradient
                        colors={["#7C3AED", "#A855F7"]}
                        style={styles.avatarPickerGrad}
                      >
                        {avatar ? (
                          <Image
                            source={{ uri: avatar }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <Feather name="user" size={32} color="#FFF" />
                        )}
                      </LinearGradient>
                      {isUploadingAvatar && (
                        <View style={styles.uploadOverlay}>
                          <ActivityIndicator color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.avatarEditIcon}
                      activeOpacity={0.9}
                      onPress={pickAvatar}
                    >
                      <Feather name="plus" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.avatarNameHint}>
                    {avatar ? t('setup.photo_updated') : t('setup.add_photo')}
                  </Text>
                </View>
              </View>

              {/* Referral Code Field */}
              <View style={styles.referralInputGroup}>
                <View style={styles.referralLabelRow}>
                  <Text style={styles.fieldLabel}>
                    {t('setup.referral_code')}
                  </Text>
                  {referralCode.length > 0 && (
                    <View style={styles.statusBadge}>
                      {isVerifyingReferral ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                        />
                      ) : isReferralValid ? (
                        <View style={styles.validBadge}>
                          <Feather
                            name="check-circle"
                            size={12}
                            color="#10B981"
                          />
                          <Text style={styles.buttonText}>{t("common.next")}</Text>
                        </View>
                      ) : (
                        <View style={styles.invalidBadge}>
                          <Feather name="x-circle" size={12} color="#EF4444" />
                          <Text style={styles.invalidText}>{t('setup.invalid')}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.fieldRow,
                    referralCode.length > 0 &&
                    !isReferralValid &&
                    !isVerifyingReferral && {
                      borderColor: "#EF4444",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Feather
                    name="gift"
                    size={16}
                    color={
                      referralCode.length > 0
                        ? isReferralValid
                          ? "#10B981"
                          : "#EF4444"
                        : "#94A3B8"
                    }
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={[styles.fieldInput, { textTransform: "uppercase" }]}
                    placeholder={t('setup.referral_placeholder')}
                    placeholderTextColor="#CBD5E1"
                    value={referralCode}
                    onChangeText={(val) => {
                      const upper = val.toUpperCase();
                      setReferralCode(upper);
                      if (upper.length >= 6) validateReferral(upper);
                      else setIsReferralValid(false);
                    }}
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                </View>
                <Text style={styles.referralHint}>
                  {t('setup.referral_hint')}
                </Text>
              </View>

              <Field
                icon="user"
                label={t('setup.full_name')}
                placeholder={t('setup.name_placeholder')}
                value={name}
                onChangeText={setName}
              />
              <Field
                icon="at-sign"
                label={t('setup.username')}
                placeholder={t('setup.username_placeholder')}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <Field
                icon="briefcase"
                label={t('setup.job_title')}
                placeholder={t('setup.job_placeholder')}
                value={jobTitle}
                onChangeText={setJobTitle}
              />
              <Field
                icon="home"
                label={t('setup.company')}
                placeholder={t('setup.company_placeholder')}
                value={company}
                onChangeText={setCompany}
              />

              {/* Birthday Section */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("setup.birthday_label")} *</Text>
                <View style={styles.birthdayRow}>
                  <View
                    style={[
                      styles.fieldRow,
                      { flex: 1, paddingHorizontal: 10 },
                    ]}
                  >
                    <TextInput
                      style={[styles.fieldInput, { textAlign: "center" }]}
                      placeholder="DD"
                      placeholderTextColor="#CBD5E1"
                      value={birthDay}
                      onChangeText={setBirthDay}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <View
                    style={[
                      styles.fieldRow,
                      { flex: 1.2, paddingHorizontal: 10 },
                    ]}
                  >
                    <TextInput
                      style={[styles.fieldInput, { textAlign: "center" }]}
                      placeholder="MM"
                      placeholderTextColor="#CBD5E1"
                      value={birthMonth}
                      onChangeText={setBirthMonth}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <View
                    style={[
                      styles.fieldRow,
                      { flex: 1.5, paddingHorizontal: 10 },
                    ]}
                  >
                    <TextInput
                      style={[styles.fieldInput, { textAlign: "center" }]}
                      placeholder="YYYY"
                      placeholderTextColor="#CBD5E1"
                      value={birthYear}
                      onChangeText={setBirthYear}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                </View>
                <Text style={styles.birthdayTip}>
                  Your age will be public, but your birthday remains private.
                </Text>
              </View>

              {/* Gender Picker */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("setup.gender_label")} *</Text>
                <View style={styles.genderRow}>
                  {["Male", "Female", "Non-binary", "Prefer not to say"].map(
                    (g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderChip,
                          gender === g && styles.genderChipActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          setGender(g);
                        }}
                      >
                        <Text
                          style={[
                            styles.genderText,
                            gender === g && styles.genderTextActive,
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </View>

              {/* City — GPS-enabled field */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>City *</Text>
                <View style={styles.cityRow}>
                  <LocationAutocomplete
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                    label={null}
                    icon="map-pin"
                    placeholder="e.g. San Francisco, CA"
                    value={city}
                    onChange={setCity}
                  />
                  <TouchableOpacity
                    style={styles.gpsBtn}
                    onPress={detectLocation}
                    disabled={gpsLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#6366F1", "#7C3AED"]}
                      style={styles.gpsBtnGrad}
                    >
                      {gpsLoading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Feather name="navigation" size={15} color="#FFF" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                {gpsLoading && (
                  <Text style={styles.gpsHint}>
                    📍 Detecting your location...
                  </Text>
                )}
              </View>

              <Field
                icon="edit-3"
                label="Short Bio"
                placeholder="What makes you interesting?"
                value={bio}
                onChangeText={setBio}
                multiline
              />
            </View>
          ) : null}

          {/* ── STEP 1: INTERESTS (INTERESTMANAGER.JS STYLE) ── */}
          {step === 1 ? (
            <View>
              {/* COUNTER BAR - Subtle */}
              <View style={styles.counterWrapSetup}>
                <View style={styles.counterRowSetup}>
                  <Text style={styles.counterLabelSetup}>
                    <Text
                      style={[
                        styles.counterNumSetup,
                        selectedInterests.length >= MAX_INTERESTS && {
                          color: theme.colors.error,
                        },
                      ]}
                    >
                      {selectedInterests.length}
                    </Text>
                    {"/"}
                    {MAX_INTERESTS} selected
                  </Text>
                </View>
                <View style={styles.progressTrackSetup}>
                  <View
                    style={[
                      styles.progressFillSetup,
                      {
                        width: `${pct}%`,
                        backgroundColor:
                          pct >= 90 ? theme.colors.error : theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Search */}
              <View style={styles.searchContainerSetup}>
                <View style={styles.searchBarSetup}>
                  <Feather
                    name="search"
                    size={16}
                    color={theme.colors.textMuted}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={styles.searchInputSetup}
                    placeholder="Search interests..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={search || ""}
                    onChangeText={setSearch}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")}>
                      <Feather
                        name="x-circle"
                        size={16}
                        color={theme.colors.textMuted}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Selected Grid - Horizontal scroll or Wrap */}
              {selectedInterests.length > 0 && (
                <View style={styles.selectedGridSetup}>
                  {selectedInterests.map((s, i) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.profileChipSetup,
                        { backgroundColor: IC_BG[i % IC_BG.length] },
                      ]}
                      onPress={() => toggleInterest(s)}
                    >
                      <Text
                        style={[
                          styles.profileChipTextSetup,
                          { color: IC_TEXT[i % IC_TEXT.length] },
                        ]}
                      >
                        {s}
                      </Text>
                      <Feather
                        name="x"
                        size={12}
                        color={IC_TEXT[i % IC_TEXT.length]}
                        style={{ marginLeft: 6 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Browse Categories */}
              <View style={styles.browseListSetup}>
                {filteredCategories.map((cat) => (
                  <View key={cat.id} style={styles.catBlockSetup}>
                    <TouchableOpacity
                      style={styles.catHeaderSetup}
                      onPress={() =>
                        setExpandedCat(expandedCat === cat.id ? null : cat.id)
                      }
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={cat.color || ["#F1F5F9", "#E2E8F0"]}
                        style={styles.catEmojiBgSetup}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.catEmojiSetup}>{cat.emoji}</Text>
                      </LinearGradient>
                      <View style={styles.catInfoSetup}>
                        <Text style={styles.catNameSetup}>{cat.name}</Text>
                        <Text style={styles.catCountSetup}>
                          {
                            cat.subInterests.filter((s) =>
                              selectedInterests.includes(s),
                            ).length
                          }
                          {" active"}
                        </Text>
                      </View>
                      <Feather
                        name={
                          expandedCat === cat.id ? "chevron-up" : "chevron-down"
                        }
                        size={18}
                        color={theme.colors.textMuted}
                      />
                    </TouchableOpacity>

                    {expandedCat === cat.id || !!search ? (
                      <View style={styles.subWrapSetup}>
                        {cat.subInterests.map((sub, i) => {
                          const isSelected = selectedInterests.includes(sub);
                          const disabled =
                            !isSelected &&
                            selectedInterests.length >= MAX_INTERESTS;
                          return (
                            <TouchableOpacity
                              key={i}
                              style={[
                                styles.subChipSetup,
                                isSelected && styles.subChipActiveSetup,
                                disabled && styles.subChipDisabledSetup,
                              ]}
                              onPress={() => !disabled && toggleInterest(sub)}
                              activeOpacity={disabled ? 1 : 0.7}
                            >
                              {isSelected && (
                                <Feather
                                  name="check"
                                  size={11}
                                  color="#FFF"
                                  style={{ marginRight: 6 }}
                                />
                              )}
                              <Text
                                style={[
                                  styles.subChipTextSetup,
                                  isSelected && styles.subChipTextActiveSetup,
                                  disabled && styles.subChipTextDisabledSetup,
                                ]}
                              >
                                {sub}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* ── STEP 2: LOOKING FOR ── */}
          {step === 2 ? (
            <View>
              <View style={styles.stepIntro}>
                <Text style={styles.stepIntroTitle}>
                  {t("setup.looking_for_title")}
                </Text>
                <Text style={styles.stepIntroSub}>
                  {t("setup.looking_for_sub")}
                </Text>
              </View>

              {LOOKING_FOR_OPTIONS.map((opt) => {
                const sel = lookingFor.includes(opt.label);
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.lfCard, sel && styles.lfCardSel]}
                    onPress={() => toggleLookingFor(opt.label)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.lfEmoji, sel && styles.lfEmojiSel]}>
                      <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                    </View>
                    <Text style={[styles.lfLabel, sel && styles.lfLabelSel]}>
                      {opt.label}
                    </Text>
                    {sel && (
                      <View style={styles.lfCheck}>
                        <Feather name="check" size={13} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              <View style={styles.readyBanner}>
                <Text style={styles.readyText}>
                  {t("setup.ready_text")}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BOTTOM CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {step === 0 && !canNext() && (
          <View style={styles.errorContainer}>
            {name.trim().length > 0 && name.trim().length < 3 && (
              <Text style={styles.errorHint}>• Name must be at least 3 characters</Text>
            )}
            {username.trim().length > 0 && !/^[a-zA-Z0-9_]{3,15}$/.test(username.trim()) && (
              <Text style={styles.errorHint}>• Username must be 3-15 chars (letters, numbers, _)</Text>
            )}
            {(birthDay.length > 0 || birthMonth.length > 0 || birthYear.length > 0) && (
              (() => {
                const d = parseInt(birthDay);
                const m = parseInt(birthMonth);
                const y = parseInt(birthYear);
                const cy = new Date().getFullYear();
                if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1940 || y > (cy - 13)) {
                  return <Text style={styles.errorHint}>• Enter a valid birthday (Min age 13)</Text>;
                }
                return null;
              })()
            )}
            {(!name.trim() || !username.trim() || !city.trim() || !birthDay || !birthMonth || birthYear.length !== 4) && (
              <Text style={styles.errorHint}>• Please fill all required (*) fields</Text>
            )}
          </View>
        )}
        {step === 1 && selectedInterests.length < 3 && (
          <Text style={styles.bottomHint}>
            {"Choose at least 3 interests to continue"}
          </Text>
        )}
        {step === 2 && lookingFor.length === 0 && (
          <Text style={styles.bottomHint}>
            {"Select at least one option to finish"}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            (!canNext() || isSubmitting || isUploading) && { opacity: 0.5 },
          ]}
          onPress={goNext}
          disabled={!canNext() || isSubmitting || isUploading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#7C3AED", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.ctaText}>
                {step < STEPS.length - 1 ? t("common.next") : "Finish & Explore! 🎉"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Reusable field component
function Field({ icon, label, placeholder, value, onChangeText, multiline }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldRow,
          multiline && { height: 90, alignItems: "flex-start", paddingTop: 14 },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color="#94A3B8"
          style={styles.fieldIcon}
        />
        <TextInput
          style={[styles.fieldInput, multiline && { textAlignVertical: "top" }]}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // HEADER
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  headerCenter: { marginBottom: 16 },
  headerStep: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontFamily: theme.typography.fontFamily.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: 4, backgroundColor: "#FFF", borderRadius: 2 },

  scroll: { padding: 20, paddingBottom: 120 },

  // STEP 0
  profileSection: { marginBottom: 30 },
  bannerContainer: {
    width: "100%",
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  bannerImg: { width: "100%", height: "100%" },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  bannerHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: theme.typography.fontFamily.bold,
  },
  bannerEditIcon: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  avatarOverlap: { alignItems: "center", marginTop: -50 },
  avatarPickerContainer: {
    width: 100,
    height: 100,
    position: "relative",
  },
  avatarPicker: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#F8FAFC",
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 4px 10px rgba(0,0,0,0.15)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
    }),
    elevation: 10,
  },
  avatarPickerGrad: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarEditIcon: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F8FAFC",
    elevation: 12,
    zIndex: 10,
  },
  avatarNameHint: {
    fontSize: 13,
    color: "#64748B",
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: 10,
  },
  referralInputGroup: {
    marginBottom: 24,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  referralLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  validBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  validText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#10B981",
  },
  invalidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  invalidText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#EF4444",
  },
  referralHint: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 8,
    lineHeight: 16,
  },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#475569",
    marginBottom: 8,
    marginLeft: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    height: 52,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontFamily: theme.typography.fontFamily.medium,
  },

  // Birthday
  birthdayRow: { flexDirection: "row", gap: 10 },
  birthdayTip: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 8,
    marginLeft: 2,
  },

  // Gender
  genderRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genderChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  genderChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#EEF2FF",
  },
  genderText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#64748B",
  },
  genderTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },

  // ── STEP 1: INTERESTS (MATCHING INTERESTMANAGER.JS) ──
  counterWrapSetup: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  counterRowSetup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  counterLabelSetup: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textMuted,
  },
  counterNumSetup: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  premiumChipSetup: {
    borderRadius: 10,
    overflow: "hidden",
  },
  premiumChipGradSetup: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  premiumChipTextSetup: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  progressTrackSetup: {
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFillSetup: {
    height: 6,
    borderRadius: 10,
  },
  searchContainerSetup: {
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  searchBarSetup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInputSetup: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
  selectedGridSetup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
    padding: 4,
  },
  profileChipSetup: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      web: { boxShadow: "0 1px 2px rgba(0,0,0,0.1)" },
    }),
  },
  profileChipTextSetup: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
  },
  browseListSetup: {
    gap: 12,
  },
  catBlockSetup: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    }),
  },
  catHeaderSetup: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  catEmojiBgSetup: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  catEmojiSetup: { fontSize: 24 },
  catInfoSetup: {
    flex: 1,
  },
  catNameSetup: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  catCountSetup: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily.medium,
  },
  errorContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  errorHint: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 2,
  },
  subWrapSetup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  subChipSetup: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  subChipActiveSetup: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subChipDisabledSetup: {
    opacity: 0.4,
  },
  subChipTextSetup: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  subChipTextActiveSetup: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
  },
  subChipTextDisabledSetup: {
    color: theme.colors.textMuted,
  },

  // GPS City field
  fieldWrap: { marginBottom: 16 },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cityInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    height: 52,
  },
  gpsBtn: {
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 4px 8px rgba(99,102,241,0.3)" },
      default: {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
    elevation: 5,
  },
  gpsBtnGrad: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  gpsHint: {
    fontSize: 12,
    color: "#6366F1",
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 6,
    marginLeft: 4,
  },

  // STEP 1 - INTERESTS
  stepIntro: { alignItems: "center", marginBottom: 20 },
  stepIntroTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
    marginBottom: 6,
  },
  stepIntroSub: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: "center",
    lineHeight: 20,
  },
  interestCounter: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 10,
  },
  interestCounterText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#7C3AED",
  },
  selectedWrap: { marginBottom: 16 },
  selectedLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  selectedChipText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  catBlock: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  catEmoji: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  catName: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },
  catSelected: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#7C3AED",
    marginRight: 4,
  },
  subChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  subChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  subChipSel: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subChipDisabled: { opacity: 0.4 },
  subChipText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#64748B",
  },
  subChipTextSel: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
  },

  // STEP 2 - LOOKING FOR
  lfCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#F1F5F9",
    gap: 14,
  },
  lfCardSel: { borderColor: theme.colors.primary, backgroundColor: "#EFF6FF" },
  lfEmoji: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  lfEmojiSel: { backgroundColor: "#DBEAFE" },
  lfLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0F172A",
  },
  lfLabelSel: { color: "#7C3AED" },
  lfCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  readyBanner: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  readyText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#166534",
    lineHeight: 21,
    textAlign: "center",
  },

  // BOTTOM BAR
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  bottomHint: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: "center",
    marginBottom: 10,
  },
  ctaBtn: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 6px 12px rgba(29,78,216,0.3)" },
      default: {
        shadowColor: "#1D4ED8",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }),
    elevation: 6,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  ctaGrad: { height: 56, justifyContent: "center", alignItems: "center" },
  ctaText: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
});
