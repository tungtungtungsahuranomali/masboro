import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity,
    Alert, RefreshControl, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api, { API_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import colors from '../theme';
import Skeleton from '../components/Skeleton';
import LoginModal from '../components/LoginModal';

export default function TiketScreen({ navigation }) {
    const { token } = useAuth();
    const [tikets, setTikets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [keluhan, setKeluhan] = useState('');
    const [editId, setEditId] = useState(null);
    const [editKeluhan, setEditKeluhan] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editImage, setEditImage] = useState(null);
    const [showLogin, setShowLogin] = useState(false);

    const isLoggedIn = !!token;

    const getImageUrl = (path) => {
        const base = API_URL.replace('/api', '');
        return `${base}/storage/${path}`;
    };

    const fetchTiket = async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        try {
            // Tampilkan cache dulu
            if (!tikets.length) {
                const cached = await AsyncStorage.getItem('tiket_cache');
                if (cached) {
                    setTikets(JSON.parse(cached));
                    setLoading(false);
                }
            }

            const res = await api.get('/tiket');
            setTikets(res.data.data);
            AsyncStorage.setItem('tiket_cache', JSON.stringify(res.data.data));
        } catch (e) {
            console.log('Error fetch tiket:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchTiket(); }, [isLoggedIn]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTiket();
    }, []);

    const hasAktif = tikets.some(t => t.status === 'Antrian' || t.status === 'Proses');

    const pickImage = async (mode = 'create') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Diperlukan', 'Aplikasi membutuhkan akses ke galeri.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            if (mode === 'edit') {
                setEditImage(result.assets[0]);
            } else {
                setSelectedImage(result.assets[0]);
            }
        }
    };

    const handleSubmit = async () => {
        if (!keluhan.trim()) {
            Alert.alert('Peringatan', 'Keluhan harus diisi.');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('keluhan', keluhan.trim());
            if (selectedImage) {
                formData.append('gambar', {
                    uri: selectedImage.uri,
                    type: 'image/jpeg',
                    name: 'keluhan.jpg',
                });
            }
            const res = await api.post('/tiket', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert('Berhasil', res.data.message);
            setKeluhan('');
            setSelectedImage(null);
            fetchTiket();
        } catch (e) {
            const msg = e.response?.data?.message || 'Gagal mengirim tiket.';
            Alert.alert('Gagal', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!editKeluhan.trim()) {
            Alert.alert('Peringatan', 'Keluhan harus diisi.');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('keluhan', editKeluhan.trim());
            if (editImage) {
                formData.append('gambar', {
                    uri: editImage.uri,
                    type: 'image/jpeg',
                    name: 'keluhan.jpg',
                });
            }
            const res = await api.post(`/tiket/${editId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert('Berhasil', res.data.message);
            setEditId(null);
            setEditKeluhan('');
            setEditImage(null);
            fetchTiket();
        } catch (e) {
            const msg = e.response?.data?.message || 'Gagal mengedit tiket.';
            Alert.alert('Gagal', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Proses': return { bg: 'rgba(243,156,18,0.15)', text: colors.warning, icon: 'construct' };
            case 'Selesai': return { bg: 'rgba(46,204,113,0.15)', text: colors.success, icon: 'checkmark-circle' };
            default: return { bg: 'rgba(229,167,27,0.15)', text: colors.primary, icon: 'time' };
        }
    };

    if (loading) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Tiket Keluhan</Text>
                </LinearGradient>
                <View style={[styles.list, { marginTop: 16 }]}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.nomorWrap}>
                                    <Skeleton width={30} height={30} borderRadius={10} style={{ marginRight: 8 }} />
                                    <Skeleton width={120} height={16} />
                                </View>
                                <Skeleton width={60} height={20} borderRadius={20} />
                            </View>
                            <View>
                                <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
                                <Skeleton width="80%" height={14} style={{ marginBottom: 10 }} />
                                <Skeleton width="100%" height={80} borderRadius={12} />
                            </View>
                        </View>
                    ))}
                </View>
            </KeyboardAvoidingView>
        );
    }

    const renderItem = ({ item }) => {
        const st = getStatusStyle(item.status);
        const isEditing = editId === item.id;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.nomorWrap}>
                        <View style={styles.nomorIcon}>
                            <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.nomorTiket}>{item.nomor_tiket}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: st.bg }]}>
                        <Ionicons name={st.icon} size={12} color={st.text} />
                        <Text style={[styles.badgeText, { color: st.text }]}> {item.status}</Text>
                    </View>
                </View>

                {isEditing ? (
                    <View>
                        <TextInput
                            style={styles.editInput}
                            value={editKeluhan}
                            onChangeText={setEditKeluhan}
                            multiline
                            numberOfLines={3}
                            placeholder="Edit keluhan..."
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={[styles.editBtn, { backgroundColor: colors.success }]}
                                onPress={handleEdit}
                                disabled={submitting}
                            >
                                <Ionicons name="checkmark" size={16} color={colors.white} />
                                <Text style={styles.editBtnText}> {submitting ? 'Menyimpan...' : 'Simpan'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.editBtn, { backgroundColor: colors.textSecondary }]}
                                onPress={() => { setEditId(null); setEditKeluhan(''); }}
                            >
                                <Ionicons name="close" size={16} color={colors.white} />
                                <Text style={styles.editBtnText}> Batal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.keluhanText}>{item.keluhan}</Text>
                        {item.gambar && (
                            <Image
                                source={{ uri: getImageUrl(item.gambar) }}
                                style={styles.tiketImage}
                                contentFit="cover"
                            />
                        )}
                        {item.keterangan_tindakan && (
                            <View style={styles.tindakanBox}>
                                <View style={styles.tindakanHeader}>
                                    <Ionicons name="build" size={14} color={colors.success} />
                                    <Text style={styles.tindakanLabel}>  Tindakan:</Text>
                                </View>
                                <Text style={styles.tindakanText}>{item.keterangan_tindakan}</Text>
                            </View>
                        )}
                        {item.status === 'Antrian' && (
                            <TouchableOpacity
                                style={styles.editTrigger}
                                onPress={() => { setEditId(item.id); setEditKeluhan(item.keluhan); setEditImage(null); }}
                            >
                                <Ionicons name="create-outline" size={16} color={colors.primary} />
                                <Text style={styles.editTriggerText}> Edit Keluhan</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (!isLoggedIn) {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Tiket Keluhan</Text>
                </LinearGradient>
                <View style={styles.loginPrompt}>
                    <View style={styles.loginIconWrap}>
                        <Ionicons name="chatbubbles-outline" size={64} color={colors.primary} />
                    </View>
                    <Text style={styles.loginTitle}>Login Diperlukan</Text>
                    <Text style={styles.loginSubtitle}>Masuk untuk membuat tiket keluhan dan melihat histori</Text>
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
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Tiket Keluhan</Text>
            </LinearGradient>

            {!hasAktif && (
                <View style={styles.formCard}>
                    <View style={styles.formHeader}>
                        <Ionicons name="create" size={20} color={colors.primary} />
                        <Text style={styles.formTitle}>  Buat Tiket Keluhan</Text>
                    </View>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Jelaskan keluhan Anda..."
                        placeholderTextColor={colors.textSecondary}
                        value={keluhan}
                        onChangeText={setKeluhan}
                        multiline
                        numberOfLines={3}
                    />
                    {/* Image Picker */}
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage('create')} activeOpacity={0.7}>
                        <Ionicons name="camera-outline" size={18} color={colors.primary} />
                        <Text style={styles.imagePickerText}>
                            {selectedImage ? 'Ganti Foto' : 'Lampirkan Foto (opsional)'}
                        </Text>
                    </TouchableOpacity>
                    {selectedImage && (
                        <View style={styles.previewWrap}>
                            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} contentFit="cover" />
                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                                <Ionicons name="close-circle" size={24} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.8}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <View style={styles.submitContent}>
                                <Ionicons name="send" size={16} color={colors.white} />
                                <Text style={styles.submitText}>  Kirim Tiket</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {hasAktif && (
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={18} color={colors.primary} />
                    <Text style={styles.infoBoxText}>
                        Anda masih memiliki tiket aktif. Form buat tiket baru akan muncul setelah tiket selesai.
                    </Text>
                </View>
            )}

            <Text style={styles.historiTitle}>Histori Tiket</Text>
            <FlatList
                data={tikets}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListFooterComponent={<View style={{ height: 110 }} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="chatbubbles-outline" size={56} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>Belum ada tiket</Text>
                        <Text style={styles.emptySubtext}>Buat tiket baru jika ada keluhan</Text>
                    </View>
                }
            />

            <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} navigation={navigation} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    list: { paddingHorizontal: 16, paddingBottom: 20 },

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

    // Form
    formCard: {
        backgroundColor: colors.card,
        margin: 16,
        marginBottom: 0,
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    formTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    textArea: {
        backgroundColor: colors.bg,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: colors.text,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 80,
    },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 12,
    },
    submitContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },

    // Image picker
    imagePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(229,167,27,0.12)',
    },
    imagePickerText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    previewWrap: {
        marginTop: 10,
        position: 'relative',
        alignSelf: 'flex-start',
    },
    previewImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
    },
    removeImageBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.card,
        borderRadius: 12,
    },
    tiketImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginTop: 10,
    },

    // Info box
    infoBox: {
        margin: 16,
        marginBottom: 0,
        backgroundColor: 'rgba(229,167,27,0.15)',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    infoBoxText: { fontSize: 13, color: colors.primary, lineHeight: 20, flex: 1 },

    // Histori
    historiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 10,
    },

    // Card
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    nomorWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nomorIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: 'rgba(229,167,27,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    nomorTiket: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },

    keluhanText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

    tindakanBox: {
        marginTop: 10,
        backgroundColor: '#f0faf5',
        borderRadius: 10,
        padding: 12,
    },
    tindakanHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tindakanLabel: { fontSize: 12, fontWeight: '700', color: colors.success },
    tindakanText: { fontSize: 13, color: colors.text, marginTop: 4, lineHeight: 18 },

    editTrigger: {
        marginTop: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    editTriggerText: { fontSize: 13, fontWeight: '600', color: colors.primary },

    editInput: {
        backgroundColor: colors.bg,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: colors.text,
        textAlignVertical: 'top',
        borderWidth: 1.5,
        borderColor: colors.primary,
        minHeight: 70,
    },
    editActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
    editBtn: {
        flex: 1,
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    editBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },

    empty: { alignItems: 'center', paddingTop: 50 },
    emptyText: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 },
    emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

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
