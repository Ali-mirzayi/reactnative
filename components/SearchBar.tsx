import { TouchableHighlight, StyleSheet, TextInput, View } from 'react-native'
import { useContext, useRef, useState } from 'react'
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import OutsidePressHandler from 'react-native-outside-press';
import { User } from '../utils/types';
import { socketContext } from '../socketContext';

type props = {
    setUsers: React.Dispatch<React.SetStateAction<[] | User[]>>,
    setScreen: React.Dispatch<React.SetStateAction<"users" | "rooms">>
};

export default function SearchBar({setUsers,setScreen}:props) {
    const {socket,user}:any = useContext(socketContext);
    const [search, setSearch] = useState<string | undefined>();
    const animation = useSharedValue(50);
    const inputAnimation = useSharedValue(0);
    const inputRef = useRef<TextInput>(null);
    const animationStyle = useAnimatedStyle(() => {
        return {
            width: animation.value == 1 ? withTiming(200, { duration: 500 }) : withDelay(500, withTiming(50, { duration: 500 }))
        }
    });

    const handlePressIn = () => {
            animation.value = 1;
            inputAnimation.value = 1;
            inputRef.current?.focus();
            console.log('in');
    };

    const handlePressOut = () => {
            animation.value = 0.5;
            inputAnimation.value = 0;
            inputRef.current?.blur();
            console.log('out');
    };

    const handleSearch = (e: string) => {
		setSearch(e);
        if (e===""){
            setUsers([]);
            setScreen("rooms");
        }else{
            setScreen("users");
            socket.emit("findUser", { search: e, user: user });
            socket.on("findUser", (roomChats: any) => setUsers(roomChats));
        }
	}

    return (
        <View style={styles.container}>
            <OutsidePressHandler onOutsidePress={handlePressOut}>
            <Animated.View style={[styles.inner, animationStyle]}>
                <TextInput ref={inputRef} placeholder="Search Users" value={search} onChangeText={handleSearch} style={styles.Input} />
                <TouchableHighlight style={styles.icon} onPress={handlePressIn} underlayColor={"#c8cce0"}>
                <Ionicons name='search' size={25} color='#3F72AF' />
                </TouchableHighlight>
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
        justifyContent: "flex-end",
        zIndex: 1000,
        overflow: "hidden",
        height:40,
    },
    icon: {
        position: "absolute",
        right: 0,
        padding: 12,
    },
    Input:{ 
        fontSize:16,
        height: 35,
        width:"70%",
        marginRight:50
    }
})