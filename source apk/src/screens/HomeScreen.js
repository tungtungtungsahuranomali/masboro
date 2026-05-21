import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Dimensions,
    TouchableOpacity, RefreshControl, ActivityIndicator, Linking, FlatList,
    StatusBar, Alert, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api, { API_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import colors from '../theme';
import Skeleton from '../components/Skeleton';
import ThemeHeader from '../components/ThemeHeader';
import LoginModal from '../components/LoginModal';

const { width } = Dimensions.get('window');

function InfoCardItem({ info }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <TouchableOpacity
            style={styles.infoCard}
            activeOpacity={0.7}
            onPress={() => setExpanded(!expanded)}
        >
            <View style={styles.infoCardIcon}>
                <Ionicons name="megaphone" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoCardContent}>
                <Text style={styles.infoCardTitle}>{info.judul}</Text>
                <Text
                    style={styles.infoCardText}
                    numberOfLines={expanded ? undefined : 2}
                >
                    {info.konten}
                </Text>
                <Text style={styles.readMore}>
                    {expanded ? 'Sembunyikan ▲' : 'Selengkapnya ▼'}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function HomeScreen({ navigation }) {
    const { token, logout } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);
    const [showLogin, setShowLogin] = useState(false);
    const [appSettings, setAppSettings] = useState(null);
    const [theme, setTheme] = useState(null);
    const [quickMenus, setQuickMenus] = useState([]);
    const slideRef = useRef(null);

    const isLoggedIn = !!token;

    // Fetch public app settings + quick menus (available without login)
    useEffect(() => {
        (async () => {
            try {
                // Load from cache first
                const cachedMenus = await AsyncStorage.getItem('quick_menus_cache');
                if (cachedMenus) {
                    const parsed = JSON.parse(cachedMenus);
                    setQuickMenus(parsed.filter(m => m.active));
                }
            } catch (e) {}

            try {
                const [settingsRes, menuRes] = await Promise.all([
                    api.get('/app-settings'),
                    api.get('/quick-menus'),
                ]);
                if (settingsRes.data?.data) {
                    const d = settingsRes.data.data;
                    setAppSettings(d);
                    if (d.theme) setTheme(d.theme);
                }
                if (menuRes.data?.data) {
                    const menus = menuRes.data.data.filter(m => m.active);
                    setQuickMenus(menus);
                    AsyncStorage.setItem('quick_menus_cache', JSON.stringify(menus));
                }
            } catch (e) {}
        })();
    }, []);

    const fetchHome = async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        try {
            // Tampilkan data cache dulu (instant loading)
            if (!data) {
                const cached = await AsyncStorage.getItem('home_cache');
                if (cached) {
                    setData(JSON.parse(cached));
                    setLoading(false);
                }
            }

            // Fetch data fresh dari server
            const res = await api.get('/home');
            setData(res.data.data);
            AsyncStorage.setItem('home_cache', JSON.stringify(res.data.data));
        } catch (e) {
            console.log('Error fetch home:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHome();
        }, [isLoggedIn])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHome();
    }, []);

    useEffect(() => {
        if (!data?.slides?.length) return;
        const timer = setInterval(() => {
            setSlideIndex(prev => {
                const next = (prev + 1) % data.slides.length;
                slideRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 4000);
        return () => clearInterval(timer);
    }, [data?.slides]);

    const onSlideScroll = (e) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (width - 40));
        if (index >= 0 && index < (data?.slides?.length || 0)) {
            setSlideIndex(index);
        }
    };

    const handleLinkPress = (item) => {
        if (item.tipe_link === 'internal' && item.konten) {
            navigation.navigate('InternalContent', {
                title: item.nama || item.nama_promosi || 'Detail',
                konten: item.konten,
            });
        } else if (item.url_link) {
            Linking.openURL(item.url_link);
        }
    };

    const getImageUrl = (path) => {
        const base = API_URL.replace('/api', '');
        return `${base}/storage/${path}`;
    };

    const handleQuickMenuPress = (menu) => {
        if (menu.require_auth && !isLoggedIn) {
            setShowLogin(true);
            return;
        }

        if (menu.type === 'webview' && menu.url) {
            navigation.navigate('InternalContent', {
                title: menu.label,
                url: menu.url,
            });
        } else if (menu.type === 'navigation' && menu.target) {
            navigation.navigate(menu.target);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header Skeleton */}
                    <ThemeHeader style={styles.header}>
                        <View style={styles.headerTop}>
                            <View style={styles.headerLeft}>
                                <Skeleton width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
                                <View>
                                    <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                                    <Skeleton width={120} height={16} />
                                </View>
                            </View>
                            <Skeleton width={60} height={30} borderRadius={20} />
                        </View>
                    </ThemeHeader>

                    {/* Floating Card Skeleton */}
                    <View style={styles.floatingCardWrap}>
                        <View style={styles.floatingCard}>
                            <View style={styles.infoItem}><Skeleton width={20} height={20} borderRadius={10} /><Skeleton width={50} height={10} style={{ marginTop: 6 }} /><Skeleton width={40} height={12} style={{ marginTop: 4 }} /></View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoItem}><Skeleton width={20} height={20} borderRadius={10} /><Skeleton width={50} height={10} style={{ marginTop: 6 }} /><Skeleton width={60} height={12} style={{ marginTop: 4 }} /></View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoItem}><Skeleton width={20} height={20} borderRadius={10} /><Skeleton width={50} height={10} style={{ marginTop: 6 }} /><Skeleton width={40} height={12} style={{ marginTop: 4 }} /></View>
                        </View>
                    </View>

                    {/* Quick Actions Skeleton */}
                    <View style={styles.quickActions}>
                        <Skeleton width={100} height={16} style={{ marginBottom: 14 }} />
                        <View style={styles.quickGrid}>
                            {[1, 2, 3, 4].map(i => (
                                <View key={i} style={styles.quickItem}>
                                    <Skeleton width={52} height={52} borderRadius={16} style={{ marginBottom: 8 }} />
                                    <Skeleton width={40} height={10} style={{ marginBottom: 4 }} />
                                    <Skeleton width={50} height={10} />
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Banner Skeleton */}
                    <View style={styles.section}>
                        <Skeleton width={120} height={16} style={{ marginBottom: 14 }} />
                        <Skeleton width={width - 40} height={160} borderRadius={16} />
                    </View>

                    {/* Berita Skeleton */}
                    <View style={styles.section}>
                        <Skeleton width={140} height={16} style={{ marginBottom: 14 }} />
                        {[1, 2, 3].map(i => (
                            <View key={i} style={[styles.newsItem, { padding: 0 }]}>
                                <Skeleton width={100} height={90} borderRadius={0} />
                                <View style={styles.newsContent}>
                                    <Skeleton width={50} height={14} borderRadius={8} style={{ marginBottom: 6 }} />
                                    <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
                                    <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
                                    <Skeleton width={80} height={10} />
                                </View>
                            </View>
                        ))}
                    </View>
                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
        );
    }

    const pelanggan = data?.pelanggan;
    const slides = data?.slides || [];
    const kategoris = data?.kategoris || [];
    const informasis = data?.informasis || [];
    const artikelTerbaru = data?.artikel_terbaru || [];
    const tagihanAktif = data?.tagihan_aktif || [];

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const getInitial = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    const getStatusData = (p) => {
        if (!p) return { label: '-', color: colors.textSecondary, icon: 'help-circle' };
        if (p.status_isolir || p.status === 'isolir') return { label: 'Isolir', color: colors.danger, icon: 'close-circle' };
        if (p.status === 'register' || p.status === 'baru' || p.status === 'Baru') return { label: 'Baru', color: colors.primary, icon: 'person-add' };
        if (p.status === 'proses' || p.status === 'Proses') return { label: 'Proses', color: colors.warning, icon: 'time' };
        if (p.status === 'pembayaran' || p.status === 'Pembayaran') return { label: 'Pembayaran', color: colors.warning, icon: 'wallet' };
        if (p.status === 'berhenti' || p.status === 'Berhenti') return { label: 'Berhenti', color: colors.danger, icon: 'stop-circle' };
        return { label: 'Aktif', color: colors.success, icon: 'checkmark-circle' };
    };

    const statusData = getStatusData(pelanggan);

    return (
        <View style={styles.container}>
            {theme?.bg_image && (
                <View style={StyleSheet.absoluteFill}><Image source={{ uri: theme.bg_image }} style={StyleSheet.absoluteFill} resizeMode="cover" /><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} /></View>
            )}
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
            >
                {/* Gradient Header */}
                <ThemeHeader style={styles.header}>
                    {isLoggedIn ? (
                        <View style={styles.headerTop}>
                            <View style={styles.headerLeft}>
                                <TouchableOpacity onPress={() => navigation.navigate('Profil')} activeOpacity={0.8}>
                                    {pelanggan?.foto_profil ? (
                                        <Image
                                            source={{ uri: getImageUrl(pelanggan.foto_profil) }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarText}>{getInitial(pelanggan?.nama)}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.greetingWrap}>
                                    <Text style={styles.greeting}>Selamat datang,</Text>
                                    <Text style={styles.userName}>{pelanggan?.nama || 'Pelanggan'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                                <Ionicons name="log-out-outline" size={18} color={colors.white} />
                                <Text style={styles.logoutText}>Keluar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.headerCenter}>
                            <View style={styles.publicLogo}>
                                <Ionicons name="globe" size={36} color={colors.white} />
                            </View>
                            <Text style={styles.publicAppName}>{appSettings?.app_name || 'LIGAT'}</Text>
                            <Text style={styles.publicTagline}>{appSettings?.app_tagline || 'Manejemen Tiket, Akses & Respons Internet'}</Text>
                            <View style={styles.publicBtnRow}>
                                <TouchableOpacity onPress={() => setShowLogin(true)} style={styles.publicLoginBtn}>
                                    <Ionicons name="log-in-outline" size={16} color={colors.white} />
                                    <Text style={styles.publicLoginText}>  Masuk</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.publicRegisterBtn}>
                                    <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                                    <Text style={styles.publicRegisterText}>  Daftar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ThemeHeader>

                {/* Floating Info Card */}
                <View style={styles.floatingCardWrap}>
                    <View style={styles.floatingCard}>
                        <TouchableOpacity
                            style={styles.infoItem}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('SpeedTest')}
                        >
                            <Ionicons name="speedometer" size={20} color={colors.primary} />
                            <Text style={styles.infoLabel}>Speed Test</Text>
                            <Text style={[styles.infoValue, { color: colors.primary }]}>Cek →</Text>
                        </TouchableOpacity>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar" size={20} color={colors.warning} />
                            <Text style={styles.infoLabel}>Tagihan Rutin</Text>
                            <Text style={styles.infoValue}>
                                Tanggal 1 - 5
                            </Text>
                        </View>
                        <View style={styles.infoDivider} />
                        {isLoggedIn ? (
                            <TouchableOpacity
                                style={styles.infoItem}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('Profil')}
                            >
                                <Ionicons
                                    name={statusData.icon}
                                    size={20}
                                    color={statusData.color}
                                />
                                <Text style={styles.infoLabel}>Status</Text>
                                <Text style={[styles.infoValue, {
                                    color: statusData.color
                                }]}>
                                    {statusData.label}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.infoItem}
                                activeOpacity={0.7}
                                onPress={() => setShowLogin(true)}
                            >
                                <Ionicons
                                    name="log-in-outline"
                                    size={20}
                                    color={colors.primary}
                                />
                                <Text style={styles.infoLabel}>Akun</Text>
                                <Text style={[styles.infoValue, { color: colors.primary }]}>
                                    Masuk →
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Tagihan Aktif Alert — only when logged in */}
                {isLoggedIn && tagihanAktif.length > 0 && (() => {
                    const belumBayar = tagihanAktif.filter(t => t.status === 'Tertagih');
                    const menungguVerifikasi = tagihanAktif.filter(t => t.status === 'Verifikasi');
                    const hasBelumBayar = belumBayar.length > 0;

                    return (
                        <TouchableOpacity
                            style={styles.tagihanAlert}
                            onPress={() => navigation.navigate('Tagihan')}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={hasBelumBayar ? ['#2A1515', '#1E1010'] : ['#2A2510', '#1E1A0A']}
                                style={[styles.tagihanAlertGradient, !hasBelumBayar && { borderColor: '#5A4A10' }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.tagihanAlertLeft}>
                                    <View style={[styles.tagihanAlertIcon, !hasBelumBayar && { backgroundColor: '#3A3010' }]}>
                                        <Ionicons
                                            name={hasBelumBayar ? 'alert-circle' : 'time'}
                                            size={24}
                                            color={hasBelumBayar ? colors.danger : colors.warning}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {hasBelumBayar ? (
                                            <>
                                                <Text style={styles.tagihanAlertTitle}>
                                                    {belumBayar.length} Tagihan Belum Dibayar
                                                </Text>
                                                <Text style={styles.tagihanAlertAmount}>
                                                    Total: Rp {belumBayar.reduce((sum, t) => sum + Number(t.nominal || 0), 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                                </Text>
                                                {belumBayar.some(t => t.catatan_admin) && (
                                                    <Text style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4, fontStyle: 'italic' }} numberOfLines={2}>
                                                        ⚠️ {belumBayar.find(t => t.catatan_admin)?.catatan_admin}
                                                    </Text>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Text style={[styles.tagihanAlertTitle, { color: '#fbbf24' }]}>
                                                    {menungguVerifikasi.length} Menunggu Verifikasi
                                                </Text>
                                                <Text style={[styles.tagihanAlertAmount, { color: colors.warning }]}>
                                                    Bukti bayar sedang diproses
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                                <View style={[styles.tagihanAlertBtn, !hasBelumBayar && { backgroundColor: colors.warning }]}>
                                    <Text style={styles.tagihanAlertBtnText}>{hasBelumBayar ? 'Bayar' : 'Lihat'}</Text>
                                    <Ionicons name="chevron-forward" size={14} color={colors.white} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    );
                })()}

                {/* Quick Actions — Dynamic */}
                {quickMenus.length > 0 && (
                <View style={styles.quickActions}>
                    <Text style={styles.sectionTitle}>Menu Cepat</Text>
                    <View style={styles.quickGrid}>
                        {quickMenus.map((menu) => {
                            const needsAuth = menu.require_auth && !isLoggedIn;
                            const iconName = menu.icon || 'ellipse';
                            const iconColor = needsAuth ? colors.textSecondary : colors.primary;
                            return (
                                <TouchableOpacity
                                    key={menu.id}
                                    style={styles.quickItem}
                                    onPress={() => handleQuickMenuPress(menu)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.quickIcon, { backgroundColor: 'rgba(229,167,27,0.15)' }]}>
                                        {menu.image_url ? (
                                            <Image source={{ uri: menu.image_url }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                                        ) : (
                                            <Ionicons name={iconName} size={24} color={iconColor} />
                                        )}
                                    </View>
                                    <Text style={[styles.quickLabel, needsAuth && { color: colors.textSecondary }]}>
                                        {menu.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
                )}

                {/* Informasi */}
                {informasis.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📢 Informasi</Text>
                        {informasis.map(info => (
                            <InfoCardItem key={info.id} info={info} />
                        ))}
                    </View>
                )}

                {/* Carousel Slide */}
                {slides.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🖼️ Promo & Info</Text>
                        <View style={styles.carousel}>
                            <FlatList
                                ref={slideRef}
                                data={slides}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={width - 40}
                                decelerationRate="fast"
                                onMomentumScrollEnd={onSlideScroll}
                                keyExtractor={(item, i) => (item.id || i).toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        activeOpacity={item.url_link ? 0.8 : 1}
                                        onPress={() => handleLinkPress(item)}
                                    >
                                        <Image
                                            source={{ uri: getImageUrl(item.image_path) }}
                                            style={styles.slideImage}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}
                            />
                            <View style={styles.dots}>
                                {slides.map((_, i) => (
                                    <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Promosi per Kategori */}
                {kategoris.map(kat => (
                    kat.promosis?.length > 0 && (
                        <View key={kat.id} style={styles.section}>
                            <Text style={styles.sectionTitle}>🏷️ {kat.nama_kategori}</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={kat.promosis}
                                keyExtractor={item => item.id.toString()}
                                contentContainerStyle={{ paddingBottom: 10 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.promoCard}
                                        onPress={() => handleLinkPress(item)}
                                        activeOpacity={item.url_link ? 0.7 : 1}
                                    >
                                        <Image
                                            source={{ uri: getImageUrl(item.image_path) }}
                                            style={styles.promoImage}
                                            resizeMode="cover"
                                        />
                                        <Text style={styles.promoName} numberOfLines={2}>{item.nama_promosi}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )
                ))}

                {/* Berita Terbaru */}
                {artikelTerbaru.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>📰 Berita Terbaru</Text>
                        </View>
                        {artikelTerbaru.map(artikel => (
                            <TouchableOpacity
                                key={artikel.id}
                                style={styles.newsItem}
                                onPress={() => navigation.navigate('BeritaDetail', { slug: artikel.slug, judul: artikel.judul })}
                                activeOpacity={0.8}
                            >
                                {artikel.gambar ? (
                                    <Image
                                        source={{ uri: getImageUrl(artikel.gambar) }}
                                        style={styles.newsImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.newsImage, styles.newsImagePlaceholder]}>
                                        <Ionicons name="newspaper-outline" size={24} color={colors.textSecondary} />
                                    </View>
                                )}
                                <View style={styles.newsContent}>
                                    <Text style={styles.newsCategory}>
                                        {artikel.kategori?.nama_kategori || 'Umum'}
                                    </Text>
                                    <Text style={styles.newsTitle} numberOfLines={2}>{artikel.judul}</Text>
                                    <Text style={styles.newsDate}>
                                        <Ionicons name="time-outline" size={11} color={colors.textSecondary} /> {formatDate(artikel.created_at)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.seeMoreBtn}
                            onPress={() => navigation.navigate('BeritaList')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.seeMoreText}>Lihat Berita Lainnya</Text>
                            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 160 }} />
            </ScrollView>

            {/* Login Modal */}
            <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} navigation={navigation} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

    // Header
    header: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 56,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerCenter: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    publicLogo: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    publicAppName: {
        color: colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    publicTagline: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 4,
        textAlign: 'center',
    },
    publicBtnRow: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    publicLoginBtn: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
    },
    publicLoginText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
    publicRegisterBtn: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: colors.primary,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    publicRegisterText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    avatarPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    greetingWrap: {
        flex: 1,
    },
    greeting: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
    },
    userName: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    logoutText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    },

    // Floating Info Card
    floatingCardWrap: {
        paddingHorizontal: 20,
        marginTop: -24,
        marginBottom: 8,
    },
    floatingCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.border,
    },
    infoLabel: {
        color: colors.textSecondary,
        fontSize: 10,
        marginTop: 4,
    },
    infoValue: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
        textAlign: 'center',
    },

    // Quick Actions
    quickActions: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    quickGrid: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickItem: {
        alignItems: 'center',
        width: (width - 60) / 4,
        marginBottom: 12,
    },
    quickIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickLabel: {
        fontSize: 11,
        color: colors.text,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 15,
    },

    // Sections
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 14,
    },

    // Carousel
    carousel: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    slideImage: {
        width: width - 40,
        height: 160,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 3,
    },
    dotActive: {
        backgroundColor: colors.white,
        width: 22,
    },

    // Info cards
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        elevation: 3,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        borderWidth: 1,
        borderColor: colors.border,
        shadowRadius: 4,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(229,167,27,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoCardContent: {
        flex: 1,
    },
    infoCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    infoCardText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 4,
        lineHeight: 20,
    },
    readMore: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        marginTop: 6,
    },

    // Promo
    promoCard: {
        width: 160,
        backgroundColor: colors.card,
        borderRadius: 14,
        marginRight: 12,
        marginBottom: 10,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    promoImage: {
        width: 160,
        height: 110,
    },
    promoName: {
        padding: 10,
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },

    // Berita Terbaru
    newsItem: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        borderWidth: 1,
        borderColor: colors.border,
        shadowRadius: 4,
    },
    newsImage: {
        width: 100,
        height: 90,
    },
    newsImagePlaceholder: {
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newsContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    newsCategory: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        backgroundColor: 'rgba(229,167,27,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
        overflow: 'hidden',
        marginBottom: 4,
    },
    newsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        lineHeight: 18,
        marginBottom: 4,
    },
    newsDate: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    seeMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: colors.card,
        borderRadius: 14,
        marginTop: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    seeMoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        marginRight: 6,
    },

    // Tagihan Alert
    tagihanAlert: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    tagihanAlertGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#5A1515',
    },
    tagihanAlertLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    tagihanAlertIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(231,76,60,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tagihanAlertTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ff6b6b',
    },
    tagihanAlertAmount: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.danger,
        marginTop: 2,
    },
    tagihanAlertBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.danger,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    tagihanAlertBtnText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
        marginRight: 4,
    },
});
