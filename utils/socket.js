import {io} from "socket.io-client";
import baseURL from "./baseURL";

const socket = io.connect(baseURL());
// console.log(socket,'as');

export default socket;