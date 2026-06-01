import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Dimensions, Modal,
    TouchableOpacity, RefreshControl, ActivityIndicator,
    StatusBar, Platform, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import api, { API_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import colors from '../theme';
import LoginModal from '../components/LoginModal';
import ThemeHeader from '../components/ThemeHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CACHE_KEY = 'goklin_cache';
const CACHE_TTL = 3600000; // 1 jam

const STATUS_MAP = {
    pending: { label: 'Menunggu Pembayaran', icon: 'time', color: colors.textSecondary },
    dibayar: { label: 'Menunggu Konfirmasi', icon: 'cash', color: colors.warning },
    dikonfirmasi: { label: 'Dikonfirmasi', icon: 'checkmark-circle', color: colors.primary },
    mitra_otw: { label: 'Mitra Dalam Perjalanan', icon: 'walk', color: colors.warning },
    mitra_bekerja: { label: 'Sedang Dikerjakan', icon: 'construct', color: colors.warning },
    selesai: { label: 'Selesai', icon: 'checkmark-done', color: colors.success },
    dibatalkan: { label: 'Dibatalkan', icon: 'close-circle', color: colors.danger },
};

const generateMapHtml = (lat, lng) => `
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}body{background:#0D0D15}#map{width:100%;height:100vh}</style></head><body>
<div id="map"></div><script>
var map=L.map('map').setView([${lat},${lng}],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var marker=L.marker([${lat},${lng}],{draggable:true}).addTo(map);
marker.on('dragend',function(e){var p=marker.getLatLng();window.ReactNativeWebView.postMessage(JSON.stringify({lat:p.lat.toFixed(6),lng:p.lng.toFixed(6)}))});
map.on('click',function(e){marker.setLatLng(e.latlng);window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat.toFixed(6),lng:e.latlng.lng.toFixed(6)}))});
</script></body></html>`;

export default function GoklinScreen({ navigation }) {
    const { token } = useAuth();
    const isLoggedIn = !!token;
    const intervalRef = useRef(null);

    const [prices, setPrices] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);
    const [payOrder, setPayOrder] = useState(null);
    const [payBank, setPayBank] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(null);
    const searchTimeoutRef = useRef(null);

    // Order form
    const [selectedDurasi, setSelectedDurasi] = useState(null);
    const [lokasi, setLokasi] = useState('');
    const [latitude, setLatitude] = useState('-7.250445');
    const [longitude, setLongitude] = useState('112.768845');
    const [jamPesan, setJamPesan] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [manualInput, setManualInput] = useState(false); // fallback: input manual untuk web
    const [manualDate, setManualDate] = useState('');
    const [manualTime, setManualTime] = useState('');
    const datetimeRef = useRef(null); // ref untuk baca value datetime-local langsung dari DOM (web)
    const { showToast } = useToast();

    const POLL_INTERVAL = 30000; // 30 detik

    const fetchData = useCallback(async () => {
        try {
            const [pricesRes, ordersRes] = await Promise.all([
                api.get('/goklin/prices'),
                isLoggedIn ? api.get('/goklin/orders') : Promise.resolve({ data: { data: [] } }),
            ]);
            const newPrices = pricesRes.data.data || [];
            const newOrders = ordersRes.data.data || [];
            setPrices(newPrices);
            setOrders(newOrders);
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ prices: newPrices, timestamp: Date.now() }));
        } catch (e) {}
        setLoading(false);
    }, [isLoggedIn]);

    // Refresh orders only (untuk polling & background)
    const refreshOrders = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const res = await api.get('/goklin/orders');
            setOrders(res.data.data || []);
        } catch (e) {}
    }, [isLoggedIn]);

    // Load cached prices instantly saat mount, lalu fetch fresh
    useEffect(() => {
        (async () => {
            try {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    // Tampilkan cache dulu, biar user ga liat loading kosong
                    if (parsed.prices?.length) {
                        setPrices(parsed.prices);
                        setLoading(false);
                    }
                    // Kalau masih fresh (kurang dari 1 jam), skip fetchData
                    if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL) {
                        if (isLoggedIn) {
                            // Orders tetap di-fresh, prices dari cache
                            try {
                                const ordersRes = await api.get('/goklin/orders');
                                setOrders(ordersRes.data.data || []);
                            } catch (e) {}
                        }
                        return; // Skip fetchData penuh
                    }
                }
            } catch (e) {}
            fetchData();
        })();
    }, [fetchData, isLoggedIn]);

    const searchLocation = useCallback(async (query) => {
        if (!query.trim() || query.trim().length < 3) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=id`,
                { headers: { 'User-Agent': 'LigatApp/1.0 (admin@ligat.my.id)' } }
            );
            if (!res.ok) { setSearchResults([]); setSearching(false); return; }
            const data = await res.json();
            setSearchResults(data || []);
        } catch (e) {
            setSearchResults([]);
        }
        setSearching(false);
    }, []);

    const handleLocationChange = (text) => {
        setLokasi(text);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => searchLocation(text), 500);
    };

    const selectLocation = (item) => {
        setLokasi(item.display_name);
        setLatitude(item.lat);
        setLongitude(item.lon);
        setSearchResults([]);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    // Polling — hanya refresh orders, prices dari cache aja
    useEffect(() => {
        if (!isLoggedIn) return;
        intervalRef.current = setInterval(refreshOrders, POLL_INTERVAL);
        return () => clearInterval(intervalRef.current);
    }, [isLoggedIn, refreshOrders, POLL_INTERVAL]);

    // Auto-location
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({});
                    setLatitude(loc.coords.latitude.toFixed(6));
                    setLongitude(loc.coords.longitude.toFixed(6));
                }
            } catch (e) {}
        })();
    }, []);

    const handleSubmit = async () => {
        if (!selectedDurasi) { showToast('Pilih durasi layanan.', 'warning'); return; }
        if (!lokasi.trim()) { showToast('Masukkan lokasi.', 'warning'); return; }

        // Web manual input fallback: gabung date + time
        let value = jamPesan;
        if (Platform.OS === 'web' && !manualInput) {
            // Baca langsung dari DOM via querySelector (lebih reliable dari ref di RNW)
            try {
                const el = document.querySelector('input[type="datetime-local"]');
                if (el && el.value) value = el.value;
            } catch(e) {}
        }
        if (Platform.OS === 'web' && manualInput) {
            if (!manualDate.trim() || !manualTime.trim()) {
                showToast('Pilih jam pesan.', 'warning'); return;
            }
            value = manualDate.trim() + ' ' + manualTime.trim() + ':00';
        }
        if (!value.trim()) { showToast('Pilih jam pesan.', 'warning'); return; }

        // Format datetime: convert from input format to backend format (Y-m-d H:i:s)
        let jamFormatted = value.trim().replace('T', ' ');
        if (jamFormatted.length === 16) jamFormatted += ':00'; // Append :ss if missing

        const price = prices.find(p => p.durasi === selectedDurasi);
        if (!price) { showToast('Harga tidak ditemukan.', 'error'); return; }
        setSubmitting(true);
        try {
            const res = await api.post('/goklin/order', {
                durasi: selectedDurasi, harga: price.harga,
                lokasi: lokasi.trim(), latitude, longitude,
                jam_pesan: jamFormatted,
            });
            const newOrder = res.data.data;
            // Open payment modal immediately
            setPayOrder(newOrder);
            setPreviewImage(null);
            try { const b = await api.get('/goklin/bank-info'); if (b.data?.data) setPayBank(b.data.data); } catch (e) {}
            setShowPayModal(true);
            // Reset form
            setShowForm(false);
            setSelectedDurasi(null);
            setLokasi(''); setJamPesan('');
            fetchData();
        } catch (e) {
            showToast(e.response?.data?.message || 'Gagal membuat pesanan.', 'error');
        } finally { setSubmitting(false); }
    };

    const handleBayar = async (order) => {
        setPayOrder(order);
        setPreviewImage(null);
        setShowPayModal(true); // spinner langsung mutar
        // Fetch bank info di background
        try { const res = await api.get('/goklin/bank-info'); if (res.data?.data) setPayBank(res.data.data); } catch (e) {}
    };

    const pickReceipt = async () => {
        if (!payOrder) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { showToast('Aplikasi membutuhkan akses ke galeri.', 'warning'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
        if (result.canceled || !result.assets[0]) return;
        setPreviewImage(result.assets[0]);
    };

    const submitReceipt = async () => {
        if (!payOrder || !previewImage) return;
        setUploading(true);
        try {
            const fd = new FormData();
            // Handle blob URIs (web) vs file URIs (native)
            if (Platform.OS === 'web' && previewImage.uri?.startsWith('blob:')) {
                const blob = await fetch(previewImage.uri).then(r => r.blob());
                fd.append('bukti_bayar', blob, 'bukti_bayar.jpg');
            } else {
                fd.append('bukti_bayar', { uri: previewImage.uri, type: 'image/jpeg', name: 'bukti_bayar.jpg' });
            }
            await api.post(`/goklin/order/${payOrder.id}/bayar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowPayModal(false);
            setPreviewImage(null);
            fetchData();
        } catch (e) {
            showToast(e.response?.data?.message || e.message || 'Gagal upload.', 'error');
        }
        finally { setUploading(false); }
    };

    const handleCancel = (order) => {
        setConfirmCancel(order);
    };

    const doCancel = async () => {
        if (!confirmCancel) return;
        try {
            await api.post(`/goklin/order/${confirmCancel.id}/cancel`);
            showToast('Pesanan dibatalkan.', 'success');
            fetchData();
        } catch (e) { showToast('Tidak dapat membatalkan pesanan.', 'error'); }
        finally { setConfirmCancel(null); }
    };

    const renderOrder = (order) => {
        const st = STATUS_MAP[order.status] || {};
        const isPending = order.status === 'pending';
        const isActive = ['pending', 'dibayar', 'dikonfirmasi', 'mitra_otw', 'mitra_bekerja'].includes(order.status);
        return (
            <TouchableOpacity key={order.id} style={[styles.orderCard, isActive && styles.orderCardActive]}
                onPress={() => { setDetailOrder(order); setShowDetailModal(true); }} activeOpacity={0.8}>
                <View style={styles.orderHeader}>
                    <Text style={styles.orderKode}>{order.kode_order}</Text>
                    <Ionicons name={st.icon || 'ellipse'} size={20} color={st.color} />
                </View>
                <Text style={[styles.orderStatus, { color: st.color }]}>{st.label || order.status}</Text>
                <View style={styles.orderDetail}>
                    <Text style={styles.orderLabel}>{order.durasi} jam — Rp {Number(order.harga).toLocaleString('id-ID')}</Text>
                    <Text style={styles.orderLabel}>{order.lokasi}</Text>
                    {/* order.mitra && <Text style={styles.orderLabel}>Mitra: {order.mitra.nama}</Text> */}
                    {order.catatan_admin && (
                        <View style={styles.catatanBox}>
                            <Ionicons name="information-circle" size={14} color={colors.primary} />
                            <Text style={styles.catatanText}>{order.catatan_admin}</Text>
                        </View>
                    )}
                </View>
                {isPending && (
                    <View style={styles.orderActions}>
                        <TouchableOpacity style={styles.bayarBtn} onPress={() => handleBayar(order)} disabled={showPayModal}>
                            {showPayModal ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="cash" size={16} color="#fff" /><Text style={styles.btnText}>  Bayar</Text></>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(order)}>
                            <Ionicons name="close-circle" size={16} color={colors.danger} />
                            <Text style={[styles.btnText, { color: colors.danger }]}>  Batal</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <ThemeHeader style={styles.header}>
                <Text style={styles.headerTitle}>Jasa Cleaning</Text>
            </ThemeHeader>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        </View>
    );

    if (!isLoggedIn) return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <ThemeHeader style={styles.header}>
                <Text style={styles.headerTitle}>Jasa Cleaning</Text>
            </ThemeHeader>
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <ThemeHeader style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Jasa Cleaning</Text>
                    <TouchableOpacity style={styles.newOrderBtn} onPress={() => setShowForm(!showForm)}>
                        <Ionicons name={showForm ? 'list' : 'add'} size={18} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>  {showForm ? 'Orderan' : 'Pesan Lagi'}</Text>
                    </TouchableOpacity>
                </View>
            </ThemeHeader>

            <ScrollView showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}>
                {!showForm && orders.map(renderOrder)}

                {!showForm && orders.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="sparkles" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>Belum ada pesanan</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowForm(true)}>
                            <Text style={{ color: '#fff', fontWeight: '700' }}>Pesan Sekarang</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showForm && (
                    <View style={styles.formSection}>
                        <TouchableOpacity style={styles.backFormBtn} onPress={() => setShowForm(false)}>
                            <Ionicons name="arrow-back" size={18} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: '600', marginLeft: 6 }}>Kembali ke Orderan</Text>
                        </TouchableOpacity>
                        <Text style={styles.formTitle}>Pesan Layanan Kebersihan</Text>

                        <Text style={styles.formLabel}>Pilih Durasi</Text>
                        <View style={styles.priceGrid}>
                            {prices.filter(p => p.aktif).map(p => (
                                <TouchableOpacity key={p.id}
                                    style={[styles.priceCard, selectedDurasi === p.durasi && styles.priceCardActive]}
                                    onPress={() => setSelectedDurasi(p.durasi)}>
                                    <Text style={[styles.priceDurasi, selectedDurasi === p.durasi && styles.priceDurasiActive]}>{p.durasi} Jam</Text>
                                    <Text style={[styles.priceHarga, selectedDurasi === p.durasi && styles.priceHargaActive]}>Rp {Number(p.harga).toLocaleString('id-ID')}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.formLabel}>Lokasi</Text>
                        <TextInput style={styles.input} placeholder="Cari alamat..." placeholderTextColor={colors.textSecondary} value={lokasi} onChangeText={handleLocationChange} multiline />
                        {searching && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />}
                        {searchResults.length > 0 && (
                            <View style={styles.searchDropdown}>
                                {searchResults.map((item) => (
                                    <TouchableOpacity key={item.place_id} style={styles.searchItem} onPress={() => selectLocation(item)} activeOpacity={0.7}>
                                        <Ionicons name="location" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                                        <Text style={styles.searchItemText} numberOfLines={2}>{item.display_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={styles.formLabel}>Titik Lokasi (opsional)</Text>
                        <View style={styles.mapWrap}>
                            <WebView key={`map-${latitude}-${longitude}`} source={{ html: generateMapHtml(parseFloat(latitude), parseFloat(longitude)) }}
                                style={styles.mapWebview} scrollEnabled={false}
                                onMessage={(e) => { try { const d = JSON.parse(e.nativeEvent.data); if (d.lat && d.lng) { setLatitude(d.lat); setLongitude(d.lng); } } catch (err) {} }} />
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, marginBottom: 8 }}>
                            {latitude && longitude ? `Titik: ${latitude}, ${longitude}` : 'Map tidak tampil? Abaikan, order tetap bisa diproses.'}
                        </Text>

                        <Text style={styles.formLabel}>Jam Pesan</Text>
                        {Platform.OS === 'web' ? (
                            <>
                                {!manualInput ? (
                                    <>
                                        <input
                                            ref={datetimeRef}
                                            type="datetime-local"
                                            defaultValue={jamPesan}
                                            onChange={(e) => setJamPesan(e.target.value)}
                                            onInput={(e) => setJamPesan(e.target.value)}
                                            onBlur={(e) => e.target.value && setJamPesan(e.target.value)}
                                            style={{
                                                width: '100%', padding: 14, fontSize: 14,
                                                backgroundColor: colors.inputBg, color: colors.text,
                                                border: `1px solid ${colors.border}`, borderRadius: 12,
                                                outline: 'none', fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                            }}
                                            onClick={(e) => e.target.showPicker?.()}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setManualInput(true)}
                                            style={{ marginTop: 4, alignSelf: 'flex-end' }}
                                        >
                                            <Text style={{ color: colors.primary, fontSize: 11 }}>
                                                Input Manual
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <TextInput
                                            style={[styles.input, { marginBottom: 8 }]}
                                            placeholder="Tanggal (YYYY-MM-DD)"
                                            placeholderTextColor={colors.textSecondary}
                                            value={manualDate}
                                            onChangeText={setManualDate}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Jam (HH:MM)"
                                            placeholderTextColor={colors.textSecondary}
                                            value={manualTime}
                                            onChangeText={setManualTime}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setManualInput(false)}
                                            style={{ marginTop: 4, alignSelf: 'flex-end' }}
                                        >
                                            <Text style={{ color: colors.primary, fontSize: 11 }}>
                                                Pakai Date Picker
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                                    <Text style={{ color: jamPesan ? colors.text : colors.textSecondary, fontSize: 14 }}>
                                        {jamPesan || 'Ketuk untuk pilih tanggal & jam'}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(false);
                                            if (selectedDate) {
                                                setJamPesan(
                                                    selectedDate.getFullYear() + '-' +
                                                    String(selectedDate.getMonth()+1).padStart(2,'0') + '-' +
                                                    String(selectedDate.getDate()).padStart(2,'0')
                                                );
                                                setTimeout(() => setShowTimePicker(true), 300);
                                            }
                                        }}
                                    />
                                )}
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={new Date()}
                                        mode="time"
                                        display="default"
                                        onChange={(event, selectedTime) => {
                                            setShowTimePicker(false);
                                            if (selectedTime) {
                                                setJamPesan(prev => {
                                                    const datePart = prev.split(' ')[0];
                                                    return datePart + ' ' +
                                                        String(selectedTime.getHours()).padStart(2,'0') + ':' +
                                                        String(selectedTime.getMinutes()).padStart(2,'0') + ':00';
                                                });
                                            }
                                        }}
                                    />
                                )}
                            </>
                        )}

                        <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
                            {submitting ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="send" size={18} color="#fff" /><Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>  Buat Pesanan</Text></>}
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Payment Modal */}
            <Modal visible={showPayModal} transparent animationType="slide" onRequestClose={() => { if (!uploading) setShowPayModal(false); }}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {!previewImage ? (
                            <>
                                <Text style={styles.modalTitle}>Info Pembayaran</Text>
                                {payOrder && payBank && (
                                    <>
                                        <View style={styles.modalRow}>
                                            <Text style={styles.modalLabel}>Bank</Text>
                                            <Text style={styles.modalValue}>{payBank.nama_bank}</Text>
                                        </View>
                                        <View style={styles.modalRow}>
                                            <Text style={styles.modalLabel}>No. Rekening</Text>
                                            <Text style={styles.modalValue}>{payBank.no_rekening}</Text>
                                        </View>
                                        <View style={styles.modalRow}>
                                            <Text style={styles.modalLabel}>Atas Nama</Text>
                                            <Text style={styles.modalValue}>{payBank.atas_nama}</Text>
                                        </View>
                                        <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
                                            <Text style={styles.modalLabel}>Total</Text>
                                            <Text style={[styles.modalValue, { color: colors.primary, fontWeight: 'bold' }]}>
                                                Rp {Number(payOrder.harga).toLocaleString('id-ID')}
                                            </Text>
                                        </View>
                                        <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginVertical: 12 }}>
                                            Transfer ke rekening di atas, lalu upload bukti bayar
                                        </Text>
                                        <TouchableOpacity style={styles.modalBtn} onPress={pickReceipt}>
                                            <Text style={{ color: '#fff', fontWeight: '700' }}>Pilih Bukti Bayar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPayModal(false)}>
                                            <Text style={{ color: colors.textSecondary }}>Tutup</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Preview Bukti Bayar</Text>
                                <View style={styles.previewWrap}>
                                    <Image
                                        source={{ uri: previewImage.uri }}
                                        style={styles.previewImage}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginVertical: 8 }}>
                                    {payOrder?.kode_order} — Rp {Number(payOrder?.harga || 0).toLocaleString('id-ID')}
                                </Text>
                                <TouchableOpacity style={styles.modalBtn} onPress={submitReceipt} disabled={uploading}>
                                    {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Submit Bukti Bayar</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalCancel} onPress={() => setPreviewImage(null)} disabled={uploading}>
                                    <Text style={{ color: colors.textSecondary }}>Pilih Ulang</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Order Detail Modal */}
            <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Detail Pesanan</Text>
                        {detailOrder && (
                            <>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Kode</Text>
                                    <Text style={styles.modalValue}>{detailOrder.kode_order}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Status</Text>
                                    <Text style={[styles.modalValue, { color: (STATUS_MAP[detailOrder.status]?.color || colors.text) }]}>
                                        {STATUS_MAP[detailOrder.status]?.label || detailOrder.status}
                                    </Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Durasi</Text>
                                    <Text style={styles.modalValue}>{detailOrder.durasi} jam</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Harga</Text>
                                    <Text style={[styles.modalValue, { color: colors.primary, fontWeight: 'bold' }]}>
                                        Rp {Number(detailOrder.harga).toLocaleString('id-ID')}
                                    </Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Lokasi</Text>
                                    <Text style={[styles.modalValue, { flex: 1, textAlign: 'right' }]}>{detailOrder.lokasi}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Jam Pesan</Text>
                                    <Text style={styles.modalValue}>{detailOrder.jam_pesan}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Dibuat</Text>
                                    <Text style={styles.modalValue}>{new Date(detailOrder.created_at).toLocaleString('id-ID')}</Text>
                                </View>
                                {/* detailOrder.mitra && (
                                    <View style={styles.modalRow}>
                                        <Text style={styles.modalLabel}>Mitra</Text>
                                        <Text style={styles.modalValue}>{detailOrder.mitra.nama}</Text>
                                    </View>
                                ) */}
                                {detailOrder.catatan_admin && (
                                    <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
                                        <Text style={styles.modalLabel}>Catatan</Text>
                                        <Text style={[styles.modalValue, { flex: 1, textAlign: 'right' }]}>{detailOrder.catatan_admin}</Text>
                                    </View>
                                )}
                                <TouchableOpacity style={styles.modalBtn} onPress={() => setShowDetailModal(false)}>
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>Tutup</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <ConfirmModal
                visible={!!confirmCancel}
                onClose={() => setConfirmCancel(null)}
                title="Batalkan Pesanan"
                message={confirmCancel ? `Yakin ingin membatalkan ${confirmCancel.kode_order}?` : ''}
                confirmText="Ya, Batalkan"
                confirmStyle="destructive"
                onConfirm={doCancel}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 56, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
    newOrderBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    loginPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    loginTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8 },
    loginSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    loginBtn: { flexDirection: 'row', backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    orderCard: { backgroundColor: colors.card, borderRadius: 14, marginHorizontal: 16, marginTop: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
    orderCardActive: { borderColor: colors.primary },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderKode: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    orderStatus: { fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 8 },
    orderDetail: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
    orderLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    orderActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    bayarBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.success, borderRadius: 10, padding: 12, justifyContent: 'center', alignItems: 'center' },
    cancelBtn: { borderWidth: 1.5, borderColor: colors.danger, borderRadius: 10, padding: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 13, fontWeight: '700' },
    catatanBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(229,167,27,0.12)', borderRadius: 8, padding: 8, marginTop: 4 },
    catatanText: { fontSize: 11, color: colors.primary, marginLeft: 6, flex: 1 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 12, marginBottom: 20 },
    emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    formSection: { marginTop: 20, paddingHorizontal: 16 },
    formTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
    backFormBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    formLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 8 },
    priceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    priceCard: { width: (width - 48) / 2, backgroundColor: colors.card, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
    priceCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(229,167,27,0.1)' },
    priceDurasi: { fontSize: 16, fontWeight: '700', color: colors.text },
    priceDurasiActive: { color: colors.primary },
    priceHarga: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    priceHargaActive: { color: colors.primary },
    input: { backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 14, padding: 14, textAlignVertical: 'top' },
    searchDropdown: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, marginTop: 4, maxHeight: 200, overflow: 'hidden' },
    searchItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    searchItemText: { fontSize: 12, color: colors.text, flex: 1 },
    mapWrap: { height: 200, borderRadius: 12, overflow: 'hidden' },
    mapWebview: { flex: 1, backgroundColor: 'transparent' },
    submitBtn: { flexDirection: 'row', backgroundColor: colors.primary, borderRadius: 12, padding: 16, justifyContent: 'center', alignItems: 'center', marginTop: 16 },

    // Payment Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalLabel: { fontSize: 14, color: colors.textSecondary },
    modalValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    modalBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
    modalCancel: { alignItems: 'center', padding: 14, marginTop: 4 },
    previewWrap: { backgroundColor: colors.bg, borderRadius: 12, overflow: 'hidden', marginVertical: 12, height: 200 },
    previewImage: { flex: 1, width: '100%' },
});
