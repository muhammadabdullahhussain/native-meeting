import React, { useState, useRef } from 'react';
import {
    View, TextInput, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

/**
 * AppInput — Production-Grade Reusable Text Input
 *
 * Props:
 *   label         {string}   Field label
 *   placeholder   {string}   Placeholder text
 *   value         {string}   Controlled value
 *   onChangeText  {fn}       Change handler
 *   icon          {string}   Feather icon name (optional)
 *   type          {string}   'text' | 'email' | 'password' | 'phone' | 'number'
 *   error         {string}   Error message string (shows below)
 *   helper        {string}   Helper text (shows below, gray)
 *   disabled      {bool}
 *   multiline     {bool}     Enables textarea mode
 *   maxLength     {number}
 *   style         {object}   Override container style
 */
export default function AppInput({
    label,
    placeholder,
    value,
    onChangeText,
    icon,
    type = 'text',
    error,
    helper,
    disabled = false,
    multiline = false,
    maxLength,
    style,
    ...rest
}) {
    const [focused, setFocused] = useState(false);
    const [secureEntry, setSecureEntry] = useState(type === 'password');
    const borderAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        setFocused(true);
        Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    };

    const handleBlur = () => {
        setFocused(false);
        Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [error ? '#FCA5A5' : '#E2E8F0', error ? '#EF4444' : '#6366F1'],
    });

    const keyboardTypeMap = {
        email: 'email-address',
        phone: 'phone-pad',
        number: 'numeric',
    };

    return (
        <View style={[styles.wrapper, style]}>
            {label && (
                <Text style={[styles.label, error && styles.labelError]}>
                    {label}
                </Text>
            )}

            <Animated.View style={[
                styles.inputBox,
                { borderColor },
                focused && styles.inputBoxFocused,
                disabled && styles.inputBoxDisabled,
                multiline && styles.inputBoxMulti,
            ]}>
                {icon && (
                    <Feather
                        name={icon}
                        size={17}
                        color={focused ? '#6366F1' : '#94A3B8'}
                        style={styles.icon}
                    />
                )}

                <TextInput
                    style={[styles.input, multiline && styles.inputMulti]}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={secureEntry}
                    keyboardType={keyboardTypeMap[type] || 'default'}
                    autoCapitalize={type === 'email' ? 'none' : 'sentences'}
                    editable={!disabled}
                    multiline={multiline}
                    maxLength={maxLength}
                    {...rest}
                />

                {type === 'password' && (
                    <TouchableOpacity
                        onPress={() => setSecureEntry(p => !p)}
                        style={styles.eyeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Feather name={secureEntry ? 'eye' : 'eye-off'} size={17} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </Animated.View>

            {(error || helper) && (
                <View style={styles.bottomRow}>
                    {error && <Feather name="alert-circle" size={12} color="#EF4444" style={{ marginRight: 4 }} />}
                    <Text style={error ? styles.errorText : styles.helperText}>
                        {error || helper}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginBottom: 16 },

    label: {
        fontSize: 13,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#475569',
        marginBottom: 7,
        marginLeft: 2,
    },
    labelError: { color: '#EF4444' },

    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.sm + 4,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        height: 52,
    },
    inputBoxFocused: {
        backgroundColor: '#F8FAFF',
    },
    inputBoxDisabled: {
        backgroundColor: '#F8FAFC',
        opacity: 0.6,
    },
    inputBoxMulti: {
        height: 100,
        alignItems: 'flex-start',
        paddingTop: 14,
    },

    icon: { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#0F172A',
        fontFamily: theme.typography.fontFamily.medium,
    },
    inputMulti: { textAlignVertical: 'top' },
    eyeBtn: { padding: 4 },

    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginLeft: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        fontFamily: theme.typography.fontFamily.medium,
        flex: 1,
    },
    helperText: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: theme.typography.fontFamily.medium,
    },
});
