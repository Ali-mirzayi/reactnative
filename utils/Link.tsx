import { useCallback } from "react";
import { Alert, Linking, Pressable } from "react-native";

type OpenURLButtonProps = {
    url: string;
    children: any;
};

const Link = ({ url, children }: OpenURLButtonProps) => {
    const handlePress = useCallback(async () => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert(`Don't know how to open this URL: ${url}`);
        }
    }, [url]);

    return (<Pressable onPress={handlePress}>
        {children}
    </Pressable>
    );
};

export default Link;
