import React, { useState, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Dimensions,
    StatusBar, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import colors from '../theme';

const { width } = Dimensions.get('window');

export default function InternalContentScreen({ route, navigation }) {
    const { title, konten, url } = route.params;
    const [webViewHeight, setWebViewHeight] = useState(400);
    const [webLoaded, setWebLoaded] = useState(false);
    const webRef = useRef(null);

    const isUrlMode = !!url;

    const generateHtml = (content) => {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', -apple-system, sans-serif;
                    font-size: 15px; line-height: 1.8; color: #000000;
                    padding: 0; word-wrap: break-word;
                    background-color: #ffffff;
                }
                img { max-width: 100% !important; height: auto !important; border-radius: 8px; margin: 8px 0; }
                p { margin-bottom: 12px; }
                h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
                h2 { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
                h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
                ul, ol { padding-left: 20px; margin-bottom: 12px; }
                li { margin-bottom: 4px; }
                blockquote { border-left: 3px solid #6366f1; padding-left: 12px; margin: 12px 0; color: #475569; font-style: italic; }
                a { color: #6366f1; }
                table { width: 100%; border-collapse: collapse; margin: 12px 0; }
                table td, table th { border: 1px solid #e2e8f0; padding: 8px; font-size: 13px; }
                table th { background: #f1f5f9; font-weight: 600; }
            </style>
        </head>
        <body>
            ${content || '<p>Tidak ada konten.</p>'}
            <script>
                function sendHeight() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ height: document.body.scrollHeight }));
                }
                window.addEventListener('load', function() { setTimeout(sendHeight, 300); });
            </script>
        </body>
        </html>`;
    };

    const onWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.height) setWebViewHeight(data.height + 20);
        } catch (e) { }
    };

    // URL mode: full screen webview with native feel
    if (isUrlMode) {
        return (
            <View style={styles.urlContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0D0D15" />
                {/* Floating back button */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.urlBackBtn}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>

                {/* Title bar */}
                <View style={styles.urlTitleBar}>
                    <Text style={styles.urlTitle} numberOfLines={1}>{title || ''}</Text>
                </View>

                {/* Loading indicator */}
                {!webLoaded && (
                    <View style={styles.urlLoader}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                )}

                {/* Full screen webview */}
                <WebView
                    ref={webRef}
                    source={{ uri: url }}
                    style={styles.urlWebview}
                    onLoad={() => setWebLoaded(true)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={false}
                    allowsInlineMediaPlayback={true}
                />
            </View>
        );
    }

    // HTML content mode (existing behavior)
    return (
        <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <LinearGradient
                colors={['#FFFFFF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                    <Ionicons name="arrow-back" size={22} color="#000000" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: '#000000' }]} numberOfLines={1}>{title || 'Detail'}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.content, { backgroundColor: '#FFFFFF', elevation: 0, shadowOpacity: 0 }]}>
                    <View style={{ height: webViewHeight }}>
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: generateHtml(konten) }}
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
    container: { flex: 1 },
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
        flex: 1, fontSize: 17, fontWeight: '700',
        textAlign: 'center', marginHorizontal: 8,
    },
    content: {
        backgroundColor: colors.card, borderRadius: 16,
        margin: 16, padding: 20,
        elevation: 3, shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
    },

    // URL mode styles
    urlContainer: {
        flex: 1,
        backgroundColor: '#0D0D15',
    },
    urlBackBtn: {
        position: 'absolute',
        top: 50,
        left: 16,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    urlTitleBar: {
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 60,
        alignItems: 'center',
        backgroundColor: '#0D0D15',
    },
    urlTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    urlLoader: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    urlWebview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
