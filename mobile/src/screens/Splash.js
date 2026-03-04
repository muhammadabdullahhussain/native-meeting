import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";

const { width } = Dimensions.get("window");

// Floating interest bubbles for visual identity
const INTEREST_BUBBLES = [
  { label: "Chess ♟️", x: 0.08, y: 0.15, size: 90, delay: 100 },
  { label: "Coffee ☕", x: 0.72, y: 0.12, size: 86, delay: 200 },
  { label: "AI & ML 🤖", x: 0.62, y: 0.28, size: 80, delay: 300 },
  { label: "Hiking 🏕️", x: 0.05, y: 0.35, size: 77, delay: 150 },
  { label: "Jazz 🎵", x: 0.78, y: 0.55, size: 74, delay: 250 },
  { label: "Startups 🚀", x: 0.04, y: 0.62, size: 94, delay: 50 },
  { label: "Design 🎨", x: 0.68, y: 0.72, size: 80, delay: 350 },
  { label: "Travel ✈️", x: 0.1, y: 0.78, size: 76, delay: 200 },
];

function FloatingBubble({
  label,
  x,
  y,
  size,
  delay,
  screenWidth,
  screenHeight,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.18,
          duration: 700,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          left: x * screenWidth - size / 2,
          top: y * screenHeight,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.bubbleText}>{label}</Text>
    </Animated.View>
  );
}

export default function Splash({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 12,
          friction: 3,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();

    const timer = setTimeout(() => navigation.replace("Auth"), 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={["#0F172A", "#1D3461", "#1D4ED8"]}
      style={styles.container}
    >
      {/* Floating interest bubbles */}
      {INTEREST_BUBBLES.map((b, i) => (
        <FloatingBubble
          key={i}
          {...b}
          screenWidth={width}
          screenHeight={screenHeight}
        />
      ))}

      {/* Center logo */}
      <Animated.View
        style={[
          styles.center,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Logo Icon */}
        <View style={styles.logoRing}>
          <LinearGradient
            colors={["#3B82F6", "#7C3AED"]}
            style={styles.logoGrad}
          >
            <Text style={styles.logoEmoji}>🔗</Text>
          </LinearGradient>
        </View>

        <Text style={styles.appName}>Interesta</Text>

        <Animated.View style={{ opacity: taglineAnim }}>
          <Text style={styles.tagline}>Connect through what you love</Text>
          <View style={styles.dotsRow}>
            {["Chess", "Coffee", "Hiking"].map((t, i) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{t}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </Animated.View>

      {/* Bottom loading dots */}
      <View style={styles.loadingRow}>
        {[0, 1, 2].map((i) => (
          <LoadingDot key={i} delay={i * 200} />
        ))}
      </View>
    </LinearGradient>
  );
}

function LoadingDot({ delay }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
      ).start();
    }, delay);
  }, []);
  return <Animated.View style={[styles.loadingDot, { opacity }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },

  // BUBBLES
  bubble: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  bubbleText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    textAlign: "center",
  },

  // CENTER
  center: { alignItems: "center", zIndex: 10 },
  logoRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 4,
    marginBottom: 24,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoGrad: {
    flex: 1,
    borderRadius: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  logoEmoji: { fontSize: 44 },
  appName: {
    fontSize: 44,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: "center",
    marginBottom: 18,
  },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  tagChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  tagChipText: {
    fontSize: 12,
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
  },

  // LOADING
  loadingRow: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
});
