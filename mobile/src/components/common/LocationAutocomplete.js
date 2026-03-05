import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
  Keyboard,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { API_BASE_URL } from "../../config";

/**
 * LocationAutocomplete — Premium City Search Component
 * Uses photon.komoot.io (OpenStreetMap-based free API)
 */
export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Search City...",
  label = "City",
  icon = "map-pin",
  containerStyle,
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync internal state with external value if it changes from outside (e.g. GPS)
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  const searchLocation = async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      hideDropdown();
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const resp = await fetch(
        `${API_BASE_URL}/location/search?q=${encodeURIComponent(text)}`,
        { signal: controller.signal }
      );
      const data = await resp.json();
      
      if (!data || !data.features) {
        setSuggestions([]);
        hideDropdown();
        return;
      }

      const results = data.features.map((f) => {
        const p = f.properties;
        const name = p.name;
        const region = p.state || p.region;
        const country = p.country;
        
        let label = name;
        if (region) label += `, ${region}`;
        if (country) label += `, ${country}`;
        
        return {
          id: f.geometry.coordinates.join(","),
          label,
          name,
          region,
          country,
        };
      });

      setSuggestions(results);
      if (results.length > 0) revealDropdown();
      else hideDropdown();
    } catch (e) {
      if (e.name === "AbortError") return;
      console.error("Location search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text) => {
    setQuery(text);
    onChange(text); // Update parent immediately

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      searchLocation(text);
    }, 200);
  };

  const selectSuggestion = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery(item.label);
    onChange(item.label);
    setSuggestions([]);
    hideDropdown();
    Keyboard.dismiss();
  };

  const revealDropdown = () => {
    setShowDropdown(true);
    Animated.spring(dropdownAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowDropdown(false));
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
        {icon ? (
          <Feather
            name={icon}
            size={16}
            color={focused ? "#6366F1" : "#94A3B8"}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={[styles.input, Platform.OS === 'web' && { outline: 'none' }]}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          value={query}
          onChangeText={handleTextChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            // Delay hide to allow selection
            setTimeout(() => {
              if (showDropdown) hideDropdown();
            }, 200);
          }}
        />
        {loading && <ActivityIndicator size="small" color="#6366F1" />}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={() => handleTextChange("")}>
            <Feather name="x" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              top: label ? 78 : 56, // Adjust based on label presence
              opacity: dropdownAnim,
              transform: [
                {
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {suggestions.length > 0 ? (
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={`${item.id}-${index}`}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <View style={styles.suggestionIconBox}>
                    <Feather name="map-pin" size={12} color="#6366F1" />
                  </View>
                  <View style={styles.suggestionDetails}>
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionSub} numberOfLines={1}>
                      {[item.region, item.country].filter(Boolean).join(", ")}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No cities found</Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  label: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#475569",
    marginBottom: 7,
    marginLeft: 2,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    height: 52,
  },
  inputBoxFocused: {
    borderColor: "#6366F1",
    backgroundColor: "#F8FAFF",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontFamily: theme.typography.fontFamily.medium,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    zIndex: 2000,
    maxHeight: 250,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }
    }),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  list: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  suggestionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  suggestionDetails: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    color: "#1E293B",
    fontFamily: theme.typography.fontFamily.bold,
  },
  suggestionSub: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 1,
  },
  noResults: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "#94A3B8",
    fontFamily: theme.typography.fontFamily.medium,
  },
});
