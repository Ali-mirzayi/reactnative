import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Animated, StyleSheet, DrawerLayoutAndroid, Easing, Pressable, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from 'expo-checkbox';
import Link from "../utils/Link";
import { storage } from "../mmkv";
import LottieView from 'lottie-react-native';
import useTheme from "../utils/theme";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerCoreType } from "../utils/types";

export default function DrawerCore({ darkMode,setDarkMode,beCheck, name, children, drawerRef }: DrawerCoreType) {
    const [isChecked, setChecked] = useState<boolean | undefined>(false);
    const toggleRef = useRef(new Animated.Value(darkMode == true ? 0.5 : 0)).current;
    const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
    const { colors } = useTheme();
    const navigation = useNavigation();

    const DrawerComponent = () => {
        function onValueChange(value: any) {
            setChecked(value);
            storage.set("clearAll", value)
        }

        return (
            <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.chatheading, styles.user, { color: colors.mirza }]}>{name}</Text>
                <Pressable onPress={() => { setDarkMode(!darkMode); storage.set("darkMode", darkMode); }} >
                    <AnimatedLottieView
                        progress={toggleRef}
                        source={require('../assets/toggle2.json')}
                        style={styles.darkMode}
                    />
                </Pressable>
                <View style={{ flexDirection: "row" }}>
                    <Link url={'https://www.linkedin.com/in/alimirzaeizade/'}>
                        <Ionicons name="logo-linkedin" style={{ marginHorizontal: 20 }} size={35} color="#317daf" />
                    </Link>
                    <Link url={"https://github.com/Ali-mirzayi"}>
                        <Ionicons name="logo-github" style={{ marginHorizontal: 20 }} size={35} color="black" />
                    </Link>
                </View>
                <View style={styles.removeContainer}>
                    <Text style={{ color: colors.text }}>Remove all data after leave app</Text>
                    <Checkbox
                        value={isChecked}
                        color={isChecked ? '#4630EB' : undefined}
                        onValueChange={onValueChange}
                        style={styles.removeCheck}
                    />
                </View>
            </View>
        )
    };

    useFocusEffect(
        useCallback(() => {
        if (darkMode === false) {
            Animated.timing(toggleRef, {
                toValue: 0.5,
                duration: 1400,
                easing: Easing.linear,
                useNativeDriver: false,
            }).start();
        } else {
            Animated.timing(toggleRef, {
                toValue: 0,
                duration: 1300,
                easing: Easing.linear,
                useNativeDriver: false,
            }).start();
        }},[darkMode]))

    useFocusEffect(
        useCallback(() => {
            const unsubscribe = navigation.addListener('focus', () => {
                setChecked(beCheck);
                storage.set("clearAll", beCheck);
            })
            return unsubscribe;
        }, [])
    );

    return (
        <DrawerLayoutAndroid
            ref={drawerRef}
            drawerWidth={300}
            drawerPosition={"left"}
            renderNavigationView={DrawerComponent}>
            {children}
        </DrawerLayoutAndroid>
    )
}

const styles = StyleSheet.create({
    chatheading: {
        fontSize: 22,
        fontWeight: "bold",
    },
    drawerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: "relative",
        height: 500,
    },
    user: {
        position: "absolute",
        top: 45,
        left: 30
    },
    darkMode: {
        position: "absolute",
        bottom: 108,
        left: 20,
        width: 85,
        height: 85
    },
    removeContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 20,
        right: 5
    },
    removeCheck: {
        marginHorizontal: 10
    },
});