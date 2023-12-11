import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { User } from "../utils/types";
import { time } from "../utils/utils";
import { IMessage } from "react-native-gifted-chat";

type props = {
	messages: IMessage | any,
	contact: User,
	handleNavigation: () => void
}

const ChatComponent = ({ messages,contact,handleNavigation }:props) => {

	const styles = StyleSheet.create({
		cchat: {
			width: "100%",
			flexDirection: "row",
			alignItems: "center",
			borderRadius: 5,
			paddingHorizontal: 15,
			backgroundColor: "#fff",
			height: 80,
			marginBottom: 10,
		},cavatar: {
			marginRight: 15,
		},cusername: {
			fontSize: 18,
			marginBottom: 5,
			fontWeight: "bold",
		},cmessage: {
			fontSize: 14,
			opacity: 0.7,
		},
		crightContainer: {
			flexDirection: "row",
			justifyContent: "space-between",
			flex: 1,
		},
		ctime: {
			opacity: 0.5,
		},
	});

	return (
		<TouchableOpacity style={styles.cchat} onPress={handleNavigation}>
			<Ionicons
				name='person-circle-outline'
				size={45}
				color='black'
				style={styles.cavatar}
			/>
			<View style={styles.crightContainer}>
				<View>
					<Text style={styles.cusername}>{contact.name}</Text>
					<Text style={styles.cmessage}>
						{messages?.text ? messages.text : "Tap to start chatting"}
					</Text>
				</View>
				<View>
					<Text style={styles.ctime}>
						{messages?.createdAt ? time(`${messages.createdAt}`) : "now"}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default ChatComponent;