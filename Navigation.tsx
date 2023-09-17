import { NavigationContainer } from '@react-navigation/native'
import Login from "./screens/Login";
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import Messaging from "./screens/Messaging";
import Chat from "./screens/Chat";
import LoginPrev from './screens/LoginPrev';
import { Easing, Text, View } from 'react-native';
import { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LoginNavigationProps = {
    LoginPrev: undefined;
    Login: undefined;
    Chat: undefined;
};

export type RootStackParamList = {
    LoginNavigation?: undefined;
    Chat: { user: string | undefined, setChat: React.Dispatch<React.SetStateAction<number>> };
    Messaging: { user: string | undefined, contact: string | undefined };
};

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
    const [user, setUser] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [chat, setChat] = useState(1);
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const value = await AsyncStorage.getItem("username");
                if (value !== null) {
                    setUser(value)
                }
                setLoading(false);
            } catch (e) {
                console.error("Error while loading username!");
                setLoading(false);
            }
        })();
    }, [chat])
    return (
        <>
            {
                loading ?
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text>Wait ...</Text></View >
                    :
                    <NavigationContainer>
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
                                initialParams={{ user, setChat }}
                                options={{
                                    title: "Chats",
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name='Messaging'
                                component={Messaging}
                                initialParams={{ user, contact: undefined }}
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