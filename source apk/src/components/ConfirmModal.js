import React from 'react';
import {
    View, Text, TouchableOpacity, Modal, StyleSheet,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme';

export default function ConfirmModal({ visible, onClose, title, message, confirmText, cancelText, onConfirm, confirmStyle }) {
    const isDestructive = confirmStyle === 'destructive';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.centeredView}
                >
                    <View style={styles.modalContent}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.iconWrap}>
                            <View style={[styles.iconCircle, isDestructive && styles.iconCircleDestructive]}>
                                <Ionicons
                                    name={isDestructive ? 'warning' : 'help-circle'}
                                    size={32}
                                    color={isDestructive ? colors.danger : colors.primary}
                                />
                            </View>
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        {message ? <Text style={styles.message}>{message}</Text> : null}

                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnCancel]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.btnCancelText}>{cancelText || 'Batal'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, isDestructive ? styles.btnDestructive : styles.btnConfirm]}
                                onPress={() => {
                                    onConfirm?.();
                                    onClose();
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={isDestructive ? 'trash-outline' : 'checkmark-circle-outline'}
                                    size={18}
                                    color={colors.white}
                                />
                                <Text style={styles.btnConfirmText}>  {confirmText || 'Ya'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    centeredView: {
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'android' ? 100 : 80,
    },
    closeBtn: {
        alignSelf: 'flex-end',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconWrap: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(229,167,27,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircleDestructive: {
        backgroundColor: 'rgba(231,76,60,0.15)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    btnCancel: {
        backgroundColor: colors.surface,
    },
    btnCancelText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    btnConfirm: {
        backgroundColor: colors.primary,
    },
    btnDestructive: {
        backgroundColor: colors.danger,
    },
    btnConfirmText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
});
