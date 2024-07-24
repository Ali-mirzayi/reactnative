import React, { useEffect } from 'react'
import baseURL from './baseURL';
import { useNetInfo } from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

export default function useCheckConnection(setError: React.Dispatch<React.SetStateAction<boolean>>) {
    const netInfo = useNetInfo({ reachabilityUrl: `${baseURL()}/api` });

    // useEffect(()=>{
    //     (async()=>{
    //         const response = await fetch(`${baseURL()}`);
    //         const json = await response.json();
    //         console.log(response)
    //     })()
    // })

    // useEffect(() => {
    //     const fetchData = async () => {
    //       const headers = new Headers();
    //       headers.append('Content-Type', 'application/json');

    //       try {
    //         const response = await fetch(baseURL(), {
    //           method: 'GET',
    //           headers: headers
    //         });

    //         console.log('Status code:', response.status);
    //       } catch (error) {
    //         console.error('Error:', error);
    //       }
    //     }

    //     fetchData();
    //   }, []);

    // console.log(`${baseURL()}/api`)
    useEffect(() => {
        // check internet connectiont
        if (netInfo.isConnected === false) {
            const showToast = () => {
                Toast.show({
                    type: 'Connection error',
                    text1: 'you are offline',
                    autoHide: false
                });
                setError(true);
            }
            showToast();
        } else {
            // check server conection
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');

            const timeout = new Promise((_, reject) => {
                setTimeout(reject, 5000, 'Request timed out');
            });
            const request = fetch(baseURL(), {
                method: 'GET',
                headers: headers
            });
            Promise.race([timeout, request]).then((res: any) => {
                if (res.status !== 200) {
                    Toast.show({
                        type: 'error',
                        text1: 'Connection error',
                        text2: 'Server can\'t be reached',
                        autoHide: false
                    });
                    setError(true);
                }
            }).catch((e) => {
                console.error(e);
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