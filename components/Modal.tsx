import { View, Text, TextInput, Pressable } from "react-native";
import React, { useState } from "react";
import socket from "../utils/socket";
import { Button, H2, Paragraph, Sheet, YStack } from 'tamagui';

const Modal = ({ visible,setVisible }: { visible:boolean,setVisible: React.Dispatch<React.SetStateAction<boolean>> }) => {
	const closeModal = () => setVisible(false);
	const [groupName, setGroupName] = useState("");

	const handleCreateRoom = () => {
		socket.emit("createRoom", groupName, closeModal());
	};

	return (
		<Sheet animation="medium" modal zIndex={100} snapPoints={[50, 80,100]} open={visible} onOpenChange={setVisible} dismissOnSnapToBottom>
			<Sheet.Overlay />
			<Sheet.Handle />
			<Sheet.Frame flex={1} justifyContent="center" alignItems="center" space="$5">
			<Sheet.ScrollView>
          <YStack p="$5" gap="$8">
            <Button
              size="$6"
              circular
              alignSelf="center"
              onPress={() => console.log('asd')}
            />
            <H2>Hello world</H2>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Paragraph key={i} size="$8">
                Eu officia sunt ipsum nisi dolore labore est laborum laborum in esse ad
                pariatur. Dolor excepteur esse deserunt voluptate labore ea. Exercitation
                ipsum deserunt occaecat cupidatat consequat est adipisicing velit
                cupidatat ullamco veniam aliquip reprehenderit officia. Officia labore
                culpa ullamco velit. In sit occaecat velit ipsum fugiat esse aliqua dolor
                sint.
              </Paragraph>
            ))}
          </YStack>
        </Sheet.ScrollView>
			</Sheet.Frame>
		</Sheet>
	);
};

export default Modal;