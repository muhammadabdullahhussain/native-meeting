import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';

/**
 * AppButton — Production-Grade Reusable Button
 *
 * Variants:
 *   'primary'  — Indigo-Purple Gradient (default)
 *   'secondary'— Blue gradient
 *   'outlined' — White bg with border
 *   'ghost'    — No border, transparent
 *   'danger'   — Red gradient
 *
 * Props:
 *   label       {string}   Button text
 *   onPress     {fn}       Press handler
 *   variant     {string}   'primary' | 'secondary' | 'outlined' | 'ghost' | 'danger'
 *   loading     {bool}     Shows spinner when true
 *   disabled    {bool}     Disables interaction
 *   size        {string}   'sm' | 'md' (default) | 'lg'
 *   icon        {node}     Optional left icon element
 *   fullWidth   {bool}     Stretch to container width (default true)
 *   style       {object}   Extra container styles
 */
export default function AppButton({
    label,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    size = 'md',
    icon = null,
    fullWidth = true,
    style,
}) {
    const isDisabled = disabled || loading;

    const handlePress = () => {
        if (isDisabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    const height = size === 'sm' ? 42 : size === 'lg' ? 60 : 52;
    const fontSize = size === 'sm' ? 13 : size === 'lg' ? 18 : 16;

    const gradientMap = {
        primary: ['#6366F1', '#7C3AED'],
        secondary: ['#1D4ED8', '#6366F1'],
        danger: ['#EF4444', '#DC2626'],
    };

    const isGradient = ['primary', 'secondary', 'danger'].includes(variant);

    const containerStyle = [
        styles.base,
        { height, width: fullWidth ? '100%' : undefined },
        variant === 'outlined' && styles.outlined,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
    ];

    const content = (
        <View style={styles.innerRow}>
            {loading ? (
                <ActivityIndicator color={isGradient ? '#FFF' : theme.colors.primary} size="small" />
            ) : (
                <>
                    {icon && <View style={styles.iconWrap}>{icon}</View>}
                    <Text style={[
                        styles.label,
                        { fontSize },
                        isGradient && styles.labelLight,
                        variant === 'outlined' && styles.labelOutlined,
                        variant === 'ghost' && styles.labelGhost,
                        isDisabled && styles.labelDisabled,
                    ]}>
                        {label}
                    </Text>
                </>
            )}
        </View>
    );

    if (isGradient) {
        return (
            <TouchableOpacity
                style={[containerStyle, { borderRadius: theme.borderRadius.md, overflow: 'hidden' }]}
                onPress={handlePress}
                activeOpacity={0.85}
                disabled={isDisabled}
            >
                <LinearGradient
                    colors={isDisabled ? ['#CBD5E1', '#CBD5E1'] : gradientMap[variant]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradient, { height }]}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[containerStyle, { borderRadius: theme.borderRadius.md }]}
            onPress={handlePress}
            activeOpacity={0.8}
            disabled={isDisabled}
        >
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
    },
    gradient: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    outlined: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        shadowOpacity: 0.05,
    },
    ghost: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    disabled: {
        opacity: 0.55,
    },
    innerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconWrap: {
        marginRight: 2,
    },
    label: {
        fontFamily: theme.typography.fontFamily.bold,
        letterSpacing: 0.2,
    },
    labelLight: { color: '#FFFFFF' },
    labelOutlined: { color: theme.colors.text },
    labelGhost: { color: theme.colors.primary },
    labelDisabled: { color: '#94A3B8' },
});
