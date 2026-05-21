import { Platform } from 'react-native';
import api from '../api';

// Import notification packages secara safe
let Notifications = null;
let Device = null;

try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
} catch (e) {
    console.log('Push notification packages belum terinstall:', e.message);
}

// Konfigurasi bagaimana notifikasi ditampilkan saat app di foreground
if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

/**
 * Register untuk push notification dan dapatkan native FCM token.
 * @returns {string|null} Native FCM device token
 */
export async function registerForPushNotifications() {
    if (!Notifications || !Device) {
        console.log('Push notification packages belum tersedia');
        return null;
    }

    // Push notification hanya bisa di device fisik
    if (!Device.isDevice) {
        console.log('Push notifications hanya bisa di device fisik');
        return null;
    }

    // Minta permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission ditolak');
        return null;
    }

    // Setup channel khusus Android (harus sebelum getDevicePushTokenAsync)
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#E5A71B',
            sound: 'default',
        });
    }

    // Dapatkan NATIVE FCM token (bukan Expo token)
    try {
        const tokenData = await Notifications.getDevicePushTokenAsync();
        console.log('FCM Token:', tokenData.data);
        return tokenData.data; // Native FCM token string
    } catch (e) {
        console.log('Error getting FCM token:', e);
        return null;
    }
}

/**
 * Kirim FCM token ke backend.
 */
export async function sendTokenToServer(fcmToken) {
    try {
        await api.post('/fcm-token', { fcm_token: fcmToken });
        console.log('FCM token berhasil dikirim ke server');
    } catch (e) {
        console.log('Gagal kirim FCM token:', e?.response?.data || e.message);
    }
}

/**
 * Hapus FCM token dari server (saat logout).
 */
export async function removeTokenFromServer() {
    try {
        await api.delete('/fcm-token');
        console.log('FCM token berhasil dihapus dari server');
    } catch (e) {
        console.log('Gagal hapus FCM token:', e?.response?.data || e.message);
    }
}

/**
 * Setup listener untuk notifikasi.
 * @param {function} onNotificationTapped - callback saat user tap notifikasi
 * @returns {function} cleanup function
 */
export function setupNotificationListeners(onNotificationTapped) {
    if (!Notifications) {
        return () => {};
    }

    // Listener saat notifikasi diterima di foreground
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notifikasi diterima (foreground):', notification);
    });

    // Listener saat user tap notifikasi
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        console.log('Notifikasi di-tap:', data);
        if (onNotificationTapped) {
            onNotificationTapped(data);
        }
    });

    return () => {
        foregroundSub.remove();
        responseSub.remove();
    };
}
