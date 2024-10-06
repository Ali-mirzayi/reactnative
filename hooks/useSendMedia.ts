import { ensureDirExists, fileDirectory } from "../utils/directories";
import { getAudioMetadata } from '@missingcore/audio-metadata';
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { formatBytes, generateID, isMusicFile } from "../utils/utils";
import { availableStatus, IMessagePro } from "../utils/types";
import baseURL from "../utils/baseURL";
import { GiftedChat } from "react-native-gifted-chat";
import { useMessage, useSocket, useTransferredProgress, useUser } from "../socketContext";
import sleep from "../utils/wait";

//@ts-ignore
function debounce(func, delay) {
    //@ts-ignore
    let timeoutId;
    //@ts-ignore
    return function (...args) {
        //@ts-ignore
        const context = this;
        //@ts-ignore
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

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
    const { setProgressThrottled, setProgress } = useTransferredProgress();

    const SendImage = async ({ uri, mimeType }: sendImageProps) => {
        if (!uri) return;
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, image: uri, mimeType, availableStatus: availableStatus.uploading }]));
        try {
            let newSize = '0'
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === id);
                    const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === id) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        newSize = `${totalByte} ${format}`;
                        return [...e, { id, size: newSize }];
                    }
                });
            });
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendImage', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, size: newSize, availableStatus: availableStatus.available }
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
                console.log('Error uploading image: response not ok', response?.body);
            };
            setProgress(e => e.filter(r => r.id !== id));
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            setProgress(e => e.filter(r => r.id !== id));
            console.error('Error occurred during upload:', error);
        }
    };

    const SendVideo = async ({ uri, mimeType }: sendVideoProps) => {
        if (!uri) return;
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, video: uri, mimeType, availableStatus: availableStatus.uploading }]));
        try {
            let newSize = '0'
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType, }, ({ totalBytesSent, totalBytesExpectedToSend }: any) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === id);
                    const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === id) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        newSize = `${totalByte} ${format}`;
                        return [...e, { id, size: newSize }];
                    }
                });
            });
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendVideo', { _id: id, text: "", createdAt: new Date(), user, roomId, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, size: newSize, availableStatus: availableStatus.available }
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
                console.log('Error uploading Image: response not ok', response?.body);
            }
            setProgress(e => e.filter(r => r.id !== id));
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
            setProgress(e => e.filter(r => r.id !== id));
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
                let newSize = '0'
                const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                    setProgressThrottled(e => {
                        const existingItem = e.find(item => item.id === id);
                        const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                        if (existingItem) {
                            return e.map(obj => {
                                if (obj.id === id) {
                                    return {
                                        ...obj,
                                        transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                    };
                                } else {
                                    return obj;
                                }
                            });
                        } else {
                            newSize = `${totalByte} ${format}`;
                            return [...e, { id, size: newSize }];
                        }
                    });
                });
                const response = await uploadTask.uploadAsync();
                if (response?.body === "ok") {
                    // @ts-ignore
                    socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis / 1000, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, size: newSize, availableStatus: availableStatus.available }
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
                };
                setProgress(e => e.filter(r => r.id !== id));
            } catch (error) {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.error('Error occurred during upload:', error);
                setProgress(e => e.filter(r => r.id !== id));
            }
        } else {
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, file: uri, fileName: name, mimeType, availableStatus: availableStatus.uploading }]));
            try {
                let newSize = '0'
                const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                    setProgressThrottled(e => {
                        const existingItem = e.find(item => item.id === id);
                        const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                        if (existingItem) {
                            return e.map(obj => {
                                if (obj.id === id) {
                                    return {
                                        ...obj,
                                        transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                    };
                                } else {
                                    return obj;
                                }
                            });
                        } else {
                            newSize = `${totalByte} ${format}`;
                            return [...e, { id, size: newSize }];
                        }
                    });
                });
                const response = await uploadTask.uploadAsync();
                if (response?.body === "ok") {
                    socket?.emit('sendFile', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: name, mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, size: newSize, availableStatus: availableStatus.available }
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
                };
                setProgress(e => e.filter(r => r.id !== id));
            } catch (error) {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.error('Error occurred during upload:', error);
                setProgress(e => e.filter(r => r.id !== id));
            }
        }
    };

    const SendAudio = async ({ uri, duration }: sendAudioProps) => {
        if (!uri) return;
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: "voice", duration, playing: false, availableStatus: availableStatus.uploading }]));
        try {
            let newSize = '0'
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === id);
                    const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === id) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        newSize = `${totalByte} ${format}`;
                        return [...e, { id, size: newSize }];
                    }
                });
            });
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: "voice", duration, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, size: newSize, availableStatus: availableStatus.available }
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
            };
            setProgress(e => e.filter(r => r.id !== id));
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
            setProgress(e => e.filter(r => r.id !== id));
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
            let newSize = '0'
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType: oldMessage.mimeType }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        newSize = `${totalByte} ${format}`;
                        return [...e, { id:errorId, size: newSize }];
                    }
                });
            });
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendImage', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, size: newSize, availableStatus: availableStatus.available }
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
            };
            setProgress(e => e.filter(r => r.id !== errorId));
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
            setProgress(e => e.filter(r => r.id !== errorId));
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
            let newSize = '0'
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType:oldMessage.mimeType, }, ({ totalBytesSent, totalBytesExpectedToSend }: any) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        newSize = `${totalByte} ${format}`;
                        return [...e, { id:errorId, size: newSize }];
                    }
                });
            });
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendVideo', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message,size: newSize, availableStatus: availableStatus.available }
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
            };
            setProgress(e => e.filter(r => r.id !== errorId));
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
            setProgress(e => e.filter(r => r.id !== errorId));
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
            let newSize = '0'
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file' }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        newSize = `${totalByte} ${format}`;
                        return [...e, { id:errorId, size: newSize }];
                    }
                });
            });
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendAudio', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, fileName: oldMessage?.fileName, duration: oldMessage?.duration, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message,size: newSize, availableStatus: availableStatus.available }
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
            };
            setProgress(e => e.filter(r => r.id !== errorId));
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
            setProgress(e => e.filter(r => r.id !== errorId));
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
            let newSize = '0'
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType: oldMessage.mimeType }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        newSize = `${totalByte} ${format}`;
                        return [...e, { id:errorId, size: newSize }];
                    }
                });
            });
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendFile', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, fileName: oldMessage?.fileName, mimeType: oldMessage?.mimeType, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message,size: newSize, availableStatus: availableStatus.available }
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
            };
            setProgress(e => e.filter(r => r.id !== errorId));
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
            setProgress(e => e.filter(r => r.id !== errorId));
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
            let newSize = '0'
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType: oldMessage.mimeType }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { formattedbytes: totalByte, format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        newSize = `${totalByte} ${format}`;
                        return [...e, { id:errorId, size: newSize }];
                    }
                });
            });
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendAudio', { _id: errorId, text: "", createdAt: oldMessage?.createdAt, roomId, user: oldMessage?.user, fileName: "voice", duration: oldMessage?.duration, availableStatus: availableStatus.download }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message,size: newSize, availableStatus: availableStatus.available }
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
            };
            setProgress(e => e.filter(r => r.id !== errorId));
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
            setProgress(e => e.filter(r => r.id !== errorId));
        };
        return;
    };

    return { SendImage, SendVideo, SendFile, SendAudio, ReSendImage, ReSendVideo, ReSendMusic, ReSendFile, ReSendAudio };
}