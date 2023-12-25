import { NavigationContainer } from '@react-navigation/native'
import Login from "./screens/Login";
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import Messaging from "./screens/Messaging";
import Chat from "./screens/Chat";
import LoginPrev from './screens/LoginPrev';
import { Easing } from 'react-native';
import { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';
import { useEffect, useLayoutEffect, useState } from 'react';
import { LoginNavigationProps, RootStackParamList } from './utils/types';
import { useColorScheme } from 'react-native';
import { useUser } from './socketContext';
import { createTable, deleteRooms } from "./utils/DB";
import LoadingPage from './components/LoadingPage';
import { storage } from './mmkv';
import { darkTheme, lightTheme } from './utils/theme';


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
    const user = useUser(state=>state.user)
    const setUser = useUser(state=>state.setUser)
    const [loading, setLoading] = useState(true);
    const [chat, setChat] = useState<number>(1);
    const [beCheck, setBeCheck] = useState<boolean>(false);
    const colorScheme = useColorScheme();
    const initDarkMode = storage.getBoolean("darkMode");
    const scheme = (colorScheme === 'dark' ? true : false);
    const fin = initDarkMode !== undefined ? initDarkMode : scheme;
  
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const jsonUser:any = storage.getString('user');
                const {name, id} = JSON.parse(jsonUser);
                if (name !== null && id !== null) {
                    setUser({ _id: id, name: name, avatar: '' })
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
            storage.set("clearAll",false);
        };
        if (value == true) {
            storage.delete('user');
            deleteRooms();
            createTable();
            setBeCheck(true);
            console.log('deleted');
        } else {
            createTable();
        }
        storage.set("darkMode", fin);
        setLoading(false);
    }, []);

    return (
        <>
            <LoadingPage active={loading} />
                    <NavigationContainer theme={scheme === true ? darkTheme : lightTheme}>
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
        </>
    )
}