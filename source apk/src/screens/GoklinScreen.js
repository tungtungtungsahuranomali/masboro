import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Dimensions,
    TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
    StatusBar, Platform, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import api, { API_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import colors from '../theme';
import LoginModal from '../components/LoginModal';

const { width } = Dimensions.get('window');

const STATUS_MAP = {
    pending: { label: 'Menunggu Pembayaran', icon: 'time', color: colors.textSecondary },
    dibayar: { label: 'Menunggu Konfirmasi', icon: 'cash', color: colors.warning },
    dikonfirmasi: { label: 'Dikonfirmasi', icon: 'checkmark-circle', color: colors.primary },
    mitra_otw: { label: 'Mitra Dalam Perjalanan', icon: 'walk', color: colors.warning },
    mitra_bekerja: { label: 'Sedang Dikerjakan', icon: 'construct', color: colors.warning },
    selesai: { label: 'Selesai', icon: 'checkmark-done', color: colors.success },
    dibatalkan: { label: 'Dibatalkan', icon: 'close-circle', color: colors.danger },
};

const generateMapHtml = (lat = -7.250445, lng = 112.768845) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
* { margin: 0; padding: 0; }
body { background: #0D0D15; }
#map { width: 100%; height: 100vh; }
.leaflet-control-zoom a { background: #1A1A2E; color: #F5F5F5; border-color: #2A2A3E; }
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map').setView([${lat}, ${lng}], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
}).addTo(map);
var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
marker.on('dragend', function(e) {
    var pos = marker.getLatLng();
    window.ReactNativeWebView.postMessage(JSON.stringify({ lat: pos.lat.toFixed(6), lng: pos.lng.toFixed(6) }));
});
map.on('click', function(e) {
    marker.setLatLng(e.latlng);
    window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) }));
});
</script>
</body>
</html>`;

export default function GoklinScreen({ navigation }) {
    const { token } = useAuth();
    const isLoggedIn = !!token;

    const [prices, setPrices] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);

    // Order form
    const [selectedDurasi, setSelectedDurasi] = useState(null);
    const [lokasi, setLokasi] = useState('');
    const [latitude, setLatitude] = useState('-7.250445');
    const [longitude, setLongitude] = useState('112.768845');
    const [jamPesan, setJamPesan] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const activeOrder = orders.find(o => ['pending', 'dibayar', 'dikonfirmasi', 'mitra_otw', 'mitra_bekerja'].includes(o.status));
    const showForm = !activeOrder && isLoggedIn;

    const fetchData = useCallback(async () => {
        try {
            const [pricesRes] = await Promise.all([
                api.get('/goklin/prices'),
            ]);
            setPrices(pricesRes.data.data || []);
        } catch (e) {}
        if (isLoggedIn) {
            try {
                const ordersRes = await api.get('/goklin/orders');
                setOrders(ordersRes.data.data || []);
            } catch (e) {}
        }
        setLoading(false);
    }, [isLoggedIn]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async () => {
        if (!selectedDurasi) { Alert.alert('Peringatan', 'Pilih durasi layanan.'); return; }
        if (!lokasi.trim()) { Alert.alert('Peringatan', 'Masukkan lokasi.'); return; }
        if (!jamPesan.trim()) { Alert.alert('Peringatan', 'Masukkan jam pesan. Format: YYYY-MM-DD HH:MM'); return; }

        const price = prices.find(p => p.durasi === selectedDurasi);
        if (!price) { Alert.alert('Error', 'Harga tidak ditemukan.'); return; }

        setSubmitting(true);
        try {
            const res = await api.post('/goklin/order', {
                durasi: selectedDurasi,
                harga: price.harga,
                lokasi: lokasi.trim(),
                latitude,
                longitude,
                jam_pesan: jamPesan.trim(),
            });
            Alert.alert('Berhasil', res.data.message);
            fetchData();
        } catch (e) {
            const msg = e.response?.data?.message || 'Gagal membuat pesanan.';
            Alert.alert('Gagal', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBayar = async (order) => {
        // For now, just navigate to riwayat with info about payment
        Alert.alert('Info', 'Silakan transfer ke rekening yang tertera dan upload bukti bayar. Fitur upload bukti bayar akan segera hadir.');
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                    <Text style={styles.headerTitle}>GoKlin</Text>
                </LinearGradient>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
            </View>
        );
    }

    if (!isLoggedIn) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                    <Text style={styles.headerTitle}>GoKlin</Text>
                </LinearGradient>
                <View style={styles.loginPrompt}>
                    <Ionicons name="sparkles" size={64} color={colors.primary} />
                    <Text style={styles.loginTitle}>Login Diperlukan</Text>
                    <Text style={styles.loginSubtitle}>Masuk untuk memesan layanan kebersihan</Text>
                    <TouchableOpacity style={styles.loginBtn} onPress={() => setShowLogin(true)}>
                        <Ionicons name="log-in-outline" size={20} color="#fff" />
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
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                <Text style={styles.headerTitle}>GoKlin</Text>
                {orders.length > 0 && (
                    <Text style={styles.headerSub}>{orders.length} pesanan</Text>
                )}
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                {activeOrder ? (
                    /* Active Order Status */
                    <View style={styles.statusSection}>
                        <Text style={styles.sectionTitle}>Pesanan Aktif</Text>
                        <View style={styles.statusCard}>
                            <View style={styles.statusHeader}>
                                <Ionicons name={STATUS_MAP[activeOrder.status]?.icon || 'time'} size={32} color={STATUS_MAP[activeOrder.status]?.color || colors.textSecondary} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.statusLabel}>{STATUS_MAP[activeOrder.status]?.label || activeOrder.status}</Text>
                                    <Text style={styles.statusKode}>{activeOrder.kode_order}</Text>
                                </View>
                            </View>
                            <View style={styles.statusDetail}>
                                <View style={styles.statusRow}>
                                    <Text style={styles.statusKey}>Durasi</Text>
                                    <Text style={styles.statusVal}>{activeOrder.durasi} jam</Text>
                                </View>
                                <View style={styles.statusRow}>
                                    <Text style={styles.statusKey}>Harga</Text>
                                    <Text style={styles.statusVal}>Rp {Number(activeOrder.harga).toLocaleString('id-ID')}</Text>
                                </View>
                                <View style={styles.statusRow}>
                                    <Text style={styles.statusKey}>Lokasi</Text>
                                    <Text style={styles.statusVal}>{activeOrder.lokasi}</Text>
                                </View>
                                <View style={styles.statusRow}>
                                    <Text style={styles.statusKey}>Jam Pesan</Text>
                                    <Text style={styles.statusVal}>{activeOrder.jam_pesan}</Text>
                                </View>
                                {activeOrder.mitra && (
                                    <View style={styles.statusRow}>
                                        <Text style={styles.statusKey}>Mitra</Text>
                                        <Text style={styles.statusVal}>{activeOrder.mitra.nama}</Text>
                                    </View>
                                )}
                                {activeOrder.catatan_admin && (
                                    <View style={styles.catatanBox}>
                                        <Ionicons name="information-circle" size={16} color={colors.primary} />
                                        <Text style={styles.catatanText}>{activeOrder.catatan_admin}</Text>
                                    </View>
                                )}
                            </View>
                            {activeOrder.status === 'pending' && (
                                <TouchableOpacity style={styles.bayarBtn} onPress={() => handleBayar(activeOrder)}>
                                    <Ionicons name="cash" size={18} color="#fff" />
                                    <Text style={styles.bayarBtnText}>  Bayar Sekarang</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ) : null}

                {showForm ? (
                    /* Order Form */
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Pesan Layanan Kebersihan</Text>

                        {/* Pricing */}
                        <Text style={styles.formLabel}>Pilih Durasi</Text>
                        <View style={styles.priceGrid}>
                            {prices.filter(p => p.aktif).map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.priceCard, selectedDurasi === p.durasi && styles.priceCardActive]}
                                    onPress={() => setSelectedDurasi(p.durasi)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.priceDurasi, selectedDurasi === p.durasi && styles.priceDurasiActive]}>{p.durasi} Jam</Text>
                                    <Text style={[styles.priceHarga, selectedDurasi === p.durasi && styles.priceHargaActive]}>Rp {Number(p.harga).toLocaleString('id-ID')}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Location */}
                        <Text style={styles.formLabel}>Lokasi</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Masukkan alamat lengkap"
                            placeholderTextColor={colors.textSecondary}
                            value={lokasi}
                            onChangeText={setLokasi}
                            multiline
                        />

                        <Text style={styles.formLabel}>Titik Lokasi (Map)</Text>
                        <View style={styles.mapWrap}>
                            <WebView
                                source={{ html: generateMapHtml(parseFloat(latitude), parseFloat(longitude)) }}
                                style={styles.mapWebview}
                                scrollEnabled={false}
                                onMessage={(e) => {
                                    try {
                                        const data = JSON.parse(e.nativeEvent.data);
                                        if (data.lat && data.lng) {
                                            setLatitude(data.lat);
                                            setLongitude(data.lng);
                                        }
                                    } catch (err) {}
                                }}
                            />
                        </View>

                        {/* Time */}
                        <Text style={styles.formLabel}>Jam Pesan (YYYY-MM-DD HH:MM)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Contoh: 2026-05-20 14:00"
                            placeholderTextColor={colors.textSecondary}
                            value={jamPesan}
                            onChangeText={setJamPesan}
                            autoCapitalize="none"
                        />

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="send" size={18} color="#fff" />
                                    <Text style={styles.submitBtnText}>  Buat Pesanan</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : !activeOrder ? null : null}

                {/* Riwayat */}
                {orders.length > 0 && (
                    <View style={styles.riwayatSection}>
                        <Text style={styles.sectionTitle}>Riwayat Pesanan</Text>
                        {orders.map(order => (
                            <View key={order.id} style={[styles.riwayatCard, order.id === activeOrder?.id && styles.riwayatCardActive]}>
                                <View style={styles.riwayatHeader}>
                                    <Text style={styles.riwayatKode}>{order.kode_order}</Text>
                                    <Ionicons name={STATUS_MAP[order.status]?.icon || 'ellipse'} size={18} color={STATUS_MAP[order.status]?.color || colors.textSecondary} />
                                </View>
                                <Text style={styles.riwayatStatus}>{STATUS_MAP[order.status]?.label || order.status}</Text>
                                <View style={styles.riwayatRow}>
                                    <Text style={styles.riwayatLabel}>{order.durasi} jam</Text>
                                    <Text style={styles.riwayatLabel}>Rp {Number(order.harga).toLocaleString('id-ID')}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 56,
        paddingBottom: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: { color: colors.white, fontSize: 20, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

    loginPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    loginTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
    loginSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    loginBtn: { flexDirection: 'row', backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 14, paddingHorizontal: 20, marginTop: 20 },

    // Active Order Status
    statusSection: {},
    statusCard: {
        backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, padding: 16,
        borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8,
    },
    statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    statusLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    statusKode: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    statusDetail: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statusKey: { fontSize: 13, color: colors.textSecondary },
    statusVal: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
    catatanBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(229,167,27,0.12)', borderRadius: 10, padding: 10, marginTop: 8 },
    catatanText: { fontSize: 12, color: colors.primary, marginLeft: 8, flex: 1, lineHeight: 18 },
    bayarBtn: { flexDirection: 'row', backgroundColor: colors.success, borderRadius: 12, padding: 14, justifyContent: 'center', alignItems: 'center', marginTop: 16 },

    // Form
    formSection: {},
    formLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8, paddingHorizontal: 20 },
    priceGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
    priceCard: {
        width: (width - 48) / 2, backgroundColor: colors.card, borderRadius: 14, padding: 16,
        alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
    },
    priceCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(229,167,27,0.1)' },
    priceDurasi: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    priceDurasiActive: { color: colors.primary },
    priceHarga: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    priceHargaActive: { color: colors.primary },
    textInput: {
        backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
        color: colors.text, fontSize: 14, padding: 14, marginHorizontal: 20, marginBottom: 16,
        textAlignVertical: 'top',
    },
    mapWrap: { height: 200, marginHorizontal: 20, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
    mapWebview: { flex: 1, backgroundColor: 'transparent' },
    submitBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 8 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Riwayat
    riwayatSection: {},
    riwayatCard: {
        backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 20, marginBottom: 10,
        padding: 14, borderWidth: 1, borderColor: colors.border,
    },
    riwayatCardActive: { borderColor: colors.primary },
    riwayatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    riwayatKode: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    riwayatStatus: { fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
    riwayatRow: { flexDirection: 'row', justifyContent: 'space-between' },
    riwayatLabel: { fontSize: 12, color: colors.textSecondary },
});
