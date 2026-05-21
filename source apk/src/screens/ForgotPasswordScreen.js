import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import colors from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [whatsapp, setWhatsapp] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOtp = async () => {
        if (!whatsapp) {
            Alert.alert('Peringatan', 'Nomor WhatsApp harus diisi.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/forgot-password/send-otp', { whatsapp });
            if (res.data?.success) {
                Alert.alert('Berhasil', res.data.message);
                setStep(2);
            } else {
                Alert.alert('Gagal', res.data?.message || 'Nomor tidak terdaftar.');
            }
        } catch (e) {
            const msg = e.response?.data?.message || 'Terjadi kesalahan jaringan/server.';
            Alert.alert('Gagal', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !password || !confirmPassword) {
            Alert.alert('Peringatan', 'Semua kolom harus diisi.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Peringatan', 'Konfirmasi password tidak cocok.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Peringatan', 'Password minimal 6 karakter.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/forgot-password/reset', {
                whatsapp,
                otp,
                password_baru: password,
            });
            if (res.data?.success) {
                Alert.alert('Berhasil', res.data.message, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Gagal', res.data?.message || 'Gagal mengubah password.');
            }
        } catch (e) {
            const msg = e.response?.data?.message || 'Terjadi kesalahan.';
            Alert.alert('Gagal', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
        >
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.logoWrap}>
                        <Ionicons name="lock-closed" size={40} color={colors.white} />
                    </View>
                    <Text style={styles.title}>Lupa Password</Text>
                    <Text style={styles.subtitle}>Pulihkan akses akun Anda via WhatsApp</Text>
                </View>

                <View style={styles.form}>
                    {step === 1 ? (
                        <>
                            <Text style={styles.formTitle}>Masukkan Nomor WhatsApp</Text>
                            <Text style={styles.instruction}>Kami akan mengirimkan kode OTP ke nomor WhatsApp Anda yang terdaftar.</Text>

                            <Text style={styles.label}>Nomor WhatsApp</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="logo-whatsapp" size={18} color={colors.textSecondary} style={styles.inputIcon} />
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

                            <TouchableOpacity
                                style={[styles.btn, loading && styles.btnDisabled]}
                                onPress={handleSendOtp}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Ionicons name="send-outline" size={20} color={colors.white} />
                                        <Text style={styles.btnText}>  Kirim OTP</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.formTitle}>Buat Password Baru</Text>
                            <Text style={styles.instruction}>Masukkan OTP yang telah dikirim ke WhatsApp Anda beserta password baru.</Text>

                            <Text style={styles.label}>Kode OTP</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="key-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan 6 digit OTP"
                                    placeholderTextColor={colors.textSecondary}
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>

                            <Text style={styles.label}>Password Baru</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password minimal 6 karakter"
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

                            <Text style={styles.label}>Konfirmasi Password Baru</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ketik ulang password baru"
                                    placeholderTextColor={colors.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.btn, loading && styles.btnDisabled]}
                                onPress={handleResetPassword}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                                        <Text style={styles.btnText}>  Rubah Password</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.resendBtn} onPress={() => setStep(1)}>
                                <Text style={styles.resendText}>Ubah Nomor WhatsApp?</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    backBtn: {
        position: 'absolute',
        top: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
        left: 20,
        zIndex: 10,
        padding: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoWrap: {
        width: 70,
        height: 70,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.white,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        textAlign: 'center',
    },
    form: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 24,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    instruction: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
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
    resendBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    resendText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
