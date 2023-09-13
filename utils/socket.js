import {io} from "socket.io-client";
import baseURL from "./baseURL";

// const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
const socket = io.connect(baseURL());
// const socket:Socket<any, any> = io();
// const ok = socket.connect(baseURL)

export default socket;

// export const socket = io("https://0d49-94-182-217-206.ngrok-free.app");