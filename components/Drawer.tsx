import { Drawer } from 'react-native-drawer-layout';
import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Animated, StyleSheet, Easing, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Checkbox from 'expo-checkbox';
import Link from "../utils/Link";
import { storage } from "../mmkv";
import LottieView from 'lottie-react-native';
import useTheme from "../utils/theme";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerCoreType } from "../utils/types";
import { useBeCheck, useUser } from '../socketContext';
import switchTheme from 'react-native-theme-switch-animation';
import sleep from '../utils/wait';


export default function DrawerCore({ children, open, setOpen, darkMode, setDarkMode }: DrawerCoreType) {
    const user = useUser(state => state.user);
    const beCheck = useBeCheck(state => state.beCheck);
    const { colors } = useTheme();
    const toggleRef = useRef(new Animated.Value(darkMode === true ? 0.5 : 0)).current;
    const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
    const [isChecked, setChecked] = useState<boolean | undefined>(false);
    const navigation = useNavigation();
    const hasMounted = useRef(false);

    const DrawerComponent = () => {
        async function onPressHandler() {
            setDarkMode(e => !e);
            // delay 1 second
            await sleep(1000);
            storage.set("darkMode", !darkMode);
            switchTheme({
                switchThemeFunction: () => { },
                animationConfig: {
                    type: !darkMode ? 'circular' : 'inverted-circular',
                    duration: 800,
                    startingPoint: {
                        cxRatio: 0.58,
                        cyRatio: 0.06
                    },
                    captureType: "layer"
                },
            })

            // switchTheme({
            //     switchThemeFunction: () => {
            //         (async()=>{
            //             await sleep(1000);
            //             storage.set("darkMode", darkMode);
            //         })();
            //     },
            //     animationConfig: {
            //         type: !darkMode ? 'circular' : 'inverted-circular',
            //         duration: 1000,
            //         startingPoint: {
            //             cx: 240,
            //             cy: 50
            //         }
            //     },
            // })
            //    (async()=>{  
            //         await sleep(500);
            //         storage.set("darkMode", darkMode);
            //     })();

            //     setDarkMode((prevMode) => {  
            //         const newMode = !prevMode;  
            //         (async () => {
            //             await sleep(1000);
            //             storage.set("darkMode", newMode);  

            //             switchTheme({  
            //                 switchThemeFunction: () => {},  
            //                 animationConfig: {  
            //                     type: newMode ? 'circular' : 'inverted-circular',  
            //                     duration: 1000,  
            //                     startingPoint: {  
            //                         cx: 240,  
            //                         cy: 50  
            //                     }  
            //                 },  
            //             });  
            //         })()
            //         return newMode;
            //     });  
        }

        function onValueChange(value: any) {
            setChecked(value);
            storage.set("clearAll", value)
        }

        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <Text style={[styles.chatheading, styles.user, { color: colors.mirza }]}>{user?.name}</Text>
                <Pressable onPress={onPressHandler} style={{ zIndex: 9999, margin: 10 }} >
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
                            <Text style={{ color: colors.text, fontSize: 18 }}>Linkedin</Text>
                        </View>
                    </Link>
                    <Link url={"https://github.com/Ali-mirzayi"}>
                        <View style={styles.indIcon}>
                            <Ionicons name="logo-github" size={38} color="black" />
                            <Text style={{ color: colors.text, fontSize: 18 }}>GitHub</Text>
                        </View>
                    </Link>
                    <Link url={"https://alimirzaei.vercel.app"}>
                        <View style={styles.indIcon}>
                            <MaterialCommunityIcons name="web" size={40} color="black" />
                            <Text style={{ color: colors.text, fontSize: 18 }}>Web Site</Text>
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

    useEffect(() => {
        if (hasMounted.current) {
            storage.set("darkMode", !darkMode);
            Animated.timing(toggleRef, {
                toValue: darkMode ? 0.4 : 0,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start();
        } else {
            hasMounted.current = true;
        }

        // (async()=>{
        //     await sleep(500);
        //     Animated.timing(toggleRef, {  
        //         toValue: darkMode ? 0.5 : 1,  
        //         duration: 1000,  
        //         easing: Easing.linear,  
        //         useNativeDriver: true,  
        //     }).start();
        // })();

    }, [darkMode]);

    // useFocusEffect(
    //     useCallback(() => {
    //         if (darkMode === true) {
    //             Animated.timing(toggleRef, {
    //                 toValue: 0.5,
    //                 duration: 1400,
    //                 easing: Easing.linear,
    //                 useNativeDriver: true,
    //             }).start();
    //         } else {
    //             Animated.timing(toggleRef, {
    //                 toValue: 1,
    //                 duration: 1000,
    //                 easing: Easing.linear,
    //                 useNativeDriver: true,
    //             }).start();
    //         }
    //     }, [darkMode]));

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
        <Drawer
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            renderDrawerContent={DrawerComponent}
        >
            {children}
        </Drawer>
    );
};

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