import React, { useEffect } from 'react'
import baseURL from '../utils/baseURL';
import { useSocket } from '../socketContext';
import io from 'socket.io-client';
import Toast from 'react-native-toast-message';

export default function useSocketConnection(setError: React.Dispatch<React.SetStateAction<boolean>>) {
    const setSocket = useSocket(state => state.setSocket);

    useEffect(() => {
        const newSocket = io(baseURL(), {
            autoConnect: false,
            reconnection: false,
        });
        setSocket(newSocket);
        const connectSocket = () => {
            if (!newSocket.connected) {
                newSocket.connect();
                const showToast = () => {
                    Toast.show({
                        type: 'error',
                        text1: 'Socket Can`t connect',
                        autoHide: false,
                        // visibilityTime: 3
                    });
                    setError(true);
                };
                showToast();
            }
        };
        connectSocket();
        const intervalId = setInterval(() => {
            connectSocket();
        }, 6000);
        return () => {
            clearInterval(intervalId);
            newSocket.disconnect();
        };
    }, [setSocket]);

    return null;
}  