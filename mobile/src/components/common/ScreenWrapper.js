import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';

/**
 * ScreenWrapper — Production-Grade Screen Container
 *
 * Handles safe area insets, StatusBar, and consistent padding.
 *
 * Props:
 *   children      {node}    Screen content
 *   statusStyle   {string}  'dark-content' | 'light-content' (default 'dark-content')
 *   bg            {string}  Background color (default theme.colors.background)
 *   edges         {array}   Which safe area edges to apply ['top','bottom','left','right']
 *   style         {object}  Extra style overrides
 *   noPadding     {bool}    Skip horizontal padding (for full-bleed layouts)
 */
export default function ScreenWrapper({
    children,
    statusStyle = 'dark-content',
    bg = theme.colors.background,
    edges = ['top', 'bottom'],
    style,
    noPadding = false,
}) {
    const insets = useSafeAreaInsets();

    const paddingStyle = {
        paddingTop: edges.includes('top') ? insets.top : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        paddingLeft: edges.includes('left') ? insets.left : 0,
        paddingRight: edges.includes('right') ? insets.right : 0,
    };

    return (
        <View style={[styles.root, { backgroundColor: bg }, paddingStyle, !noPadding && styles.horizontalPad, style]}>
            <StatusBar
                barStyle={statusStyle}
                backgroundColor={bg}
                translucent={Platform.OS === 'android'}
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    horizontalPad: {
        paddingHorizontal: theme.spacing.md,
    },
});
