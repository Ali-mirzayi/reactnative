import { NavigationContainer } from '@react-navigation/native'
import Login from "./screens/Login";
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import Messaging from "./screens/Messaging";
import Chat from "./screens/Chat";
import LoginPrev from './screens/LoginPrev';
import { Easing, SafeAreaView, Text, View } from 'react-native';
import { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';
import { useContext, useEffect, useLayoutEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginNavigationProps, RootStackParamList, User } from './utils/types';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './utils/theme';
import { socketContext } from './socketContext';
import { createTable, deleteRooms } from "./utils/DB";
import Toast from 'react-native-toast-message';
import LoadingPage from './components/LoadingPage';


const config: TransitionSpec = {
    animation: 'spring',
    config: {
        stiffness: 1000,
        damping: 50,
        mass: 3,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01
    }
}

const closeConfig: TransitionSpec = {
    animation: 'timing',
    config: {
        duration: 250,
        easing: Easing.linear
    }
}

const LoginNavigation = () => {
    const Stack = createStackNavigator<LoginNavigationProps>();
    return (
        <Stack.Navigator initialRouteName='LoginPrev' screenOptions={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
            transitionSpec: {
                open: config,
                close: closeConfig
            },
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
        }}>
            <Stack.Group>
                <Stack.Screen
                    name='LoginPrev'
                    component={LoginPrev}
                    options={{ headerShown: false, presentation: 'modal' }}
                />
            </Stack.Group>
            <Stack.Group screenOptions={{ presentation: "modal" }}>
                <Stack.Screen
                    name='Login'
                    component={Login}
                    options={{ headerShown: false }}
                />
            </Stack.Group>
        </Stack.Navigator>
    )
}

export default function Navigation() {
    const Stack = createStackNavigator<RootStackParamList>();
    const { setUser, user }: any = useContext(socketContext);
    const [loading, setLoading] = useState(true);
    const [chat, setChat] = useState<number>(1);
    const [beCheck, setBeCheck] = useState<boolean>(false);
    const scheme = useColorScheme();

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const name = await AsyncStorage.getItem("username");
                const id = await AsyncStorage.getItem("id");
                if (name !== null && id !== null) {
                    setUser({ _id: id, name: name, avatar: '' })
                }
                setLoading(false);
            } catch (e) {
                setLoading(false);
            }
        })();
    }, [chat]);

    async function clear() {
        const value = await AsyncStorage.getItem("clearAll");
        if (value === null) {
            await AsyncStorage.setItem("clearAll", "false");
        };
        if (value === "true") {
            await AsyncStorage.clear();
            deleteRooms();
            createTable();
            setBeCheck(true);
            console.log('deleted');
        } else {
            createTable();
        }
    }

    useLayoutEffect(() => {
        clear();
    }, []);

    return (
        <>
            {
                loading ?
                    <LoadingPage active={true} />
                    :
                    <NavigationContainer theme={scheme === 'dark' ? darkTheme : lightTheme}>
                        <Stack.Navigator screenOptions={{ headerShown: false }}>
                            {user ?
                                null
                                :
                                <Stack.Screen
                                    name='LoginNavigation'
                                    component={LoginNavigation}
                                    options={{ headerShown: false, presentation: 'card' }} />
                            }
                            <Stack.Screen
                                name='Chat'
                                component={Chat}
                                initialParams={{ setChat, beCheck }}
                                options={{
                                    title: "Chats",
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name='Messaging'
                                component={Messaging}
                                initialParams={{ contact: undefined }}
                                options={{
                                    title: "Messaging",
                                    headerShown: false,
                                }}
                            />
                        </Stack.Navigator>
                    </NavigationContainer>
            }
        </>
    )
}