import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function DeleteAccountModal({ visible, onClose, onDeleteDelted }) {
    const [confirmText, setConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // The user must type exactly "DELETE" to enable the button
    const isReady = confirmText === 'DELETE';

    const handleDelete = async () => {
        if (!isReady) return;
        setIsLoading(true);
        try {
            await onDeleteDelted();
        } catch (err) {
            // Error handled by parent usually
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setConfirmText('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={s.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={s.sheet}>
                    <View style={s.header}>
                        <View style={s.warningIconBox}>
                            <Feather name="alert-triangle" size={24} color="#DC2626" />
                        </View>
                        <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                            <Feather name="x" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <Text style={s.title}>Delete Account?</Text>
                    <Text style={s.subtitle}>
                        This action is <Text style={{ fontFamily: theme.typography.fontFamily.bold, color: '#DC2626' }}>irreversible</Text>. All your data will be permanently wiped, including:
                    </Text>

                    <View style={s.bulletPoints}>
                        <View style={s.bulletRow}>
                            <Feather name="x" size={16} color="#DC2626" />
                            <Text style={s.bulletText}>All your messages & chat history</Text>
                        </View>
                        <View style={s.bulletRow}>
                            <Feather name="x" size={16} color="#DC2626" />
                            <Text style={s.bulletText}>Your connections and group memberships</Text>
                        </View>
                        <View style={s.bulletRow}>
                            <Feather name="x" size={16} color="#DC2626" />
                            <Text style={s.bulletText}>Your premium status and group passes</Text>
                        </View>
                    </View>

                    <Text style={s.typePrompt}>
                        To confirm, please type <Text style={{ fontFamily: theme.typography.fontFamily.bold, color: '#0F172A' }}>DELETE</Text> below:
                    </Text>

                    <TextInput
                        style={s.input}
                        placeholder="Type DELETE"
                        placeholderTextColor="#94A3B8"
                        value={confirmText}
                        onChangeText={setConfirmText}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />

                    <View style={s.actionRow}>
                        <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
                            <Text style={s.cancelBtnText}>Keep Account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[s.deleteBtn, !isReady && s.deleteBtnDisabled]}
                            disabled={!isReady || isLoading}
                            onPress={handleDelete}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={s.deleteBtnText}>Delete Forever</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    warningIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

    title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', marginBottom: 8 },
    subtitle: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: '#64748B', lineHeight: 22, marginBottom: 20 },

    bulletPoints: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 20, gap: 12 },
    bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bulletText: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: '#334155', flex: 1 },

    typePrompt: { fontSize: 13, fontFamily: theme.typography.fontFamily.medium, color: '#64748B', marginBottom: 8 },
    input: { height: 52, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#0F172A', backgroundColor: '#F8FAFC', marginBottom: 24, textAlign: 'center', letterSpacing: 2 },

    actionRow: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#475569' },

    deleteBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center' },
    deleteBtnDisabled: { backgroundColor: '#FCA5A5' },
    deleteBtnText: { fontSize: 15, fontFamily: theme.typography.fontFamily.bold, color: '#FFF' },
});
