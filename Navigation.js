import { NavigationContainer } from '@react-navigation/native'
import Login from "./screens/Login";
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
// import Messaging from "./screens/Messaging";
import Chat from "./screens/Chat";
import LoginPrev from './components/LoginPrev';
import { Easing } from 'react-native';

export default function Navigation({user}) {
    const Stack = createStackNavigator();
    const config = {
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

    const closeConfig = {
        animation: 'timing',
        config: {
            duration: 250,
            easing: Easing.linear
        }
    }

    const LoginNavigation = () => {
        return (
            <Stack.Navigator initialRouteName='Loginprev' screenOptions={{
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
                        name='Loginprev'
                        component={LoginPrev}
                        options={{ headerShown: false, presentation: 'modal' }}
                    />
                </Stack.Group>
                <Stack.Group screenOptions={{ presentation: "modal" }}>
                    <Stack.Screen
                        name='Login'
                        component={Login}
                        initialParams={{ post: user }}
                        options={{ headerShown: false }}
                    />
                </Stack.Group>
            </Stack.Navigator>
        )
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown:false}}>
                {!user ?
                    null
                    :
                    <Stack.Screen
                        name='LoginNavigation'
                        component={LoginNavigation}
                        initialParams={{ post: user }}
                        options={{ headerShown: false, presentation: 'card' }}/>
                }
                <Stack.Screen
                    name='Chat'
                    component={Chat}
                    initialParams={{ post: user }}
                    options={{
                        title: "Chats",
                        headerShown: false,
                    }}
                />
                {/* <Stack.Screen name='Messaging' component={Messaging} /> */}
            </Stack.Navigator>
        </NavigationContainer>
    )
}