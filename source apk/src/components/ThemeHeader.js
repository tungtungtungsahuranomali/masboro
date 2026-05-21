import React from 'react';
import { View, ImageBackground, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import colors from '../theme';

export default function ThemeHeader({ children, style }) {
    const theme = useTheme();
    const hasHeaderImage = theme?.header_image;

    if (hasHeaderImage) {
        return (
            <ImageBackground
                source={{ uri: theme.header_image }}
                style={[{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 56, paddingBottom: 40, paddingHorizontal: 20 }, style]}
                resizeMode="cover"
            >
                <View style={{ flex: 1 }}>
                    {children}
                </View>
            </ImageBackground>
        );
    }

    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 56, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }, style]}
        >
            {children}
        </LinearGradient>
    );
}
