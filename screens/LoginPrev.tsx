import { Text, SafeAreaView, StyleSheet, Pressable, View } from 'react-native'
import React from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar'
import Animated from 'react-native-reanimated';
import { LoginNavigationProps } from '../Navigation';

export default function LoginPrev({ navigation }:NativeStackScreenProps<LoginNavigationProps,'LoginPrev'>) {
    return (
        <SafeAreaView style={styles.Container}>
            <StatusBar style="auto" />
            <Animated.Image
                source={require('../assets/mirza512.png')}
                style={styles.ImageContainer}
                sharedTransitionTag="tag"
            />
            <Text style={styles.Mirza}>MirzaGram</Text>
            <Text style={styles.MirzaDesc}>قوی ترین چت اپ بی رقیب و بدون دیتابیس</Text>
            <Text style={styles.MirzaDesc}>با ما در امان چت کنید </Text>
            <Pressable style={styles.ButtonContainer} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.Button}>شروع کن !</Text>
            </Pressable>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF1FF"
    },
    ImageContainer: {
        width: 250,
        height: 250,
    },
    Mirza: {
        fontSize: 25,
        fontWeight: "700",
        marginTop: 20,
        marginBottom: 5
    },
    MirzaDesc: {
        textAlign: "center",
        fontSize: 18,
        color: "#555"
    },
    ButtonContainer: {
        marginTop: 20,
        backgroundColor: "#2DA5E0",
        borderRadius: 6,
        overflow: "hidden",
    },
    Button: {
        color: "white",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 13,
        backgroundColor: 'transparent',
        fontSize: 20
    }
});