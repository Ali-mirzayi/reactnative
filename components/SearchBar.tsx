import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useState } from 'react'
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import OutsidePressHandler from 'react-native-outside-press';
import socket from '../utils/socket';

export default function SearchBar({user,setUsers}:{user:string | undefined,setUsers:React.Dispatch<React.SetStateAction<[] | string[]>>}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState<string | undefined>();
    const animation = useSharedValue(50);
    const animationStyle = useAnimatedStyle(() => {
        return {
            width: animation.value == 1 ? withTiming(250, { duration: 500 }) : withTiming(50, { duration: 500 })
        }
    });
    const handlePressIn = () => {
            animation.value = 1;
            setOpen(true);
    }

    const handlePressOut = () => {
            animation.value = 0;
            setOpen(false);
    }

    const handleSearch = (e: string) => {
		setSearch(e);
		socket.emit("findUser", { search: e, user: user });
		socket.on("findUser", (roomChats: any) => setUsers(roomChats));
	}

    return (
        <View style={styles.container}>
            <OutsidePressHandler
              onOutsidePress={handlePressOut}
            >
            <Animated.View style={[styles.inner, animationStyle]}>
                <TextInput placeholder="search" value={search} onChangeText={handleSearch} focusable={true} disableFullscreenUI style={[styles.Input,{width: open ? 220 : 0}]} />
                <Pressable style={styles.icon} onPress={handlePressIn}>
                    <Ionicons style={{ paddingRight: 12 }} name='search' size={25} color='#3F72AF' />
                </Pressable>
            </Animated.View>
            </OutsidePressHandler>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inner: {
        position: 'relative',
        backgroundColor: "#DBE2EF",
        borderRadius: 10,
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: "center",
        zIndex: 1000
    },
    icon: {
        position: "absolute",
        right: 0
    },
    Input:{ 
        paddingRight:30,
        fontSize:16,
        height: 35,

    }
})