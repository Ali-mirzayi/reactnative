import React, { createContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { User } from './utils/types';

export const socketContext = createContext({});

export default function Context({ children }:any) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [user, setUser] = useState<User | undefined>();

    useEffect(() => {
		// Connect to the Socket.IO server
		const newSocket = io("http://10.0.2.2:4000");
		setSocket(newSocket);
		// Clean up on component unmount
		return () => {
			newSocket.disconnect();
		};
	}, []);

    return <socketContext.Provider value={{socket,user, setUser}}>
            {children}
    </socketContext.Provider>
}