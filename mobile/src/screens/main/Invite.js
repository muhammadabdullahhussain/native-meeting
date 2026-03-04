import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ModernPlaceholder } from "../../components/common/ModernPlaceholder";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Invite({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const referralCount = authUser?.referralCount || 0;
  const unlockedGroupPasses = authUser?.unlockedGroupPasses || 0;
  const referralCode = authUser?.referralCode || "INVITE";
  const referralLog = authUser?.referralLog || [];

  const nextMilestone = 3;
  const progress = (referralCount % 3) / 3;
  const remaining = Math.max(0, nextMilestone - (referralCount % 3));

  const handleShare = async () => {
    try {
      const testLink = `http://172.20.1.78:5001/join?code=${referralCode}`;
      const message = `Join me on Interesta! Use my code ${referralCode} to unlock premium features: ${testLink}`;
      const result = await Share.share({
        message,
        url: testLink, // iOS only
      });
      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      showToast("Error", "Could not share the link", "error");
    }
  };

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showToast(
        "Copied! 🔗",
        `Code ${referralCode} copied to clipboard.`,
        "success",
      );
    } catch (e) {
      showToast("Error", "Could not copy to clipboard.", "error");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1D3461", "#6366F1"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerNav}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Viral Referral</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Feather name="share-2" size={32} color="#FFF" />
          </View>
          <Text style={styles.headerHeading}>Invite friends, get perks</Text>
          <Text style={styles.headerSub}>
            Earn Group Passes and unlock custom tags by growing the community.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Statistics Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#F0F9FF", "#E0F2FE"]}
              style={styles.statIconBg}
            >
              <Feather name="users" size={20} color="#0EA5E9" />
            </LinearGradient>
            <Text style={styles.statValue}>{referralCount}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#F0FDF4", "#DCFCE7"]}
              style={styles.statIconBg}
            >
              <Feather name="trello" size={20} color="#10B981" />
            </LinearGradient>
            <Text style={styles.statValue}>{unlockedGroupPasses}</Text>
            <Text style={styles.statLabel}>Group Passes</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>
                Progress to next Group Pass
              </Text>
              <Text style={styles.progressSub}>
                Invite friends to unlock perks
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.progressValue}>{referralCount % 3}/3</Text>
            </View>
          </View>

          <View style={styles.track}>
            <LinearGradient
              colors={["#6366F1", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.fill, { width: `${progress * 100}%` }]}
            />
          </View>

          <View style={styles.milestoneRow}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneDot,
                    referralCount % 3 >= step && styles.milestoneDotActive,
                  ]}
                >
                  {referralCount % 3 >= step && (
                    <Feather name="check" size={10} color="#FFF" />
                  )}
                </View>
                <Text style={styles.milestoneLabel}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.hintBox}>
            <View style={styles.hintIconBg}>
              <Feather name="gift" size={14} color="#6366F1" />
            </View>
            <Text style={styles.hintText}>
              {remaining === 0
                ? "Check your wallet! You earned a Group Pass! 🎟️"
                : `Just ${remaining} more friend${remaining === 1 ? "" : "s"} to get a Group Pass!`}
            </Text>
          </View>
        </View>

        {/* Code Box */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR UNIQUE CODE</Text>
          <TouchableOpacity
            style={styles.codeContainer}
            onPress={copyToClipboard}
            activeOpacity={0.8}
          >
            <Text style={styles.codeText}>{referralCode}</Text>
            <View style={styles.copyBadge}>
              <Feather name="copy" size={14} color="#6366F1" />
              <Text style={styles.copyText}>Copy</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#6366F1", "#4F46E5"]}
            style={styles.shareGrad}
          >
            <Feather name="send" size={20} color="#FFF" />
            <Text style={styles.shareBtnText}>Share Invitation Link</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Referral Log */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            RECENTLY JOINED ({referralLog.length})
          </Text>
          {referralLog.length > 0 ? (
            <View style={styles.logList}>
              {referralLog.map((log, index) => (
                <View key={index} style={styles.logItem}>
                  <ModernPlaceholder
                    name={log.user?.name || "User"}
                    size={40}
                    style={{ borderRadius: 12 }}
                  />
                  <View style={styles.logInfo}>
                    <Text style={styles.logName}>
                      {log.user?.name || "New Member"}
                    </Text>
                    <Text style={styles.logDate}>
                      {new Date(log.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Joined</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyLog}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={48}
                color="#CBD5E1"
              />
              <Text style={styles.emptyLogText}>
                No referrals yet. Start inviting!
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingHorizontal: 24, paddingBottom: 32 },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  headerContent: { alignItems: "center" },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerHeading: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  scrollContent: { padding: 24 },
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    ...theme.shadows.medium,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#1E293B",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.bold,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    ...theme.shadows.medium,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#1E293B",
    marginBottom: 2,
  },
  progressSub: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  badgeContainer: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  progressValue: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#6366F1",
  },
  track: {
    height: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  fill: { height: "100%", borderRadius: 6 },

  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  milestoneItem: { alignItems: "center" },
  milestoneDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  milestoneDotActive: { backgroundColor: "#6366F1" },
  milestoneLabel: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#94A3B8",
    marginTop: 4,
  },

  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F5F3FF",
    padding: 14,
    borderRadius: 16,
  },
  hintIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.small,
  },
  hintText: {
    fontSize: 13,
    color: "#4F46E5",
    fontFamily: theme.typography.fontFamily.bold,
    flex: 1,
  },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeText: {
    fontSize: 28,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#1E293B",
    letterSpacing: 4,
  },
  copyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  copyText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#6366F1",
  },

  shareBtn: {
    height: 60,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 40,
    ...theme.shadows.primary,
  },
  shareGrad: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  shareBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
  },

  logList: { backgroundColor: "#FFF", borderRadius: 24, padding: 8 },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  logInfo: { flex: 1, marginLeft: 12 },
  logName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#1E293B",
  },
  logDate: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#16A34A",
  },

  emptyLog: { alignItems: "center", paddingVertical: 40 },
  emptyLogText: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
  },
});
