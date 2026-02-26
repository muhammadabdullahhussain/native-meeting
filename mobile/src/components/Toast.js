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
                            top: insets.top + 12,
                            opacity,
                            transform: [{ translateY }]
                        }
                    ]}
                >
                    <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={s.toastBlur}>
                        <LinearGradient colors={getColors()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.toastGrad} />
                        <View style={s.toastContent}>
                            <View style={s.toastIconBox}>
                                <Feather name={getIcon()} size={18} color="#FFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.toastTitle}>{toast.title}</Text>
                                {toast.sub && <Text style={s.toastSub}>{toast.sub}</Text>}
                            </View>
                            <TouchableOpacity onPress={hideToast} style={s.toastClose}>
                                <Feather name="x" size={14} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>
                        </View>
                    </BlurView>
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
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
            web: {
                boxShadow: '0px 10px 20px rgba(0,0,0,0.3)',
            }
        }),
    },
    toastBlur: { padding: 2 },
    toastGrad: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderRadius: 18,
    },
    toastIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    toastTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    toastSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
    toastClose: { padding: 4 },

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
