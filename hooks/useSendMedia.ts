import { ensureDirExists, fileDirectory } from "../utils/directories";
import { getAudioMetadata } from '@missingcore/audio-metadata';
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { generateID, isMusicFile } from "../utils/utils";
import { availableStatus, IMessagePro } from "../utils/types";
import baseURL from "../utils/baseURL";
import { GiftedChat } from "react-native-gifted-chat";
import { useMessage, useSocket, useUser } from "../socketContext";

const wantedTags = ['artist', 'name', 'artwork'] as const;
export type sendImageProps = {
    uri?: string | null,
    mimeType?: string,
};

export type sendVideoProps = {
    uri?: string | null,
    mimeType?: string,
};

export type sendFileProps = {
    uri?: string | null,
    mimeType?: string,
    name?: string,
};

export type sendAudioProps = {
    uri?: string | null,
    duration?: number,
};

export default function useSendMedia({ roomId }: any) {
    const id = generateID();
    const socket = useSocket(state => state.socket);
    const user: any = useUser(state => state.user);
    const { messages, setMessages } = useMessage();

    const SendImage = async ({ uri, mimeType }: sendImageProps) => {
        if (!uri) return;
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, image: uri, mimeType, availableStatus: availableStatus.uploading }]));
        try {
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType });
            if (response.body === "ok") {
                socket?.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message;
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.log('Error uploading image: response not ok', response.body);
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        }
    };

    const SendVideo = async ({ uri, mimeType }: sendVideoProps) => {
        if (!uri) return;
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, video: uri, mimeType, availableStatus: availableStatus.uploading }]));
        try {
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType });
            if (response.body === "ok") {
                socket?.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.log('Error uploading Image: response not ok', response.body);
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        }
    };

    const SendFile = async ({ uri, name, mimeType }: sendFileProps) => {
        if (!uri) return;
        const isMusic = isMusicFile(name);
        if (isMusic) {
            const data = await getAudioMetadata(uri, wantedTags).catch(e => console.log(e));
            let artwork = data?.metadata.artwork?.replace(/^data:image\/[^;]+;base64,/, '');
            if (artwork) {
                await ensureDirExists();
                await FileSystem.writeAsStringAsync(fileDirectory + `${name}-artwork.jpeg`, artwork, { encoding: "base64" }).then(() => {
                    artwork = fileDirectory + `${name}-artwork.jpeg`
                }).catch((e) => {
                    console.log(e, 'cant write artwork')
                })
            }
            const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
            // @ts-ignore
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration: status?.durationMillis / 1000, playing: false, availableStatus: availableStatus.uploading, artwork: artwork?.startsWith('file') ? artwork : undefined, musicArtist: data?.metadata.artist ?? '', musicName: data?.metadata.name ?? name }]));
            await sound.unloadAsync();
            try {
                const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
                if (response.body === "ok") {
                    // @ts-ignore
                    socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis / 1000, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, availableStatus: availableStatus.available }
                        } else {
                            return message
                        }
                    })));
                } else {
                    setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, availableStatus: availableStatus.error }
                        } else {
                            return message;
                        }
                    }));
                    console.log('error uploading music');
                }
            } catch (error) {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.error('Error occurred during upload:', error);
            }
        } else {
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, file: uri, fileName: name, mimeType, availableStatus: availableStatus.uploading }]));
            try {
                const response = await FileSystem.uploadAsync(`${baseURL()}/uploadd`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
                if (response.body === "ok") {
                    socket?.emit('sendFile', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, availableStatus: availableStatus.available }
                        } else {
                            return message
                        }
                    })));
                } else {
                    setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, availableStatus: availableStatus.error }
                        } else {
                            return message;
                        }
                    }));
                    console.log('error uploading file');
                }
            } catch (error) {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.error('Error occurred during upload:', error);
            }
        }
    };

    const SendAudio = async ({ uri, duration }: sendAudioProps) => {
        if (!uri) return;
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: "voice", duration, playing: false, availableStatus: availableStatus.uploading }]));
        try {
            const response = await FileSystem.uploadAsync(`${baseURL()}/uploadd`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
            if (response.body === "ok") {
                socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: "voice", duration, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading audio');
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        }
    };

    const ReSendImage = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            const oldMessage = messages.find(e => e._id === errorId);
            const uri = oldMessage?.image;
            if (!uri) return;
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
            if (response.body === "ok") {
                socket?.emit('sendImage', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading file');
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        return;
    };

    const ReSendVideo = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            const oldMessage = messages.find(e => e._id === errorId);
            const uri = oldMessage?.video;
            if (!uri) return;
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
            if (response.body === "ok") {
                socket?.emit('sendVideo', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading file');
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        return;
    };

    const ReSendMusic = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            const oldMessage = messages.find(e => e._id === errorId);
            const uri = oldMessage?.audio;
            if (!uri) return;
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
            if (response.body === "ok") {
                socket?.emit('sendAudio', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, fileName: oldMessage?.fileName, duration: oldMessage?.duration, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading file');
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        return;
    };

    const ReSendFile = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            const oldMessage = messages.find(e => e._id === errorId);
            const uri = oldMessage?.file;
            if (!uri) return;
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
            if (response.body === "ok") {
                socket?.emit('sendFile', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, fileName: oldMessage?.fileName, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading file');
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        return;
    };

    const ReSendAudio = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            const oldMessage = messages.find(e => e._id === errorId);
            const uri = oldMessage?.audio;
            if (!uri) return;
            const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
            if (response.body === "ok") {
                socket?.emit('sendAudio', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, roomId, user: oldMessage?.user, fileName: "voice", duration: oldMessage?.duration, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading file');
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        return;
    };

    return { SendImage, SendVideo, SendFile, SendAudio, ReSendImage, ReSendVideo, ReSendMusic, ReSendFile, ReSendAudio }
    //     try {
    //         setMessages(e => e.map(message => {
    //             if (message._id === errorId) {
    //                 return { ...message, availableStatus: availableStatus.uploading }
    //             } else {
    //                 return message;
    //             }
    //         }));
    //         const oldMessage = messages.find(e => e._id === errorId);
    //         const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
    //         if (response.body === "ok") {
    //             socket?.emit('sendAudio', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, image: oldMessage?.image, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
    //                 if (message._id === errorId) {
    //                     return { ...message, availableStatus: availableStatus.available }
    //                 } else {
    //                     return message
    //                 }
    //             })));
    //         } else {
    //             setMessages(e => e.map(message => {
    //                 if (message._id === errorId) {
    //                     return { ...message, availableStatus: availableStatus.error }
    //                 } else {
    //                     return message;
    //                 }
    //             }));
    //             console.log('error uploading file');
    //         }
    //     } catch (error) {
    //         setMessages(e => e.map(message => {
    //             if (message._id === errorId) {
    //                 return { ...message, availableStatus: availableStatus.error }
    //             } else {
    //                 return message;
    //             }
    //         }));
    //         console.error('Error occurred during upload:', error);
    //     };
    //     return;
    // };

    // if (type === 'image' && uri) {
    //     setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, image: uri, mimeType, availableStatus: availableStatus.uploading }]));
    //     try {
    //         const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType });
    //         if (response.body === "ok") {
    //             socket?.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
    //                 if (message._id === id) {
    //                     return { ...message, availableStatus: availableStatus.available }
    //                 } else {
    //                     return message;
    //                 }
    //             })));
    //         } else {
    //             setMessages(e => e.map(message => {
    //                 if (message._id === id) {
    //                     return { ...message, availableStatus: availableStatus.error }
    //                 } else {
    //                     return message;
    //                 }
    //             }));
    //             console.log('Error uploading image: response not ok', response.body);
    //         }
    //     } catch (error) {
    //         setMessages(e => e.map(message => {
    //             if (message._id === id) {
    //                 return { ...message, availableStatus: availableStatus.error }
    //             } else {
    //                 return message;
    //             }
    //         }));
    //         console.error('Error occurred during upload:', error);
    //     }
    // } else if (type === 'video' && uri) {
    //     setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, video: uri, mimeType, availableStatus: availableStatus.uploading }]));
    //     const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType })
    //     if (response.body === "ok") {
    //         socket?.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
    //             if (message._id === id) {
    //                 return { ...message, availableStatus: availableStatus.available }
    //             } else {
    //                 return message
    //             }
    //         })));
    //     } else {
    //         console.log('error uploading video');
    //     }
    // } else if (type === 'file' && uri) {
    //     const isMusic = isMusicFile(name);
    //     if (isMusic) {
    //         const data = await getAudioMetadata(uri, wantedTags).catch(e => console.log(e));
    //         let artwork = data?.metadata.artwork?.replace(/^data:image\/[^;]+;base64,/, '');
    //         if (artwork) {
    //             await ensureDirExists();
    //             await FileSystem.writeAsStringAsync(fileDirectory + `${name}-artwork.jpeg`, artwork, { encoding: "base64" }).then(() => {
    //                 artwork = fileDirectory + `${name}-artwork.jpeg`
    //             }).catch((e) => {
    //                 console.log(e, 'eeeeeeeeeeeeeeee')
    //             })
    //         }
    //         const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    //         // @ts-ignore
    //         setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration: status?.durationMillis / 1000, playing: false, availableStatus: availableStatus.uploading, artwork: artwork?.startsWith('file') ? artwork : undefined, musicArtist: data?.metadata.artist ?? '', musicName: data?.metadata.name ?? name }]));
    //         await sound.unloadAsync();
    //         const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
    //         if (response.body === "ok") {
    //             // @ts-ignore
    //             socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis / 1000, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
    //                 if (message._id === id) {
    //                     return { ...message, availableStatus: availableStatus.available }
    //                 } else {
    //                     return message
    //                 }
    //             })));
    //         } else {
    //             console.log('error uploading music');
    //         }
    //     } else {
    //         setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, file: uri, fileName: name, mimeType, availableStatus: availableStatus.uploading }]));
    //         const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
    //         if (response.body === "ok") {
    //             socket?.emit('sendFile', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
    //                 if (message._id === id) {
    //                     return { ...message, availableStatus: availableStatus.available }
    //                 } else {
    //                     return message
    //                 }
    //             })));
    //         } else {
    //             console.log('error uploading file');
    //         }
    //     }
    // } else if (type === 'audio' && uri) {
    //     setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: name, duration, playing: false, availableStatus: availableStatus.uploading }]));
    //     const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
    //     if (response.body === "ok") {
    //         socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
    //             if (message._id === id) {
    //                 return { ...message, availableStatus: availableStatus.available }
    //             } else {
    //                 return message
    //             }
    //         })));
    //     } else {
    //         console.log('error uploading audio');
    //     }
    // }




    //


    // if (errorId) {
    //     try {
    //         setMessages(e => e.map(message => {
    //             if (message._id === errorId) {
    //                 return { ...message, availableStatus: availableStatus.uploading }
    //             } else {
    //                 return message;
    //             }
    //         }));
    //         const oldMessage = messages.find(e => e._id === errorId);
    //         const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' });
    //         if (response.body === "ok") {
    //             socket?.emit('sendAudio', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, roomId, user: oldMessage?.user, fileName: "voice", duration: oldMessage?.duration, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
    //                 if (message._id === errorId) {
    //                     return { ...message, availableStatus: availableStatus.available }
    //                 } else {
    //                     return message
    //                 }
    //             })));
    //         } else {
    //             setMessages(e => e.map(message => {
    //                 if (message._id === errorId) {
    //                     return { ...message, availableStatus: availableStatus.error }
    //                 } else {
    //                     return message;
    //                 }
    //             }));
    //             console.log('error uploading file');
    //         }
    //     } catch (error) {
    //         setMessages(e => e.map(message => {
    //             if (message._id === errorId) {
    //                 return { ...message, availableStatus: availableStatus.error }
    //             } else {
    //                 return message;
    //             }
    //         }));
    //         console.error('Error occurred during upload:', error);
    //     };
    //     return;
    // };
};
//     try {
//         setMessages(e => e.map(message => {
//             if (message._id === errorId) {
//                 return { ...message, availableStatus: availableStatus.uploading }
//             } else {
//                 return message;
//             }
//         }));
//         const oldMessage = messages.find(e => e._id === errorId);
//         const response = await FileSystem.uploadAsync(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' })
//         if (response.body === "ok") {
//             socket?.emit('sendAudio', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, fileName: name, duration: oldMessage?.duration, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
//                 if (message._id === id) {
//                     return { ...message, availableStatus: availableStatus.available }
//                 } else {
//                     return message
//                 }
//             })));
//         } else {
//             setMessages(e => e.map(message => {
//                 if (message._id === errorId) {
//                     return { ...message, availableStatus: availableStatus.error }
//                 } else {
//                     return message;
//                 }
//             }));
//             console.log('error uploading music');
//         }
//     } catch (error) {
//         setMessages(e => e.map(message => {
//             if (message._id === errorId) {
//                 return { ...message, availableStatus: availableStatus.error }
//             } else {
//                 return message;
//             }
//         }));
//         console.error('Error occurred during upload:', error);
//     };
//     return;
// };