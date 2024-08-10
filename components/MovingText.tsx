import React, { useEffect } from 'react';
import Animated, { cancelAnimation, Easing, StyleProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

type MovingTextureTypes = {
    children: string
    animationThreshold: number
    style?: StyleProps
    disable?:boolean
};

const MovingText = ({ children:text, animationThreshold, style,disable }: MovingTextureTypes) => {
    const translateX = useSharedValue(0);
    const shouldAnimate = !disable && text.length >= animationThreshold;
    const textWidth = text.length * 3;
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        }
    });

    useEffect(() => {
        if (!shouldAnimate) return;

        translateX.value = withDelay(1000, withRepeat(withTiming(-textWidth, { duration:3000, easing: Easing.linear }), -1, true));

        return () => {
            cancelAnimation(translateX);
            translateX.value = 0;
        }
    }, [translateX, text, animationThreshold, shouldAnimate]);

    return (
        <Animated.Text
            numberOfLines={1}
            style={[
                style,
                !disable&&animatedStyle,
                shouldAnimate && {width:9999,paddingLeft:16}
            ]}
        >
            {text}
        </Animated.Text>
    )
}

export default MovingText;