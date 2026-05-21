import React, { useState, useEffect } from 'react';
import { Alert, Platform, Modal, View, Text, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';
import api from '../api';
import colors from '../theme';

// Versi lokal aplikasi — didapat otomatis dari build.gradle (Android)
export const LOCAL_VERSION = Application.nativeApplicationVersion || '1.0.0';

const compareVersions = (v1, v2) => {
    const a = v1.split('.').map(Number);
    const b = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
};

export default function useUpdateChecker() {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const downloadAndInstall = async (url) => {
        if (Platform.OS !== 'android') {
            Alert.alert('Info', 'Auto-update hanya tersedia untuk Android.');
            return;
        }

        try {
            setIsDownloading(true);
            setDownloadProgress(0);

            const fileUri = FileSystemLegacy.documentDirectory + 'mentari-update.apk';

            const downloadResumable = FileSystemLegacy.createDownloadResumable(
                url,
                fileUri,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    setDownloadProgress(progress);
                }
            );

            const { uri } = await downloadResumable.downloadAsync();
            setDownloadProgress(1); // Force to 100% when done

            setIsDownloading(false);
            try {
                // Buka installer APK via Intent
                const contentUri = await FileSystemLegacy.getContentUriAsync(uri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 268435457, // FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK
                    type: 'application/vnd.android.package-archive',
                });
            } catch (intentErr) {
                Alert.alert('Instalasi Gagal', 'Gagal membuka halaman instalasi aplikasi.');
            }

        } catch (e) {
            setIsDownloading(false);
            Alert.alert('Gagal', 'Gagal mengunduh update: ' + e.message);
        }
    };

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                const res = await api.get('/check-update');
                const { version, download_url } = res.data.data;

                if (!version || !download_url) return;

                if (compareVersions(version, LOCAL_VERSION) > 0) {
                    Alert.alert(
                        'Update Tersedia',
                        `Versi baru ${version} tersedia. Update sekarang?`,
                        [
                            { text: 'Nanti', style: 'cancel' },
                            {
                                text: 'Update',
                                onPress: () => downloadAndInstall(download_url),
                            },
                        ]
                    );
                }
            } catch (e) {
                // Gagal cek update — abaikan saja
                console.log('Check update error:', e.message);
            }
        };

        checkUpdate();
    }, []);

    const updateModalElement = (
        <Modal transparent visible={isDownloading} animationType="fade">
            <View style={styles.modalBg}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Mengunduh Update</Text>
                    <Text style={styles.modalSub}>Mohon tunggu, jangan tutup aplikasi...</Text>

                    <View style={styles.progressWrap}>
                        <View style={[styles.progressBar, { width: `${downloadProgress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>

                    {downloadProgress === 1 && (
                        <Text style={styles.installText}>Membuka installer...</Text>
                    )}
                </View>
            </View>
        </Modal>
    );

    return { updateModalElement };
}

const styles = StyleSheet.create({
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 8,
    },
    modalSub: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 20,
        textAlign: 'center',
    },
    progressWrap: {
        width: '100%',
        height: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    progressText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    installText: {
        marginTop: 10,
        fontSize: 13,
        color: colors.success,
        fontWeight: 'bold',
    }
});
