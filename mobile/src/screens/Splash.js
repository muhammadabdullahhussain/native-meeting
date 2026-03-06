import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

function GlowOrb({ color, size, left, top, delay, opacity: targetOpacity }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, targetOpacity] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
      }}
    />
  );
}

function LoadingIndicator() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration: 2800,
        useNativeDriver: true,
      }).start();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.loaderArea}>
      <View style={styles.loaderTrack}>
        <Animated.View
          style={[
            styles.loaderFill,
            { transform: [{ scaleX: progress }] },
          ]}
        >
          <LinearGradient
            colors={["#3B82F6", "#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={styles.loadingText}>LOADING</Text>
    </View>
  );
}

function LogoMark({ scaleAnim, opacityAnim }) {
  // Directly render the image instead of the complex animated ring
  return (
    <Animated.View
      style={[
        styles.logoWrapper,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export default function Splash({ navigation }) {
  const { isAuthenticated } = useAuth();
  const { width, height } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 15, friction: 8, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace(isAuthenticated ? "MainApp" : "Auth");
    }, 3500);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const orbs = [
    { color: "#3B82F6", size: 350, left: -150, top: -150, delay: 0, opacity: 0.1 },
    { color: "#8B5CF6", size: 280, left: width - 180, top: 40, delay: 500, opacity: 0.08 },
    { color: "#EC4899", size: 220, left: -60, top: height - 200, delay: 900, opacity: 0.06 },
    { color: "#6366F1", size: 180, left: width - 100, top: height - 120, delay: 300, opacity: 0.05 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#080E1D", "#0D1526", "#080E1D"]}
        style={[StyleSheet.absoluteFill, styles.gradientOverlay]}
      >
        {orbs.map((orb, i) => <GlowOrb key={i} {...orb} />)}

        <View style={styles.contentWrap}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LogoMark scaleAnim={fadeAnim} opacityAnim={fadeAnim} />

            <Text style={styles.appName}>BONDUS</Text>

            <View style={styles.separator}>
              <LinearGradient
                colors={["transparent", "rgba(139,92,246,0.3)", "transparent"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.line}
              />
              <View style={styles.dot} />
              <LinearGradient
                colors={["transparent", "rgba(236,72,153,0.3)", "transparent"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.line}
              />
            </View>

            <Text style={styles.tagline}>BUILDING STRONGER CONNECTIONS</Text>
          </Animated.View>
        </View>

        <LoadingIndicator />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080E1D" },
  gradientOverlay: {
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrap: {
    width: "100%",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
    marginTop: -50 // Nudge up slightly to better match "top-center" feel of screenshot
  },

  // ── LOGO ──────────────────────────────────────────────────────────
  logoWrapper: { marginBottom: 30, alignItems: "center", justifyContent: "center" },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 32, // Gives it that modern app icon curve
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
  },

  // ── BRANDING ──────────────────────────────────────────────────────
  appName: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
    textAlign: "center",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    width: "60%",
    gap: 8
  },
  line: { flex: 1, height: 0.5, borderRadius: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#8B5CF6" },
  tagline: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // ── LOADING ────────────────────────────────────────────────────────
  loaderArea: {
    position: "absolute",
    bottom: 80,
    width: "100%",
    alignItems: "center"
  },
  loaderTrack: {
    width: 140,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  loaderFill: { width: "100%", height: "100%", transformOrigin: "left" },
  loadingText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 3,
    fontWeight: "600"
  }
});
