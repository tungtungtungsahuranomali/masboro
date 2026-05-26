import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    RefreshControl, ActivityIndicator, Platform, StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import colors from '../theme';
import Skeleton from '../components/Skeleton';
import ThemeHeader from '../components/ThemeHeader';
import LoginModal from '../components/LoginModal';

export default function TagihanScreen({ navigation }) {
    const { token } = useAuth();
    const [tagihans, setTagihans] = useState([]);
    const [noVa, setNoVa] = useState(null);
    const [namaBank, setNamaBank] = useState(null);
    const [atasNama, setAtasNama] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payingId, setPayingId] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [confirmBayar, setConfirmBayar] = useState(null);
    const [confirmAsset, setConfirmAsset] = useState(null);

    const isLoggedIn = !!token;
    const { showToast } = useToast();

    const fetchTagihan = async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        try {
            // Tampilkan cache dulu
            if (!tagihans.length) {
                const cached = await AsyncStorage.getItem('tagihan_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setTagihans(parsed.data);
                    setNoVa(parsed.no_va);
                    setNamaBank(parsed.nama_bank);
                    setAtasNama(parsed.atas_nama);
                    setLoading(false);
                }
            }

            const res = await api.get('/tagihan');
            setTagihans(res.data.data);
            setNoVa(res.data.no_va);
            setNamaBank(res.data.nama_bank);
            setAtasNama(res.data.atas_nama);
            AsyncStorage.setItem('tagihan_cache', JSON.stringify(res.data));
        } catch (e) {
            console.log('Error fetch tagihan:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchTagihan(); }, [isLoggedIn]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTagihan();
    }, []);

    const handleBayar = async (tagihan) => {
        // Step 1: Pick image
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Aplikasi membutuhkan akses ke galeri untuk upload bukti bayar.', 'warning');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
        });

        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];

        // Step 2: Show confirmation modal
        setConfirmBayar(tagihan);
        setConfirmAsset(asset);
    };

    const doBayar = async () => {
        if (!confirmBayar || !confirmAsset) return;
        const tagihan = confirmBayar;
        const asset = confirmAsset;
        setConfirmBayar(null);
        setConfirmAsset(null);
        setPayingId(tagihan.id);
        try {
            const formData = new FormData();
            formData.append('bukti_bayar', {
                uri: asset.uri,
                type: 'image/jpeg',
                name: 'bukti_bayar.jpg',
            });

            const res = await api.post(`/tagihan/${tagihan.id}/bayar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast(res.data.message, 'success');
            fetchTagihan();
        } catch (e) {
            const msg = e.response?.data?.message || 'Gagal memproses pembayaran.';
            showToast(msg, 'error');
        } finally {
            setPayingId(null);
        }
    };

    const formatRupiah = (num) => {
        return Math.round(Number(num || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Verifikasi': return {
                bg: 'rgba(243,156,18,0.15)', text: colors.warning, label: 'Menunggu Verifikasi', icon: 'time'
            };
            case 'Terbayar': return {
                bg: 'rgba(46,204,113,0.15)', text: colors.success, label: 'Terbayar', icon: 'checkmark-circle'
            };
            default: return {
                bg: 'rgba(231,76,60,0.15)', text: colors.danger, label: 'Belum Dibayar', icon: 'alert-circle'
            };
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <ThemeHeader style={styles.header}>
                    <Text style={styles.headerTitle}>Tagihan Saya</Text>
                </ThemeHeader>
                <View style={styles.list}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.kodeWrap}>
                                    <Skeleton width={32} height={32} borderRadius={10} style={{ marginRight: 8 }} />
                                    <Skeleton width={100} height={16} />
                                </View>
                                <Skeleton width={80} height={20} borderRadius={20} />
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.cardRow}>
                                    <View style={styles.cardRowItem}><Skeleton width={80} height={14} /></View>
                                    <Skeleton width={100} height={14} />
                                </View>
                                <View style={styles.cardRow}>
                                    <View style={styles.cardRowItem}><Skeleton width={80} height={14} /></View>
                                    <Skeleton width={120} height={18} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    const renderItem = ({ item }) => {
        const status = getStatusStyle(item.status);
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.kodeWrap}>
                        <View style={styles.kodeIcon}>
                            <Ionicons name="receipt" size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.kode} selectable={true}>{item.kode_tagihan}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                        <Ionicons name={status.icon} size={12} color={status.text} />
                        <Text style={[styles.badgeText, { color: status.text }]}> {status.label}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {(namaBank || noVa || atasNama) && (
                        <View style={styles.bankInfoBox}>
                            <View style={styles.bankInfoHeader}>
                                <Ionicons name="business-outline" size={16} color={colors.primary} />
                                <Text style={styles.bankInfoTitle}> Rekening Pembayaran</Text>
                            </View>
                            {namaBank && (
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Nama Bank</Text>
                                    <Text style={styles.cardValue}>{namaBank}</Text>
                                </View>
                            )}
                            {noVa && (
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>No. Rek/VA</Text>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                        onPress={() => {
                                            Clipboard.setStringAsync(noVa);
                                            showToast('Nomor Rekening/VA disalin.', 'success');
                                        }}
                                    >
                                        <Text style={[styles.cardValue, { letterSpacing: 1 }]}>{noVa}</Text>
                                        <Ionicons name="copy-outline" size={14} color={colors.primary} style={{ marginLeft: 6 }} />
                                    </TouchableOpacity>
                                </View>
                            )}
                            {atasNama && (
                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Atas Nama</Text>
                                    <Text style={styles.cardValue}>{atasNama}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.cardRow}>
                        <View style={styles.cardRowItem}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.cardLabel}>  Tgl Tagihan</Text>
                        </View>
                        <Text style={styles.cardValue}>{formatDate(item.tgl_tagihan)}</Text>
                    </View>
                    <View style={styles.cardRow}>
                        <View style={styles.cardRowItem}>
                            <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.cardLabel}>  Nominal</Text>
                        </View>
                        <Text style={[styles.cardValue, styles.nominal]}>Rp {formatRupiah(item.nominal)}</Text>
                    </View>
                </View>

                {item.status === 'Tertagih' && item.catatan_admin && (
                    <View style={styles.rejectNote}>
                        <Ionicons name="warning" size={16} color={colors.danger} />
                        <Text style={styles.rejectNoteText}>{item.catatan_admin}</Text>
                    </View>
                )}

                {
                    item.status === 'Tertagih' && (
                        <TouchableOpacity
                            style={styles.bayarBtn}
                            onPress={() => handleBayar(item)}
                            disabled={payingId === item.id}
                            activeOpacity={0.8}
                        >
                            {payingId === item.id ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <View style={styles.bayarContent}>
                                    <Ionicons name="camera" size={18} color={colors.white} />
                                    <Text style={styles.bayarText}>  Upload Bukti & Bayar</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )
                }

                {
                    item.status === 'Verifikasi' && (
                        <View style={styles.verifikasiInfo}>
                            <Ionicons name="checkmark-circle-outline" size={16} color={colors.warning} />
                            <Text style={styles.verifikasiText}>Bukti bayar telah dikirim, menunggu verifikasi admin</Text>
                        </View>
                    )
                }
            </View>
        );
    };

    const totalTagihan = tagihans
        .filter(t => t.status === 'Tertagih')
        .reduce((sum, item) => sum + Number(item.nominal), 0);

    if (!isLoggedIn) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <ThemeHeader style={styles.header}>
                    <Text style={styles.headerTitle}>Tagihan Saya</Text>
                </ThemeHeader>
                <View style={styles.loginPrompt}>
                    <View style={styles.loginIconWrap}>
                        <Ionicons name="receipt-outline" size={64} color={colors.primary} />
                    </View>
                    <Text style={styles.loginTitle}>Login Diperlukan</Text>
                    <Text style={styles.loginSubtitle}>Masuk untuk melihat daftar tagihan Anda</Text>
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
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <ThemeHeader
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Tagihan Saya</Text>
                {totalTagihan > 0 && (
                    <View style={{ marginTop: 12, alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>Total Harus Dibayar</Text>
                        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>Rp {formatRupiah(totalTagihan)}</Text>
                    </View>
                )}
            </ThemeHeader>

            <FlatList
                data={tagihans}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListFooterComponent={<View style={{ height: 110 }} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="checkmark-done-circle" size={64} color={colors.success} />
                        </View>
                        <Text style={styles.emptyText}>Tidak ada tagihan aktif</Text>
                        <Text style={styles.emptySubtext}>Semua tagihan Anda sudah terbayar</Text>
                    </View>
                }
            />

            <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} navigation={navigation} />
            <ConfirmModal
                visible={!!confirmBayar}
                onClose={() => { setConfirmBayar(null); setConfirmAsset(null); }}
                title="Konfirmasi Pembayaran"
                message={confirmBayar ? `Kirim bukti bayar untuk tagihan ${confirmBayar.kode_tagihan}
Bank: ${namaBank || '-'}
No. Rek/VA: ${noVa || '-'}
A.n: ${atasNama || '-'}
Nominal: Rp ${formatRupiah(confirmBayar.nominal)}` : ''}
                confirmText="Kirim"
                confirmStyle="confirm"
                onConfirm={doBayar}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    list: { padding: 16, paddingBottom: 20 },

    // Header
    header: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 56,
        paddingBottom: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '700',
    },

    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
    },
    kodeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        marginRight: 8,
    },
    kodeIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(229,167,27,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    kode: { fontSize: 14, fontWeight: 'bold', color: colors.text, flexShrink: 1 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    badgeText: { fontSize: 10, fontWeight: '700' },

    cardBody: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 14,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardLabel: { fontSize: 13, color: colors.textSecondary },
    cardValue: { fontSize: 13, fontWeight: '600', color: colors.text },
    nominal: { fontSize: 17, color: colors.primary, fontWeight: 'bold' },

    bayarBtn: {
        backgroundColor: colors.success,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 14,
    },
    bayarContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bayarText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },

    verifikasiInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(243,156,18,0.12)',
        borderRadius: 10,
        padding: 12,
        marginTop: 14,
    },
    verifikasiText: {
        fontSize: 12,
        color: colors.warning,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },

    empty: { alignItems: 'center', paddingTop: 80 },
    emptyIconWrap: {
        marginBottom: 16,
    },
    emptyText: { fontSize: 17, fontWeight: '700', color: colors.text },
    emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },

    rejectNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(231,76,60,0.12)',
        borderRadius: 10,
        padding: 12,
        marginTop: 14,
        borderLeftWidth: 3,
        borderLeftColor: colors.danger,
    },
    rejectNoteText: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },

    // Bank Info Box
    bankInfoBox: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    bankInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    bankInfoTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },

    // Login Prompt
    loginPrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loginIconWrap: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(229,167,27,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
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
});
