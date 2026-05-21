import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Dimensions,
    TouchableOpacity, RefreshControl, ActivityIndicator, FlatList,
    StatusBar, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api, { API_URL } from '../api';
import colors from '../theme';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');

function KategoriTab({ kategoris, selected, onSelect }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScroll}
            contentContainerStyle={styles.tabContainer}
        >
            <TouchableOpacity
                style={[styles.tab, !selected && styles.tabActive]}
                onPress={() => onSelect(null)}
                activeOpacity={0.7}
            >
                <Text style={[styles.tabText, !selected && styles.tabTextActive]}>Semua</Text>
            </TouchableOpacity>
            {kategoris.map(kat => (
                <TouchableOpacity
                    key={kat.id}
                    style={[styles.tab, selected === kat.id && styles.tabActive]}
                    onPress={() => onSelect(kat.id)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, selected === kat.id && styles.tabTextActive]}>
                        {kat.nama_kategori}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

function ArtikelCard({ item, onPress }) {
    const getImageUrl = (path) => {
        const base = API_URL.replace('/api', '');
        return `${base}/storage/${path}`;
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            {item.gambar ? (
                <Image
                    source={{ uri: getImageUrl(item.gambar) }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.cardImagePlaceholder}>
                    <Ionicons name="newspaper-outline" size={40} color={colors.textSecondary} />
                </View>
            )}
            <View style={styles.cardBody}>
                <View style={styles.cardMeta}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                            {item.kategori?.nama_kategori || '-'}
                        </Text>
                    </View>
                    <Text style={styles.cardDate}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} /> {formatDate(item.created_at)}
                    </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.judul}</Text>
                <Text style={styles.cardExcerpt} numberOfLines={2}>
                    {item.konten?.replace(/<[^>]*>/g, '').substring(0, 100)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function BeritaScreen({ navigation }) {
    const [artikels, setArtikels] = useState([]);
    const [kategoris, setKategoris] = useState([]);
    const [selectedKategori, setSelectedKategori] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchArtikels = async (pageNum = 1, kategoriId = null, append = false) => {
        try {
            // Tampilkan cache saat first load
            if (pageNum === 1 && !append && !artikels.length) {
                const cached = await AsyncStorage.getItem('berita_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setArtikels(parsed.artikels);
                    setKategoris(parsed.kategoris);
                    setLastPage(parsed.lastPage);
                    setLoading(false);
                }
            }

            let url = `/artikel?page=${pageNum}`;
            if (kategoriId) url += `&kategori_id=${kategoriId}`;
            const res = await api.get(url);
            const data = res.data.data;

            if (append) {
                setArtikels(prev => [...prev, ...data.artikels.data]);
            } else {
                setArtikels(data.artikels.data);
            }
            setKategoris(data.kategoris || []);
            setLastPage(data.artikels.last_page);
            setPage(pageNum);

            // Cache halaman pertama
            if (pageNum === 1 && !append) {
                AsyncStorage.setItem('berita_cache', JSON.stringify({
                    artikels: data.artikels.data,
                    kategoris: data.kategoris || [],
                    lastPage: data.artikels.last_page,
                }));
            }
        } catch (e) {
            console.log('Error fetch artikels:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchArtikels(1, selectedKategori);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchArtikels(1, selectedKategori);
    }, [selectedKategori]);

    const onSelectKategori = (kategoriId) => {
        setSelectedKategori(kategoriId);
        setLoading(true);
        fetchArtikels(1, kategoriId);
    };

    const onEndReached = () => {
        if (page < lastPage && !loadingMore) {
            setLoadingMore(true);
            fetchArtikels(page + 1, selectedKategori, true);
        }
    };

    const navigateToDetail = (artikel) => {
        navigation.navigate('BeritaDetail', { slug: artikel.slug, judul: artikel.judul });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />

            {/* Gradient Header */}
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Berita</Text>
                <View style={{ width: 36 }} />
            </LinearGradient>

            {/* Category Filter */}
            <KategoriTab
                kategoris={kategoris}
                selected={selectedKategori}
                onSelect={onSelectKategori}
            />

            {/* Articles List */}
            {loading ? (
                <View style={[styles.listContainer, { paddingTop: 16 }]}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.card}>
                            <Skeleton width="100%" height={180} borderRadius={0} />
                            <View style={styles.cardBody}>
                                <View style={styles.cardMeta}>
                                    <Skeleton width={60} height={20} borderRadius={12} />
                                    <Skeleton width={80} height={12} />
                                </View>
                                <Skeleton width="90%" height={18} style={{ marginBottom: 6 }} />
                                <Skeleton width="60%" height={18} style={{ marginBottom: 16 }} />
                                <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
                                <Skeleton width="80%" height={14} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : artikels.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyText}>Belum ada artikel</Text>
                </View>
            ) : (
                <FlatList
                    data={artikels}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ArtikelCard item={item} onPress={() => navigateToDetail(item)} />
                    )}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 12 },

    // Header
    header: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 52,
        paddingBottom: 18,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '700',
    },

    // Category Tabs
    tabScroll: {
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexGrow: 0,
        maxHeight: 56,
    },
    tabContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        alignItems: 'center',
    },
    tab: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: colors.white,
    },

    // Article List
    listContainer: {
        padding: 16,
    },

    // Article Card
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardImage: {
        width: '100%',
        height: 180,
    },
    cardImagePlaceholder: {
        width: '100%',
        height: 140,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        padding: 14,
    },
    cardMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryBadge: {
        backgroundColor: 'rgba(229,167,27,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryBadgeText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    cardDate: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        lineHeight: 22,
        marginBottom: 6,
    },
    cardExcerpt: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});
