import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Dimensions, Modal,
    TouchableOpacity, RefreshControl, ActivityIndicator,
    StatusBar, Platform, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api, { API_URL, DEFAULT_API_URL, updateBaseURL, resetBaseURL } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import colors from '../theme';
import Skeleton from '../components/Skeleton';
import ThemeHeader from '../components/ThemeHeader';
import LoginModal from '../components/LoginModal';

const { width } = Dimensions.get('window');

export default function ProfilScreen({ navigation }) {
    const { token, logout } = useAuth();
    const [pelanggan, setPelanggan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [tapCount, setTapCount] = useState(0);
    const [showDevOptions, setShowDevOptions] = useState(false);
    const [customUrl, setCustomUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [confirmDeleteAkun, setConfirmDeleteAkun] = useState(false);
    const [deletingAkun, setDeletingAkun] = useState(false);

    const isLoggedIn = !!token;
    const { showToast } = useToast();

    const getImageUrl = (path) => {
        const base = API_URL.replace('/api', '');
        return `${base}/storage/${path}`;
    };

    const fetchProfil = async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/profil');
            setPelanggan(res.data.data);
        } catch (e) {
            console.log('Error fetch profil:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchProfil(); }, [isLoggedIn]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfil();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Aplikasi membutuhkan akses ke galeri.', 'warning');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            uploadPhoto(result.assets[0]);
        }
    };

    const uploadPhoto = async (asset) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('foto', {
                uri: asset.uri,
                type: 'image/jpeg',
                name: 'profil.jpg',
            });

            const res = await api.post('/profil/foto', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setPelanggan(prev => ({ ...prev, foto_profil: res.data.data.foto_profil }));
            showToast('Foto profil berhasil diperbarui.', 'success');
        } catch (e) {
            showToast('Gagal upload foto profil.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        setConfirmLogout(true);
    };

    const handleDeleteAkun = async () => {
        setDeletingAkun(true);
        try {
            await api.post('/hapus-akun');
            showToast('Akun berhasil dihapus.', 'success');
            logout();
        } catch (e) {
            showToast(e.response?.data?.message || 'Gagal menghapus akun.', 'error');
            setConfirmDeleteAkun(false);
        }
        setDeletingAkun(false);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <ScrollView showsVerticalScrollIndicator={false}>
                    
                    <ThemeHeader style={styles.header}>
                        <View style={styles.avatarWrap}>
                            <Skeleton width={90} height={90} borderRadius={45} />
                        </View>
                        <Skeleton width={150} height={24} style={{ marginBottom: 6 }} />
                        <Skeleton width={120} height={16} />
                    </ThemeHeader>

                    <View style={styles.card}>
                        <Skeleton width={140} height={20} style={{ marginBottom: 16 }} />
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <View key={i}>
                                <View style={styles.infoRow}>
                                    <Skeleton width={80} height={16} />
                                    <Skeleton width={100} height={16} />
                                </View>
                                {i < 6 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>

                    <View style={styles.card}>
                        {[1, 2].map(i => (
                            <View key={i}>
                                <View style={styles.menuItem}>
                                    <Skeleton width={36} height={36} borderRadius={10} />
                                    <View style={{ flex: 1 }}><Skeleton width={120} height={16} /></View>
                                    <Skeleton width={18} height={18} borderRadius={9} />
                                </View>
                                {i < 2 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    }

    const { paket_internet: paketInternet, paket_tv: paketTv, paket_lainnya: paketLainnya } = pelanggan || {};
    const totalHarga = Number(paketInternet?.harga || 0) + Number(paketTv?.harga || 0) + Number(paketLainnya?.harga || 0);

    const getStatusData = (p) => {
        if (!p) return { label: '-', color: colors.textSecondary, icon: 'help-circle', bg: '#f1f5f9' };
        if (p.status_isolir || p.status === 'isolir') return { label: 'Isolir', color: colors.danger, icon: 'close-circle', bg: '#fef2f2' };
        if (p.status === 'register' || p.status === 'baru' || p.status === 'Baru') return { label: 'Baru', color: colors.primary, icon: 'person-add', bg: '#eff6ff' };
        if (p.status === 'proses' || p.status === 'Proses') return { label: 'Proses', color: colors.warning, icon: 'time', bg: '#fffbeb' };
        if (p.status === 'pembayaran' || p.status === 'Pembayaran') return { label: 'Pembayaran', color: colors.warning, icon: 'wallet', bg: '#fffbeb' };
        if (p.status === 'berhenti' || p.status === 'Berhenti') return { label: 'Berhenti', color: colors.danger, icon: 'stop-circle', bg: '#fef2f2' };
        return { label: 'Aktif', color: colors.success, icon: 'checkmark-circle', bg: '#f0fdf4' };
    };

    const statusData = getStatusData(pelanggan);

    const handleDevTap = () => {
        const next = tapCount + 1;
        setTapCount(next);
        if (next >= 8) {
            setShowDevOptions(true);
            setTapCount(0);
            // Load current custom URL
            AsyncStorage.getItem('custom_api_url').then(val => {
                setCustomUrl(val || API_URL);
            });
        }
    };

    const handleSaveUrl = async () => {
        if (!customUrl.trim()) return;
        setSaving(true);
        await updateBaseURL(customUrl.trim());
        setSaving(false);
        showToast('URL API berhasil diperbarui.', 'success');
    };

    const handleResetUrl = async () => {
        await resetBaseURL();
        setCustomUrl(DEFAULT_API_URL);
        showToast('URL API dikembalikan ke default.', 'success');
    };

    const renderDevOptions = () => (
        <View style={{ padding: 4 }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                ⚙️ Developer Options
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 6 }}>
                Current: <Text style={{ color: colors.text }}>{API_URL}</Text>
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 8 }}>
                Default: <Text style={{ color: colors.text }}>{DEFAULT_API_URL}</Text>
            </Text>

            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>API Server URL</Text>
            <TextInput
                style={styles.devInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="http://example.com/api"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={styles.devSaveBtn} onPress={handleSaveUrl} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Simpan</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.devResetBtn} onPress={handleResetUrl}>
                    <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600' }}>Reset</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!isLoggedIn) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <ThemeHeader style={styles.header}>
                    <View style={styles.avatarWrap}>
                        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="person" size={40} color="rgba(255,255,255,0.6)" />
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleDevTap} activeOpacity={1}>
                        <Text style={styles.headerName}>Profil Saya</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDevTap} activeOpacity={1}>
                        <Text style={styles.headerSub}>Masuk untuk melihat informasi akun</Text>
                    </TouchableOpacity>
                </ThemeHeader>

                <View style={styles.loginPrompt}>
                    <Text style={styles.loginTitle}>Login Diperlukan</Text>
                    <Text style={styles.loginSubtitle}>Masuk untuk melihat detail profil, paket langganan, dan pengaturan akun</Text>
                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={() => setShowLogin(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-in-outline" size={20} color={colors.white} />
                        <Text style={styles.loginBtnText}>  Masuk / Daftar</Text>
                    </TouchableOpacity>
                </View>

                <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} navigation={navigation} />
                {/* Developer Options Modal */}
                <Modal visible={showDevOptions} transparent animationType="slide" onRequestClose={() => setShowDevOptions(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Developer Options</Text>
                                <TouchableOpacity onPress={() => setShowDevOptions(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 6 }}>
                                Current: <Text style={{ color: colors.text }}>{API_URL}</Text>
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 8 }}>
                                Default: <Text style={{ color: colors.text }}>{DEFAULT_API_URL}</Text>
                            </Text>
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>API Server URL</Text>
                            <TextInput
                                style={styles.devInput}
                                value={customUrl}
                                onChangeText={setCustomUrl}
                                placeholder="http://example.com/api"
                                placeholderTextColor={colors.textSecondary}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                <TouchableOpacity style={styles.devSaveBtn} onPress={handleSaveUrl} disabled={saving}>
                                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Simpan</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.devResetBtn} onPress={handleResetUrl}>
                                    <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600' }}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} navigation={navigation} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Header with Avatar */}
                <ThemeHeader style={styles.header}>
                    <TouchableOpacity style={styles.avatarWrap} onPress={() => { pickImage(); handleDevTap(); }} activeOpacity={0.8}>
                        {pelanggan?.foto_profil ? (
                            <Image
                                source={{ uri: getImageUrl(pelanggan.foto_profil) }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>
                                    {(pelanggan?.nama || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            {uploading ? (
                                <ActivityIndicator size={12} color={colors.white} />
                            ) : (
                                <Ionicons name="camera" size={14} color={colors.white} />
                            )}
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.headerName}>{pelanggan?.nama || '-'}</Text>
                    <Text style={styles.headerSub}>{pelanggan?.whatsapp || '-'}</Text>
                </ThemeHeader>

                {/* Subscription Info Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        <Ionicons name="wifi" size={16} color={colors.primary} /> Info Langganan
                    </Text>

                    <View style={{ paddingTop: 10, paddingBottom: 6 }}>
                        <Text style={styles.infoLabel}>Pilihan Paket</Text>
                        <View style={{ marginTop: 8, gap: 8 }}>
                            {paketInternet && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>• Internet: {paketInternet.nama_paket}</Text>
                                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
                                        Rp {Number(paketInternet.harga).toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            )}
                            {paketTv && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>• TV: {paketTv.nama_paket}</Text>
                                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
                                        Rp {Number(paketTv.harga).toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            )}
                            {paketLainnya && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>• Lainnya: {paketLainnya.nama_paket}</Text>
                                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
                                        Rp {Number(paketLainnya.harga).toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            )}
                            {!paketInternet && !paketTv && !paketLainnya && (
                                <Text style={{ fontSize: 13, color: colors.textSecondary }}>-</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Total Tagihan</Text>
                        <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '700' }]}>
                            {totalHarga > 0 ? `Rp ${Number(totalHarga).toLocaleString('id-ID', { maximumFractionDigits: 0 })}/bln` : 'Menunggu Rincian'}
                        </Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nama Bank</Text>
                        <Text style={styles.infoValue}>{pelanggan?.nama_bank || '-'}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nomor Rek/VA</Text>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => {
                                if (pelanggan?.no_va) {
                                    Clipboard.setStringAsync(pelanggan.no_va);
                                    showToast('Nomor Rek/VA berhasil disalin.', 'success');
                                }
                            }}
                        >
                            <Text style={[styles.infoValue, { fontWeight: '700', letterSpacing: 1 }]}>{pelanggan?.no_va || '-'}</Text>
                            {pelanggan?.no_va && <Ionicons name="copy-outline" size={14} color={colors.primary} style={{ marginLeft: 6 }} />}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tgl Tagihan</Text>
                        <Text style={styles.infoValue}>Tanggal 1 - 5</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>No. Whatsapp</Text>
                        <Text style={styles.infoValue}>{pelanggan?.whatsapp || '-'}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Alamat</Text>
                        <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                            {pelanggan?.alamat || '-'}
                        </Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <View style={[styles.statusBadge, {
                            backgroundColor: statusData.bg
                        }]}>
                            <Ionicons
                                name={statusData.icon}
                                size={14}
                                color={statusData.color}
                            />
                            <Text style={{
                                color: statusData.color,
                                fontSize: 13, fontWeight: '600',
                            }}>
                                {statusData.label}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Menu List */}
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('RubahPassword')}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: 'rgba(229,167,27,0.15)' }]}>
                            <Ionicons name="key" size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.menuText}>Rubah Password</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => setConfirmDeleteAkun(true)}>
                        <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
                            <Ionicons name="trash" size={18} color={colors.danger} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.danger }]}>Hapus Akun</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
                            <Ionicons name="log-out" size={18} color={colors.danger} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.danger }]}>Logout</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Developer Options — muncul setelah 8x tap header */}
                {showDevOptions && (
                    <View style={styles.card}>
                        {renderDevOptions()}
                    </View>
                )}

                <View style={{ height: 130 }} />
            </ScrollView>

            {/* Developer Options Modal */}
            <Modal visible={showDevOptions} transparent animationType="slide" onRequestClose={() => setShowDevOptions(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Developer Options</Text>
                            <TouchableOpacity onPress={() => setShowDevOptions(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 6 }}>
                            Current: <Text style={{ color: colors.text }}>{API_URL}</Text>
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 8 }}>
                            Default: <Text style={{ color: colors.text }}>{DEFAULT_API_URL}</Text>
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>API Server URL</Text>
                        <TextInput
                            style={styles.devInput}
                            value={customUrl}
                            onChangeText={setCustomUrl}
                            placeholder="http://example.com/api"
                            placeholderTextColor={colors.textSecondary}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                            <TouchableOpacity style={styles.devSaveBtn} onPress={handleSaveUrl} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Simpan</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.devResetBtn} onPress={handleResetUrl}>
                                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600' }}>Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} navigation={navigation} />
            <ConfirmModal
                visible={confirmLogout}
                onClose={() => setConfirmLogout(false)}
                title="Logout"
                message="Yakin ingin keluar?"
                confirmText="Logout"
                cancelText="Batal"
                confirmStyle="destructive"
                onConfirm={logout}
            />
            <ConfirmModal
                visible={confirmDeleteAkun}
                onClose={() => setConfirmDeleteAkun(false)}
                title="Hapus Akun"
                message="Akun dan semua data terkait akan dihapus permanen. Yakin?"
                confirmText={deletingAkun ? 'Menghapus...' : 'Hapus Akun'}
                cancelText="Batal"
                confirmStyle="destructive"
                onConfirm={handleDeleteAkun}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 56,
        paddingBottom: 32,
    },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: colors.white, fontSize: 36, fontWeight: '700' },
    cameraIcon: {
        position: 'absolute', bottom: 0, right: 0,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: colors.white,
    },
    headerName: { color: colors.white, fontSize: 20, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },

    // Card
    card: {
        backgroundColor: colors.card, borderRadius: 16,
        marginHorizontal: 16, marginTop: 16, padding: 20,
        elevation: 3, shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
    },
    cardTitle: {
        fontSize: 15, fontWeight: '700', color: colors.text,
        marginBottom: 16,
    },

    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 10,
    },
    infoLabel: { fontSize: 13, color: colors.textSecondary },
    infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    divider: { height: 1, backgroundColor: '#f1f5f9' },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },

    // Menu
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, gap: 12,
    },
    menuIcon: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },

    // Login Prompt
    loginPrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -40,
    },
    loginTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    loginSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    loginBtn: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    loginBtnText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },

    // Developer Options
    devInput: {
        backgroundColor: colors.inputBg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        fontSize: 13,
        padding: 12,
        fontFamily: 'monospace',
    },
    devSaveBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
    },
    devResetBtn: {
        borderWidth: 1.5,
        borderColor: colors.danger,
        borderRadius: 10,
        padding: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 48,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
});
