import React, { useEffect } from 'react'
import baseURL from './baseURL';
import { useNetInfo } from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

export default function checkConnection(setError:React.Dispatch<React.SetStateAction<boolean>>) {
    const netInfo = useNetInfo({ reachabilityUrl: `${baseURL()}/checkUser` });
    useEffect(() => {
        // check internet connectiont
        if (netInfo.isConnected === false) {
            const showToast = () => {
                Toast.show({
                    type: 'error',
                    text1: 'you are offline',
                    autoHide: false
                });
                setError(true);
            }
            showToast();
        } else {
            // check server conection
            const timeout = new Promise((_, reject) => {
                setTimeout(reject, 1000, 'Request timed out');
            });
            const request = fetch(baseURL());
            Promise.race([timeout, request]).then(() => setError(false)).catch(() => {
                Toast.show({
                    type: 'error',
                    text1: 'Connection error',
                    text2: 'An error occurred while trying to connect the server',
                    autoHide: false
                });
                setError(true);
            })
        }
    }, [netInfo.isConnected]);
}