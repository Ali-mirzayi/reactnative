import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useContext, useRef, useState } from 'react'
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import OutsidePressHandler from 'react-native-outside-press';
import { User } from '../utils/types';
import { socketContext } from '../socketContext';

type props = {
    setUsers: React.Dispatch<React.SetStateAction<[] | User[]>>,
    setScreen: React.Dispatch<React.SetStateAction<"users" | "rooms">>
}

export default function SearchBar({setUsers,setScreen}:props) {
    const [open, setOpen] = useState(false);
    const {socket,user}:any = useContext(socketContext);
    const [search, setSearch] = useState<string | undefined>();
    const animation = useSharedValue(50);
    const inputAnimation = useSharedValue(0);
    const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
    const inputRef = useRef<TextInput>(null);
    const animationStyle = useAnimatedStyle(() => {
        return {
            width: animation.value == 1 ? withTiming(200, { duration: 500 }) : withDelay(500, withTiming(50, { duration: 500 }))
        }
    });

    const inputAnimationStyle = useAnimatedStyle(() => {
        return {
            width: inputAnimation.value == 1 ? withDelay(500,  withTiming(185, { duration: 500 })) : withTiming(0, { duration: 500 }) 
        }
    });

    const handlePressIn = () => {
            animation.value = 1;
            inputAnimation.value = 1;
            setOpen(true);
            inputRef.current?.focus();
    };

    const handlePressOut = () => {
            animation.value = 0.5;
            inputAnimation.value = 0;
            setOpen(false);
            inputRef.current?.blur();
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
                {/* <TextInput ref={inputRef} placeholder="Search Users" value={search} onChangeText={handleSearch} style={[styles.Input,{width:open? 185: 0}]} /> */}
            <Animated.View style={[styles.inner, animationStyle]}>
                <AnimatedTextInput ref={inputRef} placeholder="Search Users" value={search} onChangeText={handleSearch} style={[styles.Input,inputAnimationStyle]} />
                <Ionicons style={styles.icon} onPress={handlePressIn} name='search' size={25} color='#3F72AF' />
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
        zIndex: 1000
    },
    icon: {
        position: "absolute",
        right: 0,
        paddingRight: 12
    },
    Input:{ 
        fontSize:16,
        height: 35,
    }
})