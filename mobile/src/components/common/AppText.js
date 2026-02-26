import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

/**
 * AppText — Standardized Typography Component
 *
 * Variants:
 *   'h1'      — 32px Bold
 *   'h2'      — 24px Bold
 *   'h3'      — 20px Bold
 *   'title'   — 18px Bold
 *   'body'    — 15px Regular (default)
 *   'caption' — 13px Regular
 *   'small'   — 11px Regular
 *   'label'   — 13px Bold (for form labels)
 *
 * Props:
 *   variant   {string}  One of the above
 *   color     {string}  Custom color
 *   muted     {bool}    Sets color to muted gray
 *   bold      {bool}    Forces bold
 *   center    {bool}    Centers text
 *   style     {object}  Extra overrides
 */
export default function AppText({
    children,
    variant = 'body',
    color,
    muted = false,
    bold = false,
    center = false,
    style,
    ...rest
}) {
    return (
        <Text
            style={[
                styles.base,
                styles[variant],
                muted && styles.muted,
                bold && styles.forceBold,
                center && styles.center,
                color && { color },
                style,
            ]}
            {...rest}
        >
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    base: {
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text,
    },
    h1: {
        fontSize: theme.typography.sizes.h1,
        fontFamily: theme.typography.fontFamily.bold,
        lineHeight: 40,
    },
    h2: {
        fontSize: theme.typography.sizes.h2,
        fontFamily: theme.typography.fontFamily.bold,
        lineHeight: 32,
    },
    h3: {
        fontSize: theme.typography.sizes.h3,
        fontFamily: theme.typography.fontFamily.bold,
        lineHeight: 28,
    },
    title: {
        fontSize: theme.typography.sizes.title,
        fontFamily: theme.typography.fontFamily.bold,
        lineHeight: 26,
    },
    body: {
        fontSize: theme.typography.sizes.body,
        fontFamily: theme.typography.fontFamily.regular,
        lineHeight: 22,
    },
    caption: {
        fontSize: theme.typography.sizes.caption,
        fontFamily: theme.typography.fontFamily.regular,
        lineHeight: 18,
    },
    small: {
        fontSize: theme.typography.sizes.small,
        fontFamily: theme.typography.fontFamily.regular,
        lineHeight: 16,
    },
    label: {
        fontSize: theme.typography.sizes.caption,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#475569',
        letterSpacing: 0.3,
    },
    muted: { color: theme.colors.textMuted },
    forceBold: { fontFamily: theme.typography.fontFamily.bold },
    center: { textAlign: 'center' },
});
