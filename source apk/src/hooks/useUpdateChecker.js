import React, { useState, useEffect } from 'react';
import { Platform, Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import colors from '../theme';

// Versi lokal aplikasi — didapat otomatis dari build.gradle (Android)
export const LOCAL_VERSION = Application.nativeApplicationVersion || '1.2.9';

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
    const [confirmUpdate, setConfirmUpdate] = useState(null); // { version, download_url }
    const [errorInfo, setErrorInfo] = useState(null); // { title, message }

    const downloadAndInstall = async (url) => {
        if (Platform.OS !== 'android') {
            setErrorInfo({ title: 'Info', message: 'Auto-update hanya tersedia untuk Android.' });
            return;
        }

        try {
            setIsDownloading(true);
            setDownloadProgress(0);

            const fileUri = FileSystemLegacy.documentDirectory + 'ligat-update.apk';

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
                setErrorInfo({ title: 'Instalasi Gagal', message: 'Gagal membuka halaman instalasi aplikasi.' });
            }

        } catch (e) {
            setIsDownloading(false);
            setErrorInfo({ title: 'Gagal', message: 'Gagal mengunduh update: ' + e.message });
        }
    };

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                const res = await api.get('/check-update');
                const { version, download_url } = res.data.data;

                if (!version || !download_url) return;

                if (compareVersions(version, LOCAL_VERSION) > 0) {
                    setConfirmUpdate({ version, download_url });
                }
            } catch (e) {
                // Gagal cek update — abaikan saja
                console.log('Check update error:', e.message);
            }
        };

        checkUpdate();
    }, []);

    const updateModalElement = (
        <>
            {/* Download Progress Modal */}
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

            {/* Update Confirmation Modal */}
            <Modal transparent visible={!!confirmUpdate} animationType="fade"
                onRequestClose={() => setConfirmUpdate(null)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalContainer}>
                        <View style={styles.iconWrap}>
                            <Ionicons name="download-outline" size={40} color={colors.primary} />
                        </View>
                        <Text style={styles.modalTitle}>Update Tersedia</Text>
                        <Text style={styles.modalSub}>
                            Versi baru {confirmUpdate?.version} tersedia. Update sekarang?
                        </Text>

                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setConfirmUpdate(null)}>
                                <Text style={styles.btnCancelText}>Nanti</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnConfirm}
                                onPress={() => {
                                    const url = confirmUpdate?.download_url;
                                    setConfirmUpdate(null);
                                    if (url) downloadAndInstall(url);
                                }}>
                                <Ionicons name="cloud-download" size={18} color="#fff" />
                                <Text style={styles.btnConfirmText}>  Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal transparent visible={!!errorInfo} animationType="fade"
                onRequestClose={() => setErrorInfo(null)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalContainer}>
                        <View style={[styles.iconWrap, { backgroundColor: 'rgba(231,76,60,0.15)' }]}>
                            <Ionicons name="alert-circle" size={40} color={colors.danger} />
                        </View>
                        <Text style={styles.modalTitle}>{errorInfo?.title || 'Error'}</Text>
                        <Text style={styles.modalSub}>{errorInfo?.message || ''}</Text>

                        <TouchableOpacity style={styles.btnConfirm} onPress={() => setErrorInfo(null)}>
                            <Text style={styles.btnConfirmText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
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
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(229,167,27,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSub: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    progressWrap: {
        width: '100%',
        height: 12,
        backgroundColor: colors.surface,
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
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btnCancel: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    btnConfirm: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    btnConfirmText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
