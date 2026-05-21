import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Skeleton = ({ width: w, height, borderRadius = 4, style }) => {
    const translateX = useRef(new Animated.Value(-width)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(translateX, {
                toValue: width,
                duration: 1200,
                useNativeDriver: true,
            })
        ).start();
    }, [translateX]);

    return (
        <View
            style={[
                styles.container,
                { width: w, height, borderRadius },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.gradientContainer,
                    { transform: [{ translateX }] }
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E5E7EB', // Tailwind gray-200
        overflow: 'hidden',
    },
    gradientContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        flex: 1,
        width: '100%',
    },
});

export default Skeleton;
