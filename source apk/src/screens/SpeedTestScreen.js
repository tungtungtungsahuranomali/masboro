import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api, { API_URL } from '../api';
import colors from '../theme';

export default function SpeedTestScreen({ navigation }) {
    const [phase, setPhase] = useState('idle'); // idle, ping, download, upload, done
    const [ping, setPing] = useState(null);
    const [download, setDownload] = useState(null);
    const [upload, setUpload] = useState(null);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [running, setRunning] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    };

    const animateProgress = (toValue, duration = 2000) => {
        return new Promise(resolve => {
            Animated.timing(progressAnim, {
                toValue,
                duration,
                useNativeDriver: false,
            }).start(resolve);
        });
    };

    const testPing = async () => {
        setPhase('ping');
        const pings = [];
        for (let i = 0; i < 5; i++) {
            const start = Date.now();
            try {
                await api.get('/speedtest/ping');
                pings.push(Date.now() - start);
            } catch (e) {
                pings.push(999);
            }
        }
        pings.sort((a, b) => a - b);
        const trimmed = pings.slice(1, -1);
        const avg = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
        setPing(avg);
        await animateProgress(0.33, 800);
        return avg;
    };

    const testDownload = async () => {
        setPhase('download');

        const start = Date.now();
        try {
            await api.get('/speedtest/download?size=1', {
                responseType: 'text',
            });
            const elapsed = (Date.now() - start) / 1000;
            const sizeInBits = 1 * 1024 * 1024 * 8;
            const speedMbps = (sizeInBits / elapsed / 1000000).toFixed(1);
            setDownload(parseFloat(speedMbps));
            setCurrentSpeed(parseFloat(speedMbps));
        } catch (e) {
            console.log('Download test error:', e);
            setDownload(0);
        }
        await animateProgress(0.66, 800);
    };

    const testUpload = async () => {
        setPhase('upload');

        // Build a lightweight string payload (~256KB) - fast in React Native
        const chunk = 'x'.repeat(1024);
        let payload = '';
        for (let i = 0; i < 256; i++) payload += chunk;

        const formData = new FormData();
        formData.append('data', payload);

        const start = Date.now();
        try {
            await api.post('/speedtest/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const elapsed = (Date.now() - start) / 1000;
            const sizeInBits = 256 * 1024 * 8;
            const speedMbps = (sizeInBits / elapsed / 1000000).toFixed(1);
            setUpload(parseFloat(speedMbps));
            setCurrentSpeed(parseFloat(speedMbps));
        } catch (e) {
            console.log('Upload test error:', e);
            setUpload(0);
        }
        await animateProgress(1, 800);
    };

    const runTest = async () => {
        if (running) return;
        setRunning(true);
        setPing(null);
        setDownload(null);
        setUpload(null);
        setCurrentSpeed(0);
        progressAnim.setValue(0);
        startPulse();

        await testPing();
        await testDownload();
        await testUpload();

        setPhase('done');
        stopPulse();
        setRunning(false);
    };

    const getPhaseLabel = () => {
        switch (phase) {
            case 'ping': return 'Mengukur Ping...';
            case 'download': return 'Tes Download...';
            case 'upload': return 'Tes Upload...';
            case 'done': return 'Selesai!';
            default: return 'Tap untuk mulai';
        }
    };

    const getSpeedDisplay = () => {
        if (phase === 'ping') return ping !== null ? `${ping} ms` : '...';
        if (phase === 'download' || (phase === 'done' && download !== null)) return `${download || currentSpeed} Mbps`;
        if (phase === 'upload') return `${upload || currentSpeed} Mbps`;
        if (phase === 'done') return `${download} Mbps`;
        return '0';
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={styles.bg}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Speed Test</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Speed Gauge */}
                <View style={styles.gaugeContainer}>
                    <Animated.View style={[styles.gaugeOuter, { transform: [{ scale: pulseAnim }] }]}>
                        <LinearGradient
                            colors={phase === 'done' ? ['#10b981', '#059669'] : ['#3b82f6', '#2563eb']}
                            style={styles.gaugeGradient}
                        >
                            <View style={styles.gaugeInner}>
                                <Text style={styles.speedValue}>{getSpeedDisplay()}</Text>
                                <Text style={styles.speedUnit}>{phase === 'ping' ? 'PING' : phase === 'idle' ? '' : phase === 'done' ? 'DOWNLOAD' : phase.toUpperCase()}</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </View>

                {/* Phase Label */}
                <Text style={styles.phaseLabel}>{getPhaseLabel()}</Text>

                {/* Progress Bar */}
                <View style={styles.progressWrap}>
                    <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                </View>

                {/* Results */}
                <View style={styles.results}>
                    <View style={styles.resultItem}>
                        <View style={[styles.resultIcon, { backgroundColor: '#eef6ff' }]}>
                            <Ionicons name="pulse" size={22} color="#3b82f6" />
                        </View>
                        <Text style={styles.resultLabel}>Ping</Text>
                        <Text style={styles.resultValue}>{ping !== null ? `${ping} ms` : '-'}</Text>
                    </View>
                    <View style={styles.resultDivider} />
                    <View style={styles.resultItem}>
                        <View style={[styles.resultIcon, { backgroundColor: '#ecfdf5' }]}>
                            <Ionicons name="arrow-down" size={22} color="#10b981" />
                        </View>
                        <Text style={styles.resultLabel}>Download</Text>
                        <Text style={styles.resultValue}>{download !== null ? `${download} Mbps` : '-'}</Text>
                    </View>
                    <View style={styles.resultDivider} />
                    <View style={styles.resultItem}>
                        <View style={[styles.resultIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="arrow-up" size={22} color="#f59e0b" />
                        </View>
                        <Text style={styles.resultLabel}>Upload</Text>
                        <Text style={styles.resultValue}>{upload !== null ? `${upload} Mbps` : '-'}</Text>
                    </View>
                </View>

                {/* Start Button */}
                <TouchableOpacity
                    style={[styles.startBtn, running && styles.startBtnDisabled]}
                    onPress={runTest}
                    disabled={running}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={running ? ['#64748b', '#475569'] : ['#3b82f6', '#2563eb']}
                        style={styles.startBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {running ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="speedometer" size={20} color={colors.white} />
                                <Text style={styles.startBtnText}>{phase === 'done' ? '  Tes Ulang' : '  Mulai Tes'}</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Tes kecepatan mengukur koneksi antara perangkat Anda dan server Mentari. Hasil dapat bervariasi tergantung kondisi jaringan.
                </Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bg: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 56,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18, fontWeight: '700', color: colors.white,
    },

    gaugeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    gaugeOuter: {
        width: 200, height: 200, borderRadius: 100,
        padding: 4,
    },
    gaugeGradient: {
        flex: 1, borderRadius: 100,
        padding: 6,
    },
    gaugeInner: {
        flex: 1, borderRadius: 96,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    speedValue: {
        fontSize: 32, fontWeight: '800', color: colors.white,
    },
    speedUnit: {
        fontSize: 12, fontWeight: '600', color: '#94a3b8',
        marginTop: 4, letterSpacing: 2,
    },

    phaseLabel: {
        textAlign: 'center',
        fontSize: 14, fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 20,
    },

    progressWrap: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginHorizontal: 40,
        marginBottom: 30,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 2,
    },

    results: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        marginHorizontal: 20,
        padding: 20,
        marginBottom: 30,
    },
    resultItem: {
        flex: 1,
        alignItems: 'center',
    },
    resultIcon: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 8,
    },
    resultLabel: {
        fontSize: 11, color: '#94a3b8', fontWeight: '600',
        marginBottom: 4,
    },
    resultValue: {
        fontSize: 14, color: colors.white, fontWeight: '700',
    },
    resultDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 8,
    },

    startBtn: {
        marginHorizontal: 40,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    startBtnDisabled: {
        opacity: 0.7,
    },
    startBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    startBtnText: {
        fontSize: 16, fontWeight: '700', color: colors.white,
    },

    disclaimer: {
        textAlign: 'center',
        fontSize: 11,
        color: '#475569',
        marginTop: 20,
        marginHorizontal: 40,
        lineHeight: 16,
    },
});
