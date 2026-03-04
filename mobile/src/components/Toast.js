import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, Animated, Dimensions,
    TouchableOpacity, Modal, Platform, Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '../context/ToastContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// ─── PREMIUM TOAST COMPONENT ──────────────────────────────────────────────────
export const Toast = () => {
    const { toast, hideToast, confirm, hideConfirm } = useToast();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-200)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // Local state to keep modal content stable during exit animation
    const [lastConfirm, setLastConfirm] = useState(null);

    useEffect(() => {
        if (confirm) {
            setLastConfirm(confirm);
        }
    }, [confirm]);

    // Derived config for the modal - uses current confirm if exists, else last one
    const activeConfirm = confirm || lastConfirm;

    useEffect(() => {
        if (toast) {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: Platform.OS !== 'web',
                    friction: 9,
                    tension: 50
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: Platform.OS !== 'web'
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -200,
                    duration: 300,
                    useNativeDriver: Platform.OS !== 'web'
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: Platform.OS !== 'web'
                })
            ]).start();
        }
    }, [toast]);

    const getIcon = () => {
        switch (toast?.type) {
            case 'success': return 'check-circle';
            case 'error': return 'x-circle';
            default: return 'info';
        }
    };

    const getColors = () => {
        switch (toast?.type) {
            case 'success': return ['#10B981', '#059669'];
            case 'error': return ['#EF4444', '#DC2626'];
            default: return ['#334155', '#0F172A'];
        }
    };

    return (
        <>
            {/* TOAST NOTIFICATION */}
            {toast && (
                <Animated.View
                    style={[
                        s.toastRoot,
                        {
                            top: insets.top + 16,
                            opacity,
                            transform: [{ translateY }]
                        }
                    ]}
                >
                    <View style={s.toastWrapper}>
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
                        ) : (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.95)' }]} />
                        )}
                        <View style={s.toastInner}>
                            <View style={[s.toastIconBox, { backgroundColor: getColors()[0] + '20' }]}>
                                <Feather name={getIcon()} size={20} color={getColors()[0]} />
                            </View>
                            <View style={s.toastTextContainer}>
                                <Text style={s.toastTitle}>{toast.title}</Text>
                                {toast.sub && <Text style={s.toastSub} numberOfLines={2}>{toast.sub}</Text>}
                            </View>
                            <TouchableOpacity onPress={hideToast} style={s.toastClose} activeOpacity={0.6}>
                                <Feather name="x" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        {/* Subtle left border accent */}
                        <View style={[s.toastAccentStyle, { backgroundColor: getColors()[0] }]} />
                    </View>
                </Animated.View>
            )}

            {/* PREMIUM ACTION MODAL */}
            <Modal visible={!!confirm} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <Animated.View style={s.modalCard}>
                        <View style={s.modalHeader}>
                            <View style={[s.modalIconBox, activeConfirm?.confirmStyle === 'destructive' && { backgroundColor: '#FEF2F2' }]}>
                                <Feather
                                    name={activeConfirm?.confirmStyle === 'destructive' ? 'trash-2' : 'help-circle'}
                                    size={24}
                                    color={activeConfirm?.confirmStyle === 'destructive' ? '#EF4444' : '#6366F1'}
                                />
                            </View>
                        </View>

                        <Text style={s.modalTitle}>{activeConfirm?.title || 'Are you sure?'}</Text>
                        <Text style={s.modalMessage}>{activeConfirm?.message}</Text>

                        <View style={s.modalFooter}>
                            <TouchableOpacity style={s.cancelBtn} onPress={hideConfirm} activeOpacity={0.7}>
                                <Text style={s.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.confirmBtn, activeConfirm?.confirmStyle === 'destructive' && { backgroundColor: '#EF4444' }]}
                                onPress={async () => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    hideConfirm();
                                    if (activeConfirm?.onConfirm) await activeConfirm.onConfirm();
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={s.confirmBtnText}>{activeConfirm?.confirmText || 'Confirm'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const s = StyleSheet.create({
    // TOAST
    toastRoot: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    toastWrapper: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        ...Platform.select({
            ios: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
            },
            android: {
                elevation: 12,
            },
            web: {
                boxShadow: '0px 12px 24px rgba(15,23,42,0.15)',
            }
        }),
    },
    toastInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        paddingLeft: 20,
    },
    toastAccentStyle: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    toastIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    toastTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    toastTitle: {
        color: '#0F172A',
        fontSize: 15,
        fontFamily: 'Inter_700Bold', /* Assuming we are keeping with the theme font weights, alternatively fontWeight: 'bold' */
        fontWeight: '700',
        marginBottom: 2,
    },
    toastSub: {
        color: '#64748B',
        fontSize: 13,
        lineHeight: 18,
    },
    toastClose: {
        padding: 8,
        marginLeft: 8,
    },

    // MODAL
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFF',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.4,
                shadowRadius: 30,
            },
            android: {
                elevation: 20,
            },
            web: {
                boxShadow: '0px 20px 30px rgba(0,0,0,0.4)',
            }
        }),
    },
    modalHeader: { marginBottom: 20 },
    modalIconBox: {
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    cancelBtnText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#6366F1',
        alignItems: 'center',
    },
    confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
