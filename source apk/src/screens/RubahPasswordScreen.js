import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import colors from '../theme';

export default function RubahPasswordScreen({ navigation }) {
    const [passwordLama, setPasswordLama] = useState('');
    const [passwordBaru, setPasswordBaru] = useState('');
    const [konfirmasi, setKonfirmasi] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showKonfirmasi, setShowKonfirmasi] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (!passwordLama || !passwordBaru || !konfirmasi) {
            showToast('Semua field harus diisi.', 'warning');
            return;
        }
        if (passwordBaru.length < 6) {
            showToast('Password baru minimal 6 karakter.', 'warning');
            return;
        }
        if (passwordBaru !== konfirmasi) {
            showToast('Konfirmasi password tidak cocok.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/update-password', {
                password_lama: passwordLama,
                password_baru: passwordBaru,
            });
            setShowSuccess(true);
        } catch (e) {
            const msg = e.response?.data?.message || 'Gagal mengubah password.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => navigation.goBack();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />

            {/* Header */}
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rubah Password</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="key" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.subtitle}>Ganti password akun Anda</Text>

                    {/* Password Lama */}
                    <View style={styles.inputWrap}>
                        <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password Lama"
                            secureTextEntry={!showOld}
                            value={passwordLama}
                            onChangeText={setPasswordLama}
                            placeholderTextColor={colors.textSecondary}
                        />
                        <TouchableOpacity onPress={() => setShowOld(!showOld)}>
                            <Ionicons name={showOld ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Password Baru */}
                    <View style={styles.inputWrap}>
                        <Ionicons name="key-outline" size={18} color={colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password Baru (min. 6 karakter)"
                            secureTextEntry={!showNew}
                            value={passwordBaru}
                            onChangeText={setPasswordBaru}
                            placeholderTextColor={colors.textSecondary}
                        />
                        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                            <Ionicons name={showNew ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Konfirmasi */}
                    <View style={styles.inputWrap}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Konfirmasi Password Baru"
                            secureTextEntry={!showKonfirmasi}
                            value={konfirmasi}
                            onChangeText={setKonfirmasi}
                            placeholderTextColor={colors.textSecondary}
                        />
                        <TouchableOpacity onPress={() => setShowKonfirmasi(!showKonfirmasi)}>
                            <Ionicons name={showKonfirmasi ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.gradientStart, colors.gradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <>
                                    <Ionicons name="save" size={18} color={colors.white} />
                                    <Text style={styles.buttonText}>Simpan Password</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <ConfirmModal
                visible={showSuccess}
                onClose={() => { setShowSuccess(false); goBack(); }}
                title="Berhasil"
                message="Password berhasil diperbarui."
                confirmText="OK"
                confirmStyle="confirm"
                onConfirm={goBack}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: {
        flex: 1, color: colors.white, fontSize: 17, fontWeight: '700',
        textAlign: 'center',
    },
    card: {
        backgroundColor: colors.card, borderRadius: 16,
        margin: 16, padding: 24,
        elevation: 4, shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
    },
    iconWrap: {
        alignSelf: 'center', width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(229,167,27,0.15)', justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
    },
    subtitle: {
        textAlign: 'center', color: colors.textSecondary,
        fontSize: 13, marginBottom: 24,
    },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
        paddingHorizontal: 14, marginBottom: 14, backgroundColor: '#f8fafc',
    },
    input: {
        flex: 1, paddingVertical: 12, fontSize: 14,
        color: colors.text, marginLeft: 10,
    },
    button: { marginTop: 8 },
    buttonGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 12, gap: 8,
    },
    buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
