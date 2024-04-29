import { NavigationContainer } from '@react-navigation/native'
import Login from "./screens/Login";
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import Messaging from "./screens/Messaging";
import Chat from "./screens/Chat";
import LoginPrev from './screens/LoginPrev';
import { Easing } from 'react-native';
import { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ChatNavigationProps, LoginNavigationProps, RootStackParamList, User } from './utils/types';
import { useColorScheme } from 'react-native';
import { useToken, useUser } from './socketContext';
import { createTable, deleteRooms } from "./utils/DB";
import LoadingPage from './components/LoadingPage';
import { storage } from './mmkv';
import baseURL from './utils/baseURL';
import { usePushNotifications } from './utils/usePushNotifications';

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

export const LoginNavigation = () => {
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

export const ChatNavigation = ({ beCheck }: any) => {
    const Stack = createStackNavigator<ChatNavigationProps>();
    return (
        <Stack.Navigator initialRouteName='Chat' screenOptions={{
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
                    name='Chat'
                    component={Chat}
                    initialParams={{ beCheck }}
                    options={{
                        title: "Chats",
                        headerShown: false,
                    }}
                />
            </Stack.Group>
            <Stack.Group screenOptions={{ presentation: "modal" }}>
                <Stack.Screen
                    name='Messaging'
                    component={Messaging}
                    initialParams={{ contact: undefined }}
                    options={{
                        title: "Messaging",
                        headerShown: false,
                    }}
                />
            </Stack.Group>
        </Stack.Navigator>
    )
}

export default function Navigation() {
    const Stack = createStackNavigator<RootStackParamList>();
    const user = useUser(state => state.user);
    const setUser = useUser(state => state.setUser);
    const setToken = useToken(state => state.setToken);
    const [loading, setLoading] = useState(true);
    const [chat, setChat] = useState<boolean>(false);
    const [beCheck, setBeCheck] = useState<boolean>(false);
    const colorScheme = useColorScheme();
    const initDarkMode = storage.getBoolean("darkMode");
    const scheme = (colorScheme === 'dark' ? true : false);
    const fin = initDarkMode !== undefined ? initDarkMode : scheme;
    // const { expoPushToken, notification } = usePushNotifications();

    useEffect(() => {
        // this function called in chat screen
        (async () => {
            try {
                setLoading(true);
                const jsonUser = storage.getString('user');
                if (jsonUser) {
                    const { name, _id, token } = JSON.parse(jsonUser);
                    if (name !== null && _id !== null) {
                        setUser({ _id: _id, name: name, avatar: '', token })
                    }
                }
                setLoading(false);
            } catch (e) {
                setLoading(false);
            }
        })();
    }, [chat]);

    useLayoutEffect(() => {
        setLoading(true);
        const value = storage.getBoolean("clearAll");
        if (value === undefined || null) {
            storage.set("clearAll", false);
        };
        if (value == true) {
            (function () {
                // for delete user and related rooms he's joined
                fetch(`${baseURL()}/deleteUser`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: storage.getString('user')
                });
            })();
            storage.delete('user');
            deleteRooms();
            createTable();
            setBeCheck(true);
            setLoading(false);
        } else {
            createTable();
            setLoading(false);
        }
        storage.set("darkMode", fin);
        // if (expoPushToken) { setToken(expoPushToken) }
        setLoading(false);
    }, []);

    return (
        <>
            <LoadingPage active={loading} />
            <NavigationContainer>
                <Stack.Navigator screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                    transitionSpec: {
                        open: config,
                        close: closeConfig
                    },
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
                }}>
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
                        initialParams={{ beCheck }}
                        options={{
                            headerShown: false,
                        }}
                        listeners={{
                            focus: () => {
                                setChat(true);
                            }
                        }}
                    />
                    <Stack.Screen
                        name='Messaging'
                        component={Messaging}
                        initialParams={{ contact: undefined }}
                        options={{
                            headerShown: false,
                        }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </>
    )
}