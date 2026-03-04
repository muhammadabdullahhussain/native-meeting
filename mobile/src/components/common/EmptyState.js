import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export const EmptyState = ({ 
    icon = 'search', 
    title = 'No results found', 
    description = 'Try adjusting your filters or search term.',
    actionLabel,
    onAction,
    style,
    compact = false
}) => {
    if (compact) {
        return (
            <View style={[styles.compactContainer, style]}>
                <View style={styles.compactIcon}>
                    <Feather name={icon} size={20} color="#94A3B8" />
                </View>
                <View style={styles.compactText}>
                    <Text style={styles.compactTitle}>{title}</Text>
                    <Text style={styles.compactSub}>{description}</Text>
                </View>
                {actionLabel && onAction && (
                    <TouchableOpacity style={styles.compactAction} onPress={onAction}>
                        <Text style={styles.compactActionText}>{actionLabel}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconContainer}>
                <Feather name={icon} size={42} color="#CBD5E1" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 20,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.medium,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    actionButton: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
    },
    actionText: {
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: 15,
    },
    // Compact version (for horizontal scrolls)
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderStyle: 'dashed',
    },
    compactIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    compactText: {
        flex: 1,
    },
    compactTitle: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#475569',
        marginBottom: 2,
    },
    compactSub: {
        fontSize: 12,
        fontFamily: theme.typography.fontFamily.medium,
        color: '#94A3B8',
    },
    compactAction: {
        paddingLeft: 12,
    },
    compactActionText: {
        fontSize: 13,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary,
    }
});
