import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { INTEREST_CATEGORIES } from "../../data/interests";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/authService";
import { useToast } from "../../context/ToastContext";

const MAX_FREE_INTERESTS = 30;
const DEFAULT_CUSTOM_CATEGORY = "Custom";

const normalizeText = (value = "") => value.trim().replace(/\s+/g, " ");

const toKey = (value = "") => normalizeText(value).toLowerCase();

const buildMergedCategories = (remoteCategories = []) => {
  const merged = new Map();

  INTEREST_CATEGORIES.forEach((cat, index) => {
    const key = toKey(cat.name || cat.id || `${index}`);
    merged.set(key, {
      id: cat.id || `static-${index}`,
      name: cat.name,
      emoji: cat.emoji || "✨",
      color: cat.color || ["#6366F1", "#8B5CF6"],
      subInterests: [
        ...new Set((cat.subInterests || []).map(normalizeText).filter(Boolean)),
      ],
    });
  });

  remoteCategories.forEach((cat, index) => {
    const categoryName = normalizeText(cat.category || cat.name || "");
    if (!categoryName) return;
    const remoteSubs = [
      ...new Set(
        (cat.subcategories || cat.subInterests || [])
          .map(normalizeText)
          .filter(Boolean),
      ),
    ];
    const key = toKey(categoryName);
    const existing = merged.get(key);

    if (existing) {
      existing.subInterests = [
        ...new Set([...existing.subInterests, ...remoteSubs]),
      ];
      merged.set(key, existing);
      return;
    }

    merged.set(key, {
      id: cat.id || `remote-${index}`,
      name: categoryName,
      emoji: "✨",
      color: ["#6366F1", "#8B5CF6"],
      subInterests: remoteSubs,
    });
  });

  return Array.from(merged.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};

export default function InterestManager({ navigation }) {
  const { user: authUser, updateUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const safeTop =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;

  const [selectedInterests, setSelectedInterests] = useState(
    authUser?.interests || [],
  );
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [customTag, setCustomTag] = useState("");
  const [view, setView] = useState("mine"); // 'mine' | 'browse'
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [categories, setCategories] = useState(INTEREST_CATEGORIES);

  const isPremium = authUser?.isPremium || false;
  const limit = isPremium ? Infinity : MAX_FREE_INTERESTS;
  const usedCount = selectedInterests.length;
  const isFull = usedCount >= limit;
  const pct = Math.min(100, (usedCount / MAX_FREE_INTERESTS) * 100);

  useEffect(() => {
    let isMounted = true;
    const loadInterests = async () => {
      try {
        const apiInterests = await authService.getInterests();
        if (!isMounted || !Array.isArray(apiInterests)) return;
        setCategories(buildMergedCategories(apiInterests));
      } catch (error) {
        if (!isMounted) return;
        setCategories(buildMergedCategories([]));
        showToast(
          t("common.info", "Info"),
          t("interests_manager.server_load_failed", "Using built-in interests. Server list could not be loaded."),
          "info",
        );
      }
    };

    loadInterests();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSet = useMemo(
    () => new Set(selectedInterests.map((name) => toKey(name))),
    [selectedInterests],
  );

  const toggleInterest = (name) => {
    const key = toKey(name);
    const exists = selectedSet.has(key);
    if (exists) {
      setSelectedInterests((prev) => prev.filter((i) => toKey(i) !== key));
    } else if (!isFull) {
      setSelectedInterests((prev) => [...prev, normalizeText(name)]);
    }
  };

  const addCustomTag = async () => {
    const tag = normalizeText(customTag);
    if (!tag) return;

    if (!isPremium) {
      showToast(
        t("premium.premium_only", "Premium Only"),
        t("interests_manager.custom_tags_premium", "Custom tags are available for premium members only."),
        "info",
      );
      return;
    }

    if (tag.length < 2 || tag.length > 40) {
      showToast(
        t("interests_manager.invalid_tag", "Invalid Tag"),
        t("interests_manager.tag_length_error", "Custom tag must be between 2 and 40 characters."),
        "error",
      );
      return;
    }

    if (selectedSet.has(toKey(tag))) {
      showToast(
        t("interests_manager.already_added", "Already Added"),
        t("interests_manager.already_added_msg", "This interest is already in your list."),
        "info",
      );
      return;
    }

    if (isFull) {
      showToast(
        t("interests_manager.limit_reached", "Limit Reached"),
        t("interests_manager.limit_reached_msg", "Please remove an interest before adding a new one."),
        "error",
      );
      return;
    }

    try {
      setIsAddingCustom(true);
      await authService.addCustomInterest(DEFAULT_CUSTOM_CATEGORY, tag);
      setSelectedInterests((prev) => [...prev, tag]);
      setCategories((prev) =>
        buildMergedCategories([
          ...prev.map((cat) => ({
            id: cat.id,
            category: cat.name,
            subcategories: cat.subInterests,
          })),
          { category: DEFAULT_CUSTOM_CATEGORY, subcategories: [tag] },
        ]),
      );
      setCustomTag("");
      showToast(t("common.success", "Success"), t("interests_manager.custom_tag_added", "Custom interest added."), "success");
    } catch (error) {
      const msg = error?.message || "Could not add custom interest";
      if (msg.toLowerCase().includes("already exists")) {
        setSelectedInterests((prev) => [...prev, tag]);
        setCustomTag("");
        showToast(
          t("common.info", "Info"),
          t("interests_manager.tag_exists_added", "Custom tag already exists. Added to your list."),
          "info",
        );
        return;
      }
      showToast(t("common.error"), msg, "error");
    } finally {
      setIsAddingCustom(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const normalizedInterests = [
        ...new Set(
          selectedInterests
            .map(normalizeText)
            .filter(Boolean)
            .map((name) => name.toLowerCase()),
        ),
      ].map((lowerName) =>
        selectedInterests.find(
          (name) => normalizeText(name).toLowerCase() === lowerName,
        ),
      );

      if (!isPremium && normalizedInterests.length > MAX_FREE_INTERESTS) {
        showToast(
          t("interests_manager.limit_reached", "Limit Reached"),
          t("interests_manager.limit_reached_count", {
            count: MAX_FREE_INTERESTS,
            defaultValue: `Free users can select up to ${MAX_FREE_INTERESTS} interests.`,
          }),
          "error",
        );
        return;
      }

      const selectedCategoryNames = categories
        .filter((cat) =>
          (cat.subInterests || []).some((sub) =>
            normalizedInterests.some((item) => toKey(item) === toKey(sub)),
          ),
        )
        .map((cat) => cat.name);

      await authService.updateProfile({
        interests: normalizedInterests,
        interestCategories: selectedCategoryNames,
      });

      await updateUser({
        interests: normalizedInterests,
        interestCategories: selectedCategoryNames,
      });

      showToast(t("common.success", "Success"), t("interests_manager.updated_toast", "Interests updated!"), "success");
      navigation.goBack();
    } catch (error) {
      showToast(t("common.error"), error.message || t("interests_manager.failed_save", "Could not save interests"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = search
    ? categories
        .map((cat) => ({
          ...cat,
          subInterests: cat.subInterests.filter((s) =>
            s.toLowerCase().includes(search.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.subInterests.length > 0)
    : categories;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: safeTop + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("interests_manager.title")}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || isAddingCustom}
          style={styles.saveBtn}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.saveBtnText,
              (isSaving || isAddingCustom) && { opacity: 0.5 },
            ]}
          >
            {isSaving ? t("common.saving", "Saving...") : t("common.done", "Done")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TABS - Modern Pill Style */}
      <View style={styles.tabContainer}>
        <View style={styles.tabsRow}>
          {["mine", "browse"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, view === t && styles.tabActive]}
              onPress={() => setView(t)}
              activeOpacity={0.9}
            >
              <Text
                style={[styles.tabText, view === t && styles.tabTextActive]}
              >
                {t === "mine" ? t("interests_manager.my_interests") : t("interests_manager.browse_all")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* COUNTER BAR - Subtle */}
      <View style={styles.counterWrap}>
        <View style={styles.counterRow}>
          <View style={styles.counterLeft}>
            <Text style={styles.counterLabel}>
              <Text
                style={[
                  styles.counterNum,
                  usedCount >= MAX_FREE_INTERESTS && {
                    color: theme.colors.error,
                  },
                ]}
              >
                {usedCount}
              </Text>
              /{isPremium ? "∞" : MAX_FREE_INTERESTS} {t("interests_manager.selected", "selected")}
            </Text>
          </View>
          {!isPremium && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Premium")}
              style={styles.premiumChip}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumChipGrad}
              >
                <Text style={styles.premiumChipText}>👑 {t("interests_manager.go_unlimited", "Go Unlimited")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        {!isPremium && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${pct}%`,
                  backgroundColor:
                    pct >= 90 ? theme.colors.error : theme.colors.primary,
                },
              ]}
            />
          </View>
        )}
      </View>

      {view === "mine" ? (
        <ScrollView
          contentContainerStyle={styles.myWrap}
          showsVerticalScrollIndicator={false}
        >
          {/* Custom tag input (Premium) */}
          {isPremium ? (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder={t("interests_manager.add_custom_placeholder", "Add a custom interest tag...")}
                placeholderTextColor={theme.colors.textMuted}
                value={customTag || ""}
                onChangeText={setCustomTag}
                onSubmitEditing={addCustomTag}
                editable={!isAddingCustom}
              />
              <TouchableOpacity
                style={styles.customAddBtn}
                onPress={addCustomTag}
                disabled={isAddingCustom}
              >
                <Feather name="plus" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.premiumBanner}
              onPress={() => navigation.navigate("Premium")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#6366F1", "#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumBannerGrad}
              >
                <View style={styles.glassEffect}>
                  <View style={styles.premiumContent}>
                    <View style={styles.premiumTextCol}>
                      <Text style={styles.premiumBannerTitle}>
                        {t("interests_manager.unlock_custom_tags")}
                      </Text>
                      <Text style={styles.premiumBannerText}>
                        {t("interests_manager.add_unlimited_desc")}
                      </Text>
                    </View>
                    <View style={styles.premiumArrow}>
                      <Feather name="chevron-right" size={20} color="#FFF" />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.myLabel}>{t("interests_manager.focus_title", "Interests Focus")}</Text>
            <Text style={styles.subLabel}>{t("interests_manager.tap_to_remove", "Tap to remove from your profile")}</Text>
          </View>

          <View style={styles.chipsWrap}>
            {selectedInterests.map((interest, i) => (
              <TouchableOpacity
                key={i}
                style={styles.myChip}
                onPress={() => toggleInterest(interest)}
                activeOpacity={0.7}
              >
                <Text style={styles.myChipText}>{interest}</Text>
                <View style={styles.chipClose}>
                  <Feather name="x" size={10} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
            {selectedInterests.length === 0 && (
              <View style={styles.emptyContainer}>
                <Feather
                  name="star"
                  size={40}
                  color={theme.colors.border}
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.emptyNote}>{t("interests_manager.no_interests_selected", "No interests selected yet.")}</Text>
                <TouchableOpacity onPress={() => setView("browse")}>
                  <Text style={styles.emptyCta}>{t("interests_manager.browse_to_add", "Browse to add some!")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {selectedInterests.length > 0 && (
            <TouchableOpacity
              style={styles.browseMoreBtn}
              onPress={() => setView("browse")}
            >
              <Feather
                name="plus-circle"
                size={18}
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.browseMoreText}>{t("interests_manager.explore_more", "Explore more categories")}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Feather
                name="search"
                size={16}
                color={theme.colors.textMuted}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={t("interests_manager.search_placeholder", "Search interests...")}
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.browseScroll}
          >
            {filteredCategories.map((cat) => (
              <View key={cat.id} style={styles.catBlock}>
                <TouchableOpacity
                  style={styles.catHeader}
                  onPress={() =>
                    setExpandedCategory(
                      expandedCategory === cat.id ? null : cat.id,
                    )
                  }
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={cat.color || ["#F1F5F9", "#E2E8F0"]}
                    style={styles.catEmojiBg}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  </LinearGradient>
                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catCount}>
                      {
                        cat.subInterests.filter((s) =>
                          selectedInterests.includes(s),
                        ).length
                      }{" "}
                      {t("interests_manager.active", "active")}
                    </Text>
                  </View>
                  <Feather
                    name={
                      expandedCategory === cat.id
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>

                {(expandedCategory === cat.id || search) && (
                  <View style={styles.subWrap}>
                    {cat.subInterests.map((sub, i) => {
                      const isSelected = selectedInterests.includes(sub);
                      const disabled = !isSelected && isFull;
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.subChip,
                            isSelected && styles.subChipActive,
                            disabled && styles.subChipDisabled,
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
                              styles.subChipText,
                              isSelected && styles.subChipTextActive,
                              disabled && styles.subChipTextDisabled,
                            ]}
                          >
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}

            {isFull && !isPremium && (
              <TouchableOpacity
                style={styles.limitBanner}
                onPress={() => navigation.navigate("Premium")}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#1e1b4b", "#312e81"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.limitBannerGrad}
                >
                  <Text style={styles.limitBannerText}>
                    {t("interests_manager.limit_banner_desc", "Reach your full potential with Premium and select unlimited interests.")}
                  </Text>
                  <View style={styles.limitBannerFooter}>
                    <Text style={styles.limitBannerCta}>{t("premium.upgrade_now", "Upgrade Now")}</Text>
                    <Feather name="arrow-right" size={14} color="#FFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#FFF",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },

  // TABS - PILL STYLE
  tabContainer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#FFF",
    ...theme.shadows.small,
  },
  tabText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },

  // COUNTER
  counterWrap: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  counterLeft: {
    flex: 1,
  },
  counterLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textMuted,
  },
  counterNum: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  premiumChip: {
    borderRadius: 10,
    overflow: "hidden",
  },
  premiumChipGrad: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  premiumChipText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 10,
  },

  // MY INTERESTS
  myWrap: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  customRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  customInput: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  customAddBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBanner: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  premiumBannerGrad: {
    width: "100%",
  },
  glassEffect: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
  },
  premiumContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  premiumTextCol: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    marginBottom: 4,
  },
  premiumBannerText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: "rgba(255, 255, 255, 0.9)",
  },
  premiumArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  myLabel: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textMuted,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  myChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  myChipText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  chipClose: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    width: "100%",
  },
  emptyNote: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 4,
  },
  emptyCta: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  browseMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
  },
  browseMoreText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },

  // BROWSE
  searchContainer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
  browseScroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  catBlock: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  catEmojiBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  catEmoji: { fontSize: 24 },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  catCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily.medium,
  },
  subWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  subChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  subChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subChipDisabled: {
    opacity: 0.4,
  },
  subChipText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  subChipTextActive: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
  },
  subChipTextDisabled: {
    color: theme.colors.textMuted,
  },
  limitBanner: {
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 12,
    ...theme.shadows.medium,
  },
  limitBannerGrad: {
    padding: 24,
  },
  limitBannerText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.medium,
    color: "#FFF",
    marginBottom: 16,
    lineHeight: 22,
    opacity: 0.9,
  },
  limitBannerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  limitBannerCta: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
});
