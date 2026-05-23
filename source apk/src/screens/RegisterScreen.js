import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
    Image, Modal, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import api, { API_URL } from '../api';
import colors from '../theme';

const AREA_CLUSTERS = ['EKSKLUSIF', 'XLhome', 'MANDIRI', 'FM', 'TANJUNG BALAI KARIMUN', 'MEDAN'];
const TOTAL_STEPS = 6;

export default function RegisterScreen({ navigation }) {
    // Form state
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [kodeRegistrasi, setKodeRegistrasi] = useState('');
    const scrollRef = useRef(null);

    // Step 1: Data Pribadi
    const [email, setEmail] = useState('');
    const [namaSales, setNamaSales] = useState('');
    const [namaPelanggan, setNamaPelanggan] = useState('');
    const [alamatPelanggan, setAlamatPelanggan] = useState('');
    const [whatsapp1, setWhatsapp1] = useState('');

    // Step 2: OTP Verification
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // Step 3: Password & Lokasi
    const [whatsapp2, setWhatsapp2] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [koordinat, setKoordinat] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);
    const [currentRegion, setCurrentRegion] = useState({ lat: -2.5489, lng: 118.0149 }); // Default center point

    // Step 4: Area & Tempat Tinggal
    const [areaCluster, setAreaCluster] = useState('');
    const [jenisTempat, setJenisTempat] = useState('');
    const [namaPemilik, setNamaPemilik] = useState('');
    const [alamatPemilik, setAlamatPemilik] = useState('');
    const [waPemilik, setWaPemilik] = useState('');

    // Step 5: Paket
    const [paketsInternet, setPaketsInternet] = useState([]);
    const [paketsTv, setPaketsTv] = useState([]);
    const [paketsLainnya, setPaketsLainnya] = useState([]);
    const [selectedInternet, setSelectedInternet] = useState(null);
    const [inginTv, setInginTv] = useState(false);
    const [selectedTv, setSelectedTv] = useState(null);
    const [inginLainnya, setInginLainnya] = useState(false);
    const [selectedLainnya, setSelectedLainnya] = useState(null);
    const [tanggalPengajuan, setTanggalPengajuan] = useState(new Date().toISOString().split('T')[0]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Step 6: Persetujuan & Dokumen
    const [agree1, setAgree1] = useState(false);
    const [agree2, setAgree2] = useState(false);
    const [agree3, setAgree3] = useState(false);
    const [agree4, setAgree4] = useState(false);
    const [agree5, setAgree5] = useState(false);
    const [agree6, setAgree6] = useState(false);
    const [agree7, setAgree7] = useState(false);
    const [fotoKtp, setFotoKtp] = useState(null);
    const [fotoRumah, setFotoRumah] = useState(null);
    const [fotoSelfie, setFotoSelfie] = useState(null);

    const CACHE_KEY = 'REGISTRATION_DATA';

    useEffect(() => {
        loadPackages();
        loadCachedData();
    }, []);

    // Save to cache whenever relevant states change
    useEffect(() => {
        const dataToSave = {
            step, email, namaSales, namaPelanggan, alamatPelanggan, whatsapp1,
            otpVerified, whatsapp2, password, koordinat, areaCluster, jenisTempat,
            namaPemilik, alamatPemilik, waPemilik, selectedInternet, inginTv,
            selectedTv, inginLainnya, selectedLainnya, tanggalPengajuan,
            agree1, agree2, agree3, agree4, agree5, agree6, agree7,
            fotoKtp, fotoRumah, fotoSelfie
        };
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(dataToSave)).catch(e => console.log('Error caching data:', e));
    }, [
        step, email, namaSales, namaPelanggan, alamatPelanggan, whatsapp1,
        otpVerified, whatsapp2, password, koordinat, areaCluster, jenisTempat,
        namaPemilik, alamatPemilik, waPemilik, selectedInternet, inginTv,
        selectedTv, inginLainnya, selectedLainnya, tanggalPengajuan,
        agree1, agree2, agree3, agree4, agree5, agree6, agree7,
        fotoKtp, fotoRumah, fotoSelfie
    ]);

    const loadCachedData = async () => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (data.step) setStep(data.step);
                if (data.email) setEmail(data.email);
                if (data.namaSales) setNamaSales(data.namaSales);
                if (data.namaPelanggan) setNamaPelanggan(data.namaPelanggan);
                if (data.alamatPelanggan) setAlamatPelanggan(data.alamatPelanggan);
                if (data.whatsapp1) setWhatsapp1(data.whatsapp1);
                if (data.otpVerified) setOtpVerified(data.otpVerified);
                if (data.whatsapp2) setWhatsapp2(data.whatsapp2);
                if (data.password) setPassword(data.password);
                if (data.koordinat) setKoordinat(data.koordinat);
                if (data.areaCluster) setAreaCluster(data.areaCluster);
                if (data.jenisTempat) setJenisTempat(data.jenisTempat);
                if (data.namaPemilik) setNamaPemilik(data.namaPemilik);
                if (data.alamatPemilik) setAlamatPemilik(data.alamatPemilik);
                if (data.waPemilik) setWaPemilik(data.waPemilik);
                if (data.selectedInternet) setSelectedInternet(data.selectedInternet);
                if (data.inginTv) setInginTv(data.inginTv);
                if (data.selectedTv) setSelectedTv(data.selectedTv);
                if (data.inginLainnya) setInginLainnya(data.inginLainnya);
                if (data.selectedLainnya) setSelectedLainnya(data.selectedLainnya);
                if (data.tanggalPengajuan) setTanggalPengajuan(data.tanggalPengajuan);
                if (data.agree1) setAgree1(data.agree1);
                if (data.agree2) setAgree2(data.agree2);
                if (data.agree3) setAgree3(data.agree3);
                if (data.agree4) setAgree4(data.agree4);
                if (data.agree5) setAgree5(data.agree5);
                if (data.agree6) setAgree6(data.agree6);
                if (data.agree7) setAgree7(data.agree7);
                if (data.fotoKtp) setFotoKtp(data.fotoKtp);
                if (data.fotoRumah) setFotoRumah(data.fotoRumah);
                if (data.fotoSelfie) setFotoSelfie(data.fotoSelfie);
            }
        } catch (e) {
            console.log('Error loading cached data:', e);
        }
    };

    const clearCache = async () => {
        try {
            await AsyncStorage.removeItem(CACHE_KEY);
        } catch (e) {
            console.log('Error clearing cache:', e);
        }
    };

    const loadPackages = async () => {
        try {
            const [resI, resT, resL] = await Promise.all([
                api.get('/registrasi/packages?tipe=Internet'),
                api.get('/registrasi/packages?tipe=TV'),
                api.get('/registrasi/packages?tipe=Lainnya'),
            ]);
            setPaketsInternet(resI.data.data || []);
            setPaketsTv(resT.data.data || []);
            setPaketsLainnya(resL.data.data || []);
        } catch (e) {
            // Ignore
        }
    };

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    // Step 1 validation
    const validateStep1 = () => {
        if (!namaPelanggan.trim()) return Alert.alert('Peringatan', 'Nama Pelanggan harus diisi.');
        if (!alamatPelanggan.trim()) return Alert.alert('Peringatan', 'Alamat Pelanggan harus diisi.');
        if (!whatsapp1.trim()) return Alert.alert('Peringatan', 'No WhatsApp 1 harus diisi.');
        nextStep();
    };

    // Step 2: Check WA & send OTP
    const handleCheckAndSendOtp = async () => {
        setOtpLoading(true);
        try {
            const checkRes = await api.post('/registrasi/check-whatsapp', { whatsapp: whatsapp1 });
            if (!checkRes.data.available) {
                Alert.alert('Nomor Terdaftar', 'Nomor WhatsApp ini sudah terdaftar. Gunakan nomor lain.');
                setOtpLoading(false);
                return;
            }
            await api.post('/registrasi/send-otp', { whatsapp: whatsapp1 });
            setOtpSent(true);
            Alert.alert('OTP Terkirim', 'Kode OTP telah dikirim ke WhatsApp Anda.');
        } catch (e) {
            Alert.alert('Gagal', e.response?.data?.message || 'Gagal mengirim OTP.');
        }
        setOtpLoading(false);
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) return Alert.alert('Peringatan', 'Masukkan kode OTP 6 digit.');
        setOtpLoading(true);
        try {
            await api.post('/registrasi/verify-otp', { whatsapp: whatsapp1, otp });
            setOtpVerified(true);
            Alert.alert('Berhasil', 'Verifikasi WhatsApp berhasil!');
        } catch (e) {
            Alert.alert('Gagal', e.response?.data?.message || 'Kode OTP salah.');
        }
        setOtpLoading(false);
    };

    // Step 3 validation
    const validateStep3 = () => {
        if (!password || password.length < 6) return Alert.alert('Peringatan', 'Password minimal 6 karakter.');
        nextStep();
    };

    // Step 4 validation
    const validateStep4 = () => {
        if (!areaCluster) return Alert.alert('Peringatan', 'Pilih area cluster.');
        if (!jenisTempat) return Alert.alert('Peringatan', 'Pilih jenis tempat tinggal.');
        if (jenisTempat === 'Sewa' && !namaPemilik.trim()) return Alert.alert('Peringatan', 'Nama pemilik kontrakan harus diisi.');
        nextStep();
    };

    // Step 5 validation
    const validateStep5 = () => {
        if (!selectedInternet) return Alert.alert('Peringatan', 'Pilih paket internet.');
        if (!tanggalPengajuan) return Alert.alert('Peringatan', 'Tanggal pengajuan harus diisi.');
        nextStep();
    };

    // Pick image
    const pickImage = async (setter) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled && result.assets?.length > 0) {
            setter(result.assets[0]);
        }
    };

    const takePhoto = async (setter) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Kamera', 'Izin kamera diperlukan.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled && result.assets?.length > 0) {
            setter(result.assets[0]);
        }
    };

    // Submit
    const handleSubmit = async () => {
        if (!agree1 || !agree2 || !agree3 || !agree4 || !agree5 || !agree6 || !agree7) {
            return Alert.alert('Peringatan', 'Anda harus menyetujui semua persyaratan.');
        }
        setLoading(true);
        try {
            const formData = new FormData();
            if (email) formData.append('email', email);
            if (namaSales) formData.append('nama_sales', namaSales);
            formData.append('nama_pelanggan', namaPelanggan);
            formData.append('alamat_pelanggan', alamatPelanggan);
            formData.append('whatsapp_1', whatsapp1);
            if (whatsapp2) formData.append('whatsapp_2', whatsapp2);
            formData.append('password', password);
            if (koordinat) formData.append('koordinat_lokasi', koordinat);
            formData.append('area_cluster', areaCluster);
            formData.append('jenis_tempat_tinggal', jenisTempat);
            if (jenisTempat === 'Sewa') {
                if (namaPemilik) formData.append('nama_pemilik_kontrakan', namaPemilik);
                if (alamatPemilik) formData.append('alamat_pemilik_kontrakan', alamatPemilik);
                if (waPemilik) formData.append('wa_pemilik_kontrakan', waPemilik);
            }
            formData.append('paket_internet_id', selectedInternet);
            if (selectedTv) formData.append('paket_tv_id', selectedTv);
            if (selectedLainnya) formData.append('paket_lainnya_id', selectedLainnya);
            formData.append('tanggal_pengajuan', tanggalPengajuan);

            if (fotoKtp) formData.append('foto_ktp', {
                uri: fotoKtp.uri,
                type: 'image/jpeg',
                name: 'ktp.jpg',
            });
            if (fotoRumah) formData.append('foto_rumah', {
                uri: fotoRumah.uri,
                type: 'image/jpeg',
                name: 'rumah.jpg',
            });
            if (fotoSelfie) formData.append('foto_selfie', {
                uri: fotoSelfie.uri,
                type: 'image/jpeg',
                name: 'selfie.jpg',
            });

            const res = await api.post('/registrasi', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            });

            await clearCache();
            setKodeRegistrasi(res.data.data?.kode_registrasi || '');
            setShowSuccess(true);
        } catch (e) {
            const msg = e.response?.data?.message || 'Server sedang sibuk atau koneksi tidak stabil.';
            Alert.alert(
                'Pendaftaran Gagal',
                `${msg}\n\nData Anda masih tersimpan dengan aman di halaman ini. \n\nSilakan klik tombol "Kirim Pendaftaran" sekali lagi.`
            );
        }
        setLoading(false);
    };

    const nextStep = () => {
        setStep(s => Math.min(s + 1, TOTAL_STEPS));
        scrollToTop();
    };

    const prevStep = () => {
        setStep(s => Math.max(s - 1, 1));
        scrollToTop();
    };

    const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    // ─── Render ───
    const renderProgressBar = () => (
        <View style={s.progressContainer}>
            {[1, 2, 3, 4, 5, 6].map(i => (
                <View key={i} style={[s.progressDot, i <= step && s.progressDotActive]}>
                    {i < step ? (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                        <Text style={[s.progressDotText, i <= step && s.progressDotTextActive]}>{i}</Text>
                    )}
                </View>
            ))}
            <View style={s.progressLine}>
                <View style={[s.progressLineFill, { width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }]} />
            </View>
        </View>
    );

    const renderInput = (label, value, setter, opts = {}) => (
        <View style={s.fieldWrap}>
            <Text style={s.label}>{label}{opts.required !== false && <Text style={s.required}> *</Text>}</Text>
            <View style={s.inputWrap}>
                {opts.icon && <Ionicons name={opts.icon} size={18} color={colors.textSecondary} style={s.inputIcon} />}
                <TextInput
                    style={s.input}
                    value={value}
                    onChangeText={setter}
                    placeholder={opts.placeholder || ''}
                    placeholderTextColor="#999"
                    keyboardType={opts.keyboard || 'default'}
                    secureTextEntry={opts.secure}
                    multiline={opts.multiline}
                    numberOfLines={opts.lines}
                    editable={opts.editable !== false}
                />
                {opts.rightIcon}
            </View>
            {opts.hint && <Text style={s.hint}>{opts.hint}</Text>}
        </View>
    );

    const renderSelect = (label, options, selected, setter, displayFn) => (
        <View style={s.fieldWrap}>
            <Text style={s.label}>{label}<Text style={s.required}> *</Text></Text>
            <View style={s.selectGrid}>
                {options.map(opt => {
                    const val = typeof opt === 'string' ? opt : opt.id;
                    const display = displayFn ? displayFn(opt) : opt;
                    const isSelected = selected === val;
                    return (
                        <TouchableOpacity
                            key={val}
                            style={[s.selectChip, isSelected && s.selectChipActive]}
                            onPress={() => setter(val)}
                        >
                            <Text style={[s.selectChipText, isSelected && s.selectChipTextActive]}>{display}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderCheckbox = (label, value, setter) => (
        <TouchableOpacity style={s.checkRow} onPress={() => setter(!value)}>
            <View style={[s.checkbox, value && s.checkboxActive]}>
                {value && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={s.checkLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const renderPhotoUpload = (label, photo, setter) => (
        <View style={s.fieldWrap}>
            <Text style={s.label}>{label}<Text style={s.required}> *</Text></Text>
            {photo ? (
                <View style={s.photoPreview}>
                    <Image source={{ uri: photo.uri }} style={s.photoImage} />
                    <TouchableOpacity style={s.photoRemove} onPress={() => setter(null)}>
                        <Ionicons name="close-circle" size={24} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={s.photoActions}>
                    <TouchableOpacity style={s.photoBtn} onPress={() => pickImage(setter)}>
                        <Ionicons name="images-outline" size={20} color={colors.primary} />
                        <Text style={s.photoBtnText}>Galeri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.photoBtn} onPress={() => takePhoto(setter)}>
                        <Ionicons name="camera-outline" size={20} color={colors.primary} />
                        <Text style={s.photoBtnText}>Kamera</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderStep1 = () => (
        <View>
            <Text style={s.stepTitle}>Data Pribadi</Text>
            <Text style={s.stepDesc}>Lengkapi data diri Anda untuk pendaftaran layanan internet.</Text>
            {renderInput('E-mail', email, setEmail, { icon: 'mail-outline', placeholder: 'email@contoh.com', required: false, keyboard: 'email-address' })}
            {renderInput('Nama Sales', namaSales, setNamaSales, { icon: 'person-outline', placeholder: 'Nama sales (jika ada)', required: false })}
            {renderInput('Nama Pelanggan', namaPelanggan, setNamaPelanggan, { icon: 'person-outline', placeholder: 'Nama lengkap' })}
            {renderInput('Alamat Pelanggan', alamatPelanggan, setAlamatPelanggan, { icon: 'location-outline', placeholder: 'Alamat lengkap', multiline: true, lines: 3 })}
            {renderInput('No WhatsApp 1', whatsapp1, setWhatsapp1, { icon: 'logo-whatsapp', placeholder: '08xxxxxxxxxx', keyboard: 'phone-pad', hint: 'Nomor ini akan digunakan untuk login dan tidak bisa duplikat' })}
            <TouchableOpacity style={s.nextBtn} onPress={validateStep1}>
                <Text style={s.nextBtnText}>Lanjutkan</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View>
            <Text style={s.stepTitle}>Verifikasi WhatsApp</Text>
            <Text style={s.stepDesc}>Kami perlu memverifikasi bahwa nomor WhatsApp Anda aktif.</Text>

            <View style={s.otpCard}>
                <Ionicons name="logo-whatsapp" size={48} color="#25D366" style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={s.otpPhone}>{whatsapp1}</Text>

                {!otpVerified ? (
                    <>
                        {!otpSent ? (
                            <TouchableOpacity style={s.otpBtn} onPress={handleCheckAndSendOtp} disabled={otpLoading}>
                                {otpLoading ? <ActivityIndicator color="#fff" /> : (
                                    <Text style={s.otpBtnText}>Kirim Kode OTP</Text>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <>
                                <Text style={s.otpInfo}>Masukkan kode 6 digit yang dikirim ke WhatsApp Anda</Text>
                                <TextInput
                                    style={s.otpInput}
                                    value={otp}
                                    onChangeText={setOtp}
                                    placeholder="000000"
                                    placeholderTextColor="#ccc"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    textAlign="center"
                                />
                                <TouchableOpacity style={s.otpBtn} onPress={handleVerifyOtp} disabled={otpLoading}>
                                    {otpLoading ? <ActivityIndicator color="#fff" /> : (
                                        <Text style={s.otpBtnText}>Verifikasi OTP</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCheckAndSendOtp} style={{ marginTop: 12 }}>
                                    <Text style={s.resendText}>Kirim ulang OTP</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                ) : (
                    <View style={s.otpSuccess}>
                        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                        <Text style={s.otpSuccessText}>WhatsApp Terverifikasi!</Text>
                    </View>
                )}
            </View>

            <View style={s.navRow}>
                <TouchableOpacity style={s.prevBtn} onPress={prevStep}>
                    <Ionicons name="arrow-back" size={18} color={colors.primary} />
                    <Text style={s.prevBtnText}>Kembali</Text>
                </TouchableOpacity>
                {otpVerified && (
                    <TouchableOpacity style={s.nextBtn} onPress={nextStep}>
                        <Text style={s.nextBtnText}>Lanjutkan</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View>
            <Text style={s.stepTitle}>Keamanan & Lokasi</Text>
            <Text style={s.stepDesc}>Buat password dan tambahkan lokasi rumah Anda.</Text>
            {renderInput('No WhatsApp 2 (opsional)', whatsapp2, setWhatsapp2, { icon: 'call-outline', placeholder: '08xxxxxxxxxx', required: false, keyboard: 'phone-pad' })}
            {renderInput('Password', password, (v) => setPassword(v), {
                icon: 'lock-closed-outline',
                placeholder: 'Minimal 6 karakter',
                secure: !showPassword,
                rightIcon: (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                ),
            })}
            {renderInput('Koordinat Lokasi Rumah', koordinat, setKoordinat, {
                icon: 'navigate-outline',
                placeholder: '-6.200000, 106.816666',
                required: false,
                hint: 'Format: latitude, longitude',
            })}
            <TouchableOpacity
                style={s.mapBtn}
                onPress={openMapModal}
            >
                <Ionicons name="map-outline" size={18} color={colors.primary} />
                <Text style={s.mapBtnText}>Pilih Koordinat dari Peta</Text>
            </TouchableOpacity>

            <View style={s.navRow}>
                <TouchableOpacity style={s.prevBtn} onPress={prevStep}>
                    <Ionicons name="arrow-back" size={18} color={colors.primary} />
                    <Text style={s.prevBtnText}>Kembali</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.nextBtn} onPress={validateStep3}>
                    <Text style={s.nextBtnText}>Lanjutkan</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View>
            <Text style={s.stepTitle}>Area & Tempat Tinggal</Text>
            <Text style={s.stepDesc}>Pilih area layanan dan informasi tempat tinggal.</Text>
            {renderSelect('Area Cluster Pelanggan', AREA_CLUSTERS, areaCluster, setAreaCluster)}
            {renderSelect('Jenis Tempat Tinggal', ['Milik Sendiri', 'Sewa'], jenisTempat, setJenisTempat)}

            {jenisTempat === 'Sewa' && (
                <View style={s.sewaBox}>
                    <Text style={s.sewaTitle}>Informasi Pemilik Kontrakan</Text>
                    {renderInput('Nama & Alamat Pemilik', namaPemilik, setNamaPemilik, { icon: 'person-outline', placeholder: 'Nama pemilik kontrakan' })}
                    {renderInput('Alamat Pemilik Kontrakan', alamatPemilik, setAlamatPemilik, { icon: 'location-outline', placeholder: 'Alamat pemilik', required: false, multiline: true })}
                    {renderInput('No WhatsApp/HP Pemilik', waPemilik, setWaPemilik, { icon: 'call-outline', placeholder: '08xxxxxxxxxx', required: false, keyboard: 'phone-pad' })}
                </View>
            )}

            <View style={s.navRow}>
                <TouchableOpacity style={s.prevBtn} onPress={prevStep}>
                    <Ionicons name="arrow-back" size={18} color={colors.primary} />
                    <Text style={s.prevBtnText}>Kembali</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.nextBtn} onPress={validateStep4}>
                    <Text style={s.nextBtnText}>Lanjutkan</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep5 = () => (
        <View>
            <Text style={s.stepTitle}>Pilih Paket Layanan</Text>
            <Text style={s.stepDesc}>Pilih paket internet dan layanan tambahan yang Anda inginkan.</Text>

            <View style={s.fieldWrap}>
                <Text style={s.label}>Paket Internet Utama<Text style={s.required}> *</Text></Text>
                {paketsInternet.map(p => (
                    <TouchableOpacity
                        key={p.id}
                        style={[s.paketCard, selectedInternet === p.id && s.paketCardActive]}
                        onPress={() => setSelectedInternet(p.id)}
                    >
                        <View style={s.paketRadio}>
                            <View style={[s.radio, selectedInternet === p.id && s.radioActive]}>
                                {selectedInternet === p.id && <View style={s.radioDot} />}
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.paketName}>{p.nama_paket}</Text>
                            <Text style={s.paketPrice}>{formatRp(p.harga)}/bulan</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={s.fieldWrap}>
                <Text style={s.label}>Paket Channel TV</Text>
                <View style={s.yesNoRow}>
                    <TouchableOpacity style={[s.yesNoBtn, inginTv && s.yesNoBtnActive]} onPress={() => setInginTv(true)}>
                        <Text style={[s.yesNoText, inginTv && s.yesNoTextActive]}>Ya</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.yesNoBtn, !inginTv && s.yesNoBtnActive]} onPress={() => { setInginTv(false); setSelectedTv(null); }}>
                        <Text style={[s.yesNoText, !inginTv && s.yesNoTextActive]}>Tidak</Text>
                    </TouchableOpacity>
                </View>
                {inginTv && paketsTv.map(p => (
                    <TouchableOpacity
                        key={p.id}
                        style={[s.paketCard, selectedTv === p.id && s.paketCardActive]}
                        onPress={() => setSelectedTv(p.id)}
                    >
                        <View style={s.paketRadio}>
                            <View style={[s.radio, selectedTv === p.id && s.radioActive]}>
                                {selectedTv === p.id && <View style={s.radioDot} />}
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.paketName}>{p.nama_paket}</Text>
                            <Text style={s.paketPrice}>{formatRp(p.harga)}/bulan</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={s.fieldWrap}>
                <Text style={s.label}>Paket Lainnya</Text>
                <View style={s.yesNoRow}>
                    <TouchableOpacity style={[s.yesNoBtn, inginLainnya && s.yesNoBtnActive]} onPress={() => setInginLainnya(true)}>
                        <Text style={[s.yesNoText, inginLainnya && s.yesNoTextActive]}>Ya</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.yesNoBtn, !inginLainnya && s.yesNoBtnActive]} onPress={() => { setInginLainnya(false); setSelectedLainnya(null); }}>
                        <Text style={[s.yesNoText, !inginLainnya && s.yesNoTextActive]}>Tidak</Text>
                    </TouchableOpacity>
                </View>
                {inginLainnya && paketsLainnya.map(p => (
                    <TouchableOpacity
                        key={p.id}
                        style={[s.paketCard, selectedLainnya === p.id && s.paketCardActive]}
                        onPress={() => setSelectedLainnya(p.id)}
                    >
                        <View style={s.paketRadio}>
                            <View style={[s.radio, selectedLainnya === p.id && s.radioActive]}>
                                {selectedLainnya === p.id && <View style={s.radioDot} />}
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.paketName}>{p.nama_paket}</Text>
                            <Text style={s.paketPrice}>{formatRp(p.harga)}/bulan</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {Platform.OS === 'web' ? (
                <View style={{ marginBottom: 14 }}>
                    <Text style={styles.stepLabel}>Tanggal Pengajuan Pasang</Text>
                    <input
                        type="date"
                        value={tanggalPengajuan}
                        onChange={(e) => setTanggalPengajuan(e.target.value)}
                        style={{
                            width: '100%', padding: 14, fontSize: 14,
                            backgroundColor: colors.inputBg, color: colors.text,
                            border: `1px solid ${colors.border}`, borderRadius: 12,
                            outline: 'none', fontFamily: 'inherit',
                        }}
                    />
                </View>
            ) : (
                <>
                    <Text style={styles.stepLabel}>Tanggal Pengajuan Pasang</Text>
                    <TouchableOpacity
                        style={[styles.inputRow, { marginBottom: 14 }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                        <Text style={{ color: colors.text, fontSize: 14, flex: 1 }}>
                            {tanggalPengajuan || 'Pilih tanggal'}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                    setTanggalPengajuan(
                                        selectedDate.getFullYear() + '-' +
                                        String(selectedDate.getMonth()+1).padStart(2,'0') + '-' +
                                        String(selectedDate.getDate()).padStart(2,'0')
                                    );
                                }
                            }}
                        />
                    )}
                </>
            )}

            <View style={s.navRow}>
                <TouchableOpacity style={s.prevBtn} onPress={prevStep}>
                    <Ionicons name="arrow-back" size={18} color={colors.primary} />
                    <Text style={s.prevBtnText}>Kembali</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.nextBtn} onPress={validateStep5}>
                    <Text style={s.nextBtnText}>Lanjutkan</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep6 = () => (
        <View>
            <Text style={s.stepTitle}>Persetujuan & Dokumen</Text>
            <Text style={s.stepDesc}>Baca dan setujui persyaratan, lalu upload dokumen yang diperlukan.</Text>

            <View style={s.agreementBox}>
                {renderCheckbox('Saya mengetahui harga paket yang dipilih', agree1, setAgree1)}
                {renderCheckbox('Saya bersedia tidak downgrade layanan sebelum 6 bulan', agree2, setAgree2)}
                {renderCheckbox('Saya mengetahui aplikasi ini adalah satu-satunya pusat komunikasi', agree3, setAgree3)}
                {renderCheckbox('Saya mengetahui periode pembayaran tgl 1-5 setiap bulan dan ditransfer melalui Virtual Account yang terdapat pada informasi pada aplikasi ini', agree4, setAgree4)}
                {renderCheckbox('Pelanggan cuti diajukan 2 minggu sebelumnya, dan membayar deposit 1 bulan berlangganan', agree5, setAgree5)}
                {renderCheckbox('Pelanggan dikenakan pinalti sisa kontrak berlangganan jika putus sebelum 1 tahun', agree6, setAgree6)}
            </View>

            <View style={s.separatorLine} />

            {renderPhotoUpload('Foto KTP', fotoKtp, setFotoKtp)}
            {renderPhotoUpload('Foto Rumah Tampak Luas Depan', fotoRumah, setFotoRumah)}
            {renderPhotoUpload('Foto Selfie', fotoSelfie, setFotoSelfie)}

            <View style={s.separatorLine} />

            {renderCheckbox('Dengan ini saya menyatakan bahwa seluruh data telah diisi dengan benar, lengkap dan dapat dipertanggungjawabkan. Formulir ini disetujui untuk diproses lebih lanjut.', agree7, setAgree7)}

            <View style={s.navRow}>
                <TouchableOpacity style={s.prevBtn} onPress={prevStep}>
                    <Ionicons name="arrow-back" size={18} color={colors.primary} />
                    <Text style={s.prevBtnText}>Kembali</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.submitBtn, loading && { opacity: 0.8, backgroundColor: colors.textSecondary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                            <Text style={s.submitBtnText}>Mengirim Data...</Text>
                        </View>
                    ) : (
                        <>
                            <Ionicons name="paper-plane" size={18} color="#fff" />
                            <Text style={s.submitBtnText}>Kirim Pendaftaran</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSuccessModal = () => (
        <Modal visible={showSuccess} transparent animationType="fade">
            <View style={s.modalOverlay}>
                <View style={s.modalCard}>
                    <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        style={s.modalHeader}
                    >
                        <Ionicons name="checkmark-circle" size={64} color="#fff" />
                    </LinearGradient>
                    <View style={s.modalBody}>
                        <Text style={s.modalTitle}>Selamat! 🎉</Text>
                        <Text style={s.modalTitle2}>Pendaftaran Anda Berhasil!</Text>
                        <Text style={s.modalDesc}>
                            Terima kasih telah mendaftar sebagai pelanggan kami.{'\n\n'}
                            Data pendaftaran Anda sedang dalam proses verifikasi oleh tim kami.
                            Sambil menunggu, Anda sudah dapat login ke aplikasi untuk menjelajahi berbagai fitur menarik yang tersedia.{'\n\n'}
                            Kami akan menghubungi Anda melalui WhatsApp untuk informasi selanjutnya. Terima kasih atas kepercayaan Anda! 🙏
                        </Text>
                        {kodeRegistrasi ? (
                            <View style={s.kodeBox}>
                                <Text style={s.kodeLabel}>Kode Registrasi Anda</Text>
                                <Text style={s.kodeValue}>{kodeRegistrasi}</Text>
                            </View>
                        ) : null}
                        <TouchableOpacity
                            style={s.modalBtn}
                            onPress={() => {
                                setShowSuccess(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={s.modalBtnText}>Kembali ke Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // ─── Map Picker Modal ───
    const openMapModal = async () => {
        setShowMapModal(true); // show first for better UX
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (loc && loc.coords) {
                    setCurrentRegion({
                        lat: loc.coords.latitude,
                        lng: loc.coords.longitude
                    });
                }
            }
        } catch (error) {
            console.log("Error getting location", error);
        }
    };

    const renderMapModal = () => {
        // Simple HTML with Google Maps JS API (no key needed for basic marker dropping on Iframe-like view)
        // or Leaflet/OSM injected as HTML doc for guaranteed free usage
        const HTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { padding: 0; margin: 0; }
                html, body, #map { height: 100vh; width: 100vw; }
                .submit-btn {
                    position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
                    background: #4A90E2; color: white; padding: 12px 24px; border-radius: 8px;
                    border: none; font-size: 16px; font-weight: bold; font-family: sans-serif;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 1000;
                }
                .leaflet-bottom.leaflet-right {
                    margin-bottom: 80px !important;
                }
                .search-container {
                    position: absolute; top: 10px; left: 10px; right: 10px;
                    z-index: 1001; display: flex; flex-direction: column; gap: 5px;
                }
                .search-input-group {
                    display: flex; gap: 5px;
                }
                .search-input {
                    flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #ccc;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-size: 14px;
                }
                .search-btn {
                    background: #4A90E2; color: white; border: none; padding: 0 15px;
                    border-radius: 8px; font-weight: bold; cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .search-results {
                    background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                    max-height: 200px; overflow-y: auto; display: none;
                }
                .search-result-item {
                    padding: 10px 15px; border-bottom: 1px solid #eee; font-family: sans-serif;
                    font-size: 13px; color: #333; cursor: pointer;
                }
                .search-result-item:last-child { border-bottom: none; }
                .search-result-item:hover { background: #f5f5f5; }
                .loading-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(255,255,255,0.7); display: none;
                    justify-content: center; alignItems: center; z-index: 2000;
                    font-family: sans-serif; font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="search-container">
                <div class="search-input-group">
                    <input type="text" id="searchInput" class="search-input" placeholder="Cari lokasi (contoh: Jakarta)..." autocomplete="off" />
                    <button id="searchBtn" class="search-btn">Cari</button>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>
            <div id="map"></div>
            <div id="loading" class="loading-overlay">Mencari...</div>
            <button id="submitBtn" class="submit-btn" style="display:none">Pilih Lokasi Ini</button>

            <script>
                var initialLat = ${currentRegion.lat};
                var initialLng = ${currentRegion.lng};
                var initialZoom = initialLat !== -2.5489 ? 16 : 5;

                var map = L.map('map', {
                    zoomControl: false
                }).setView([initialLat, initialLng], initialZoom);

                L.control.zoom({
                    position: 'bottomright'
                }).addTo(map);

                L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    subdomains:['mt0','mt1','mt2','mt3']
                }).addTo(map);

                var marker;
                var currentLat = initialLat;
                var currentLng = initialLng;
                var btn = document.getElementById('submitBtn');
                var searchInput = document.getElementById('searchInput');
                var searchBtn = document.getElementById('searchBtn');
                var searchResults = document.getElementById('searchResults');
                var loading = document.getElementById('loading');
                var searchTimeout;

                function updateMarker(lat, lng) {
                    currentLat = parseFloat(lat).toFixed(6);
                    currentLng = parseFloat(lng).toFixed(6);
                    var latlng = [lat, lng];
                    
                    if (marker) {
                        marker.setLatLng(latlng);
                    } else {
                        marker = L.marker(latlng, {draggable: true}).addTo(map);
                        marker.on('dragend', function(event) {
                            var position = marker.getLatLng();
                            currentLat = position.lat.toFixed(6);
                            currentLng = position.lng.toFixed(6);
                            updateButtonText();
                        });
                    }
                    map.setView(latlng, 16);
                    btn.style.display = 'block';
                    updateButtonText();
                    searchResults.style.display = 'none';
                }

                function updateButtonText() {
                    btn.innerHTML = 'Pilih Koordinat <br><span style="font-size:12px">(' + currentLat + ', ' + currentLng + ')</span>';
                }

                // Initial marker at current position
                if (initialLat !== -2.5489) {
                    updateMarker(initialLat, initialLng);
                }

                map.on('click', function(e) {
                    updateMarker(e.latlng.lat, e.latlng.lng);
                    searchResults.style.display = 'none';
                });

                async function fetchSuggestions(query) {
                    if (query.length < 3) {
                        searchResults.style.display = 'none';
                        return;
                    }

                    try {
                        const response = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&countrycodes=id&limit=5');
                        const data = await response.json();
                        
                        searchResults.innerHTML = '';
                        if (data && data.length > 0) {
                            data.forEach(item => {
                                var div = document.createElement('div');
                                div.className = 'search-result-item';
                                div.innerText = item.display_name;
                                div.onclick = function() {
                                    updateMarker(item.lat, item.lon);
                                    searchInput.value = item.display_name;
                                };
                                searchResults.appendChild(div);
                            });
                            searchResults.style.display = 'block';
                        } else {
                            searchResults.style.display = 'none';
                        }
                    } catch (error) {
                        console.error('Error fetching suggestions', error);
                    }
                }

                searchInput.oninput = function() {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        fetchSuggestions(searchInput.value);
                    }, 500);
                };

                async function searchLocation() {
                    var query = searchInput.value;
                    if (!query) return;
                    
                    loading.style.display = 'flex';
                    searchResults.style.display = 'none';
                    try {
                        const response = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&countrycodes=id&limit=1');
                        const data = await response.json();
                        if (data && data.length > 0) {
                            var lat = data[0].lat;
                            var lon = data[0].lon;
                            updateMarker(lat, lon);
                        } else {
                            alert('Lokasi tidak ditemukan');
                        }
                    } catch (error) {
                        alert('Gagal mencari lokasi');
                    }
                    loading.style.display = 'none';
                }

                searchBtn.onclick = searchLocation;
                searchInput.onkeypress = function(e) {
                    if (e.key === 'Enter') {
                        searchLocation();
                        searchInput.blur();
                    }
                };

                btn.onclick = function() {
                    window.ReactNativeWebView.postMessage(currentLat + ', ' + currentLng);
                };

                // Auto-locate user if possible
                map.locate({setView: true, maxZoom: 16});
                map.on('locationfound', function(e) {
                    updateMarker(e.latlng.lat, e.latlng.lng);
                });
            </script>
        </body>
        </html>
        `;

        return (
            <Modal visible={showMapModal} animationType="slide">
                <View style={{ flex: 1 }}>
                    <View style={s.mapHeader}>
                        <TouchableOpacity onPress={() => setShowMapModal(false)} style={s.mapCloseBtn}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={s.mapTitle}>Pilih Titik Lokasi Google Maps</Text>
                    </View>
                    <WebView
                        source={{ html: HTML }}
                        originWhitelist={['*']}
                        onMessage={(event) => {
                            setKoordinat(event.nativeEvent.data);
                            setShowMapModal(false);
                            Alert.alert('Sukses', 'Koordinat telah diset ke form.');
                        }}
                        style={{ flex: 1 }}
                    />
                </View>
            </Modal>
        );
    };

    // ─── Main Render ───
    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.gradient}
        >
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Pendaftaran Baru</Text>
                    <Text style={s.headerStep}>Langkah {step} dari {TOTAL_STEPS}</Text>
                </View>

                <ScrollView
                    ref={scrollRef}
                    style={s.scrollView}
                    contentContainerStyle={s.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderProgressBar()}

                    <View style={s.formCard}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                        {step === 5 && renderStep5()}
                        {step === 6 && renderStep6()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderSuccessModal()}
            {renderMapModal()}
        </LinearGradient>
    );
}

const s = StyleSheet.create({
    gradient: { flex: 1 },
    header: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    backBtn: { marginBottom: 8 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    headerStep: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
        position: 'relative',
    },
    progressLine: {
        position: 'absolute',
        left: 22,
        right: 22,
        top: 14,
        height: 3,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        zIndex: -1,
    },
    progressLineFill: {
        height: 3,
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    progressDotActive: { backgroundColor: colors.primary },
    progressDotText: { fontSize: 11, fontWeight: '700', color: '#999' },
    progressDotTextActive: { color: '#fff' },

    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 250 },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    stepTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
    stepDesc: { fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 18 },

    // Input
    fieldWrap: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#222', marginBottom: 6 },
    required: { color: colors.danger },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputIcon: { paddingLeft: 14 },
    input: { flex: 1, padding: 12, fontSize: 14, color: colors.text },
    eyeBtn: { paddingRight: 14, paddingVertical: 12 },
    hint: { fontSize: 11, color: '#777', marginTop: 4 },

    // Select chips
    selectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    selectChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    selectChipText: { fontSize: 12, color: colors.text, fontWeight: '500' },
    selectChipTextActive: { color: '#fff' },

    // Buttons
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 14,
        gap: 8,
        marginTop: 20,
        flex: 1,
    },
    nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    prevBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        padding: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: colors.primary,
        flex: 0.4,
    },
    prevBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.success,
        borderRadius: 12,
        padding: 14,
        gap: 8,
        flex: 1,
    },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    navRow: { flexDirection: 'row', gap: 10, marginTop: 20 },

    // OTP
    otpCard: {
        backgroundColor: colors.bg,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    otpPhone: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16, textAlign: 'center' },
    otpBtn: {
        backgroundColor: '#25D366',
        borderRadius: 12,
        padding: 14,
        width: '100%',
        alignItems: 'center',
    },
    otpBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    otpInfo: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 12 },
    otpInput: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
    },
    otpSuccess: { alignItems: 'center', paddingVertical: 20 },
    otpSuccessText: { fontSize: 16, fontWeight: '700', color: colors.success, marginTop: 8 },
    resendText: { color: colors.primary, fontSize: 13, fontWeight: '600', textAlign: 'center' },

    // Map
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    mapBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

    // Sewa box
    sewaBox: {
        backgroundColor: colors.bg,
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sewaTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },

    // Paket cards
    paketCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    paketCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(229,167,27,0.12)' },
    paketRadio: { marginRight: 12 },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: { borderColor: colors.primary },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
    paketName: { fontSize: 14, fontWeight: '600', color: colors.text },
    paketPrice: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },

    // Yes/No
    yesNoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    yesNoBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        backgroundColor: colors.bg,
    },
    yesNoBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(229,167,27,0.12)' },
    yesNoText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    yesNoTextActive: { color: colors.primary },

    // Checkbox
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 1,
    },
    checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkLabel: { flex: 1, fontSize: 12, color: '#222', lineHeight: 18 },
    agreementBox: {
        backgroundColor: colors.bg,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    separatorLine: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

    // Photo upload
    photoActions: { flexDirection: 'row', gap: 10 },
    photoBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: 12,
        padding: 14,
        borderStyle: 'dashed',
    },
    photoBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    photoPreview: { position: 'relative' },
    photoImage: { width: '100%', height: 180, borderRadius: 12, resizeMode: 'cover' },
    photoRemove: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 12 },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 360,
        overflow: 'hidden',
    },
    modalHeader: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    modalBody: { padding: 24, alignItems: 'center' },
    modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
    modalTitle2: { fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: 4, marginBottom: 12 },
    modalDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    kodeBox: {
        backgroundColor: 'rgba(229,167,27,0.12)',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        width: '100%',
        alignItems: 'center',
    },
    kodeLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
    kodeValue: { fontSize: 18, fontWeight: '800', color: colors.primary, letterSpacing: 2 },
    modalBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 14,
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    // Map Header
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        elevation: 4,
    },
    mapCloseBtn: {
        padding: 4,
        marginRight: 12,
    },
    mapTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
});
