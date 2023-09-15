import { View, Text, TextInput, Pressable } from "react-native";
import React, { useState } from "react";
import socket from "../utils/socket";
import { styles } from "../utils/styles";
import {Sheet}  from '@tamagui/sheet'


const Modal = ({ visible,setVisible }: { visible:boolean,setVisible: React.Dispatch<React.SetStateAction<boolean>> }) => {
	const closeModal = () => setVisible(false);
	const [groupName, setGroupName] = useState("");

	const handleCreateRoom = () => {
		socket.emit("createRoom", groupName, closeModal());
	};

	return (
		<Sheet snapPoints={[256, 190]} modal={true} open={visible} defaultOpen={true} onOpenChange={setVisible}>
			<Sheet.Overlay />
			<Sheet.Handle />
			<Sheet.Frame padding="$4" justifyContent="center" alignItems="center" space="$5">
				<View style={{width:"100%"}}>
					<Text style={{color:"#fff"}}>
						salam
					</Text>
				</View>
			</Sheet.Frame>
		</Sheet>
	);
};

export default Modal;