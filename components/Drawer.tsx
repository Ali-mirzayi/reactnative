import React, { useState, useRef, useCallback } from "react";
import { View, Text, Animated, StyleSheet, DrawerLayoutAndroid, Easing, Pressable } from "react-native";
import { Ionicons,MaterialCommunityIcons } from "@expo/vector-icons";
import Checkbox from 'expo-checkbox';
import Link from "../utils/Link";
import { storage } from "../mmkv";
import LottieView from 'lottie-react-native';
import useTheme from "../utils/theme";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerCoreType } from "../utils/types";

export default function DrawerCore({ darkMode, setDarkMode, beCheck, name, children, drawerRef }: DrawerCoreType) {
    const toggleRef = useRef(new Animated.Value(darkMode === true ? 0.5 : 0)).current;
    const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
    const [isChecked, setChecked] = useState<boolean | undefined>(false);
    const { colors } = useTheme();
    const navigation = useNavigation();

    const DrawerComponent = () => {   
        function onPressHandler() {
            setDarkMode(!darkMode);
            storage.set("darkMode", darkMode);
        }

        function onValueChange(value: any) {
            setChecked(value);
            storage.set("clearAll", value)
        }
        
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <Text style={[styles.chatheading, styles.user, { color: colors.mirza }]}>{name}</Text>
                <Pressable onPress={onPressHandler} style={{ zIndex: 9999,margin:8 }} >
                    <AnimatedLottieView
                        progress={toggleRef}
                        source={require('../assets/toggle2.json')}
                        style={styles.darkMode}
                    />
                </Pressable>
                <View style={styles.navigation}>
                    <Link url={'https://www.linkedin.com/in/alimirzaeizade/'}>
                        <View style={styles.indIcon}>
                            <Ionicons name="logo-linkedin" size={36} color="#317daf" />
                            <Text style={{color:colors.text,fontSize:18}}>Linkedin</Text>
                        </View>
                    </Link>
                    <Link url={"https://github.com/Ali-mirzayi"}>
                        <View style={styles.indIcon}>
                            <Ionicons name="logo-github" size={38} color="black" />
                            <Text style={{color:colors.text,fontSize:18}}>GitHub</Text>
                        </View>
                    </Link>
                    <Link url={"https://alimirzaei.vercel.app"}>
                        <View style={styles.indIcon}>
                            <MaterialCommunityIcons name="web" size={40} color="black" />
                            <Text style={{color:colors.text,fontSize:18}}>Web Site</Text>
                        </View>
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
            }
        }, [darkMode]))

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
    user: {
        position: "absolute",
        left: 16,
        top: 36
    },
    darkMode: {
        width: 85,
        height: 85,
        marginLeft: "auto",
    },
    navigation: {
        marginTop: "auto",
        marginBottom: "auto",
        marginRight: 'auto'
    },
    indIcon: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginVertical: 10,
        gap: 30
    },
    removeContainer: {
        marginTop: "auto",
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    removeCheck: {
        marginHorizontal: 10,
        width: 25,
        height: 25,
    },
});