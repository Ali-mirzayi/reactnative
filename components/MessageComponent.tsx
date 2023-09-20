import { View, Text } from 'react-native'
import React from 'react'

export default function MessageComponent({ item, user }: any) {
    return (
        <View style={{ flexDirection: "row", width: "100%",justifyContent:"space-around" }}>
            <Text style={{ color: "red" }}>{item.user}</Text>
            <Text style={{ color: "blue" }}>{item.text}</Text>
            <Text style={{ color: "green" }}>{item.time}</Text>
        </View>
    )
}