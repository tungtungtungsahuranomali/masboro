import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme';

export default function LoginModal({ visible, onClose, navigation }) {
    const { login } = useAuth();
    const [whatsapp, setWhatsapp] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!whatsapp || !password) {
            Alert.alert('Peringatan', 'Nomor WhatsApp dan Password harus diisi.');
            return;
        }
        setLoading(true);
        try {
            await login(whatsapp, password);
            setWhatsapp('');
            setPassword('');
            onClose();
        } catch (e) {
            const msg = e.response?.data?.message || 'Login gagal. Periksa koneksi internet.';
            Alert.alert('Login Gagal', msg);
        } finally {
            setLoading(false);
        }
    };

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
                        {/* Close button */}
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalLogo}>
                                <Ionicons name="globe" size={32} color={colors.primary} />
                            </View>
                            <Text style={styles.title}>Masuk ke Akun</Text>
                            <Text style={styles.subtitle}>Akses tagihan, tiket bantuan, dan profil Anda</Text>
                        </View>

                        {/* Form */}
                        <Text style={styles.label}>Nomor WhatsApp</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Contoh: 08123456789"
                                placeholderTextColor={colors.textSecondary}
                                value={whatsapp}
                                onChangeText={setWhatsapp}
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                            />
                        </View>

                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Masukkan password"
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.btn, loading && styles.btnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.btnContent}>
                                    <Ionicons name="log-in-outline" size={20} color={colors.white} />
                                    <Text style={styles.btnText}>  Masuk</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Register link */}
                        <Text style={styles.footerText}>
                            Belum punya akun?{' '}
                            <Text style={styles.footerLink} onPress={() => {
                                onClose();
                                setTimeout(() => navigation?.navigate('Register'), 300);
                            }}>
                                Daftar sekarang!
                            </Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                onClose();
                                setTimeout(() => navigation?.navigate('ForgotPassword'), 300);
                            }}
                            style={{ alignSelf: 'center', marginTop: 4 }}
                        >
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                Lupa Password?
                            </Text>
                        </TouchableOpacity>
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
        paddingBottom: Platform.OS === 'android' ? 200 : 160,
        maxHeight: '90%',
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
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalLogo: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(229,167,27,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6,
        marginTop: 14,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputIcon: {
        paddingLeft: 14,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 15,
        color: colors.text,
    },
    eyeBtn: {
        paddingRight: 14,
        paddingVertical: 14,
    },
    btn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    daftarBtn: {
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: 'rgba(229, 167, 27, 0.08)',
    },
    daftarBtnText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    footerText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 20,
        lineHeight: 20,
    },
    footerLink: {
        color: colors.primary,
        fontWeight: '700',
    },
});
