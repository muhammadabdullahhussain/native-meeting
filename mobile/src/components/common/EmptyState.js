import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
                <LinearGradient
                    colors={['#F8FAFC', '#F1F5F9']}
                    style={styles.compactIcon}
                >
                    <Feather name={icon} size={18} color={theme.colors.primary} />
                </LinearGradient>
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
            <View style={styles.illustration}>
                <LinearGradient
                    colors={['#EEF2FF', '#E0E7FF']}
                    style={styles.iconCircle}
                >
                    <Feather name={icon} size={42} color={theme.colors.primary} />
                </LinearGradient>
                <View style={styles.decoration1} />
                <View style={styles.decoration2} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity activeOpacity={0.8} onPress={onAction}>
                    <LinearGradient
                        colors={[theme.colors.primary, '#4F46E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionButton}
                    >
                        <Text style={styles.actionText}>{actionLabel}</Text>
                        <Feather name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                    </LinearGradient>
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
        backgroundColor: 'transparent',
    },
    illustration: {
        position: 'relative',
        marginBottom: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 5,
            },
            web: {
                boxShadow: `0 10px 20px -5px ${theme.colors.primary}20`,
            }
        }),
        zIndex: 2,
    },
    decoration1: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        zIndex: 1,
    },
    decoration2: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#F8FAFC',
        zIndex: 0,
    },
    title: {
        fontSize: 22,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        fontFamily: theme.typography.fontFamily.medium,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: '85%',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: `0 4px 12px ${theme.colors.primary}40`,
            }
        }),
    },
    actionText: {
        color: '#FFFFFF',
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: 16,
    },
    // Compact version
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    compactIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    compactText: {
        flex: 1,
    },
    compactTitle: {
        fontSize: 15,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#334155',
        marginBottom: 2,
    },
    compactSub: {
        fontSize: 13,
        fontFamily: theme.typography.fontFamily.medium,
        color: '#94A3B8',
    },
    compactAction: {
        paddingLeft: 12,
    },
    compactActionText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary,
    }
});
