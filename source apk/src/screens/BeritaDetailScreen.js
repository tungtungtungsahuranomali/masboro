import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Dimensions,
    ActivityIndicator, StatusBar, TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import api, { API_URL } from '../api';
import colors from '../theme';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');

export default function BeritaDetailScreen({ route, navigation }) {
    const { slug } = route.params;
    const [artikel, setArtikel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [webViewHeight, setWebViewHeight] = useState(300);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        const base = API_URL.replace('/api', '');
        return `${base}/storage/${path}`;
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/artikel/${slug}`);
                setArtikel(res.data.data);
            } catch (e) {
                console.log('Error fetch detail:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [slug]);

    // Generate HTML wrapper for WebView to render TinyMCE content properly
    const generateHtml = (konten) => {
        const baseUrl = API_URL.replace('/api', '');
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 15px;
                    line-height: 1.8;
                    color: #000000;
                    padding: 0;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    background-color: #ffffff;
                }
                img {
                    max-width: 100% !important;
                    height: auto !important;
                    border-radius: 8px;
                    margin: 8px 0;
                }
                p { margin-bottom: 12px; }
                h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
                h2 { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
                h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
                h4 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
                ul, ol { padding-left: 20px; margin-bottom: 12px; }
                li { margin-bottom: 4px; }
                blockquote {
                    border-left: 3px solid #6366f1;
                    padding-left: 12px;
                    margin: 12px 0;
                    color: #475569;
                    font-style: italic;
                }
                a { color: #6366f1; text-decoration: underline; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 12px 0;
                }
                table td, table th {
                    border: 1px solid #e2e8f0;
                    padding: 8px;
                    font-size: 13px;
                }
                table th {
                    background: #f1f5f9;
                    font-weight: 600;
                }
                pre, code {
                    font-family: 'Courier New', monospace;
                    background: #f1f5f9;
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 13px;
                }
                pre {
                    padding: 12px;
                    overflow-x: auto;
                    margin: 12px 0;
                }
            </style>
        </head>
        <body>
            ${konten}
            <script>
                // Send height to React Native after content loads
                function sendHeight() {
                    const height = document.body.scrollHeight;
                    window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
                }
                window.addEventListener('load', function() {
                    setTimeout(sendHeight, 300);
                });
                // Observe DOM changes
                const observer = new MutationObserver(sendHeight);
                observer.observe(document.body, { childList: true, subtree: true });
            </script>
        </body>
        </html>`;
    };

    const onWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.height) {
                setWebViewHeight(data.height + 20);
            }
        } catch (e) { }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Skeleton width={width} height={240} borderRadius={0} />
                    <View style={styles.floatingBack}>
                        <Ionicons name="arrow-back" size={22} color={colors.white} />
                    </View>
                    <View style={[styles.content, { backgroundColor: '#FFFFFF' }]}>
                        <View style={styles.metaRow}>
                            <Skeleton width={80} height={24} borderRadius={14} />
                        </View>
                        <Skeleton width="100%" height={26} style={{ marginBottom: 8 }} />
                        <Skeleton width="70%" height={26} style={{ marginBottom: 16 }} />
                        <View style={styles.dateRow}>
                            <Skeleton width={120} height={14} />
                        </View>
                        <View style={styles.divider} />
                        <View style={{ gap: 10 }}>
                            <Skeleton width="100%" height={16} />
                            <Skeleton width="100%" height={16} />
                            <Skeleton width="100%" height={16} />
                            <Skeleton width="90%" height={16} />
                            <View style={{ height: 20 }} />
                            <Skeleton width="100%" height={16} />
                            <Skeleton width="100%" height={16} />
                            <Skeleton width="80%" height={16} />
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    if (!artikel) {
        return (
            <View style={[styles.center, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.errorText}>Artikel tidak ditemukan</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                {artikel.gambar ? (
                    <Image
                        source={{ uri: getImageUrl(artikel.gambar) }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                ) : (
                    <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroPlaceholder}
                    >
                        <Ionicons name="newspaper" size={48} color="rgba(255,255,255,0.5)" />
                    </LinearGradient>
                )}

                {/* Back Button Floating */}
                <TouchableOpacity
                    style={styles.floatingBack}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={22} color={colors.white} />
                </TouchableOpacity>

                {/* Article Content */}
                <View style={[styles.content, { backgroundColor: '#FFFFFF' }]}>
                    {/* Category Badge */}
                    <View style={styles.metaRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {artikel.kategori?.nama_kategori || '-'}
                            </Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: '#000000' }]}>{artikel.judul}</Text>

                    {/* Date */}
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={[styles.dateText, { color: '#64748b' }]}>{formatDate(artikel.created_at)}</Text>
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: '#e2e8f0' }]} />

                    {/* Body — Rendered HTML via WebView */}
                    <View style={{ height: webViewHeight }}>
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: generateHtml(artikel.konten) }}
                            style={{ flex: 1, backgroundColor: 'transparent' }}
                            scrollEnabled={false}
                            onMessage={onWebViewMessage}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    errorText: { color: colors.textSecondary, fontSize: 14, marginTop: 12 },

    // Hero Image
    heroImage: {
        width: width,
        height: 240,
    },
    heroPlaceholder: {
        width: width,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Floating Back Button
    floatingBack: {
        position: 'absolute',
        top: 48,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Content
    content: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        minHeight: 400,
    },

    metaRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    badge: {
        backgroundColor: 'rgba(229,167,27,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
    },
    badgeText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },

    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        lineHeight: 30,
        marginBottom: 10,
    },

    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    dateText: {
        fontSize: 13,
        color: colors.textSecondary,
    },

    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 20,
    },

    backButton: {
        marginTop: 16,
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    backButtonText: {
        color: colors.white,
        fontWeight: '600',
    },
});
