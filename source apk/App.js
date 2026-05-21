import React, { Suspense, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import useUpdateChecker from './src/hooks/useUpdateChecker';
import colors from './src/theme';
import Skeleton from './src/components/Skeleton';
import { setupNotificationListeners } from './src/services/NotificationService';

// Critical screens loaded eagerly
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TagihanScreen from './src/screens/TagihanScreen';
import TiketScreen from './src/screens/TiketScreen';
import BeritaScreen from './src/screens/BeritaScreen';
import BeritaDetailScreen from './src/screens/BeritaDetailScreen';
import InternalContentScreen from './src/screens/InternalContentScreen';
import RubahPasswordScreen from './src/screens/RubahPasswordScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import SpeedTestScreen from './src/screens/SpeedTestScreen';
import GoklinScreen from './src/screens/GoklinScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Wrapper to add Suspense to lazy-loaded screens
export function GenericSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.skeletonHeader}
      >
        <Skeleton width={180} height={20} style={{ alignSelf: 'center', marginTop: 10 }} />
      </LinearGradient>
      <View style={{ padding: 20 }}>
        <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={120} borderRadius={16} />
      </View>
    </View>
  );
}

const STagihanScreen = TagihanScreen;
const STiketScreen = TiketScreen;
const SBeritaScreen = BeritaScreen;
const SBeritaDetailScreen = BeritaDetailScreen;
const SInternalContentScreen = InternalContentScreen;
const SRubahPasswordScreen = RubahPasswordScreen;
const SProfilScreen = ProfilScreen;
const SSpeedTestScreen = SpeedTestScreen;
const SGoklinScreen = GoklinScreen;
const SRegisterScreen = RegisterScreen;
const SForgotPasswordScreen = ForgotPasswordScreen;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const BeritaStack = createNativeStackNavigator();

function BeritaStackScreen() {
  return (
    <BeritaStack.Navigator>
      <BeritaStack.Screen
        name="BeritaList"
        component={SBeritaScreen}
        options={{
          headerShown: false,
        }}
      />
      <BeritaStack.Screen
        name="BeritaDetail"
        component={SBeritaDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </BeritaStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          elevation: 15,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          height: Platform.OS === 'android' ? 90 : 80,
          paddingBottom: Platform.OS === 'android' ? 24 : 20,
          paddingTop: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tagihan"
        component={STagihanScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Tagihan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tiket"
        component={STiketScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Tiket',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={SProfilScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { token, loading } = useAuth();
  const { updateModalElement } = useUpdateChecker() || {};
  const navigationRef = useRef(null);

  // Setup notification listeners
  useEffect(() => {
    const cleanup = setupNotificationListeners((data) => {
      if (!navigationRef.current) return;
      const nav = navigationRef.current;
      switch (data?.type) {
        case 'tagihan':
          nav.navigate('Main', { screen: 'Tagihan' });
          break;
        case 'tiket':
          nav.navigate('Main', { screen: 'Tiket' });
          break;
        case 'artikel':
          nav.navigate('BeritaList');
          break;
        case 'registrasi':
        case 'isolir':
          nav.navigate('Main', { screen: 'Profil' });
          break;
        case 'informasi':
          nav.navigate('Main', { screen: 'Home' });
          break;
        default:
          nav.navigate('Main', { screen: 'Home' });
      }
    });
    return cleanup;
  }, []);

  if (loading) {
    return <GenericSkeleton />;
  }

  const linking = {
    prefixes: ['mentarinet://'],
    config: {
      screens: {
        Main: {
          screens: {
            Home: 'home',
            Tagihan: 'tagihan',
            Tiket: 'tiket',
            Profil: 'profil',
          },
        },
        Login: 'login',
        Register: 'register',
      },
    },
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      {updateModalElement}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Always show Main (TabNavigator) — public home + protected screens */}
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="InternalContent" component={SInternalContentScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RubahPassword" component={SRubahPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BeritaList" component={SBeritaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BeritaDetail" component={SBeritaDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SpeedTest" component={SSpeedTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Goklin" component={SGoklinScreen} options={{ headerShown: false }} />
        {/* Auth screens — navigated from LoginModal or direct links */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={SRegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={SForgotPasswordScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  skeletonHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 56,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
});
