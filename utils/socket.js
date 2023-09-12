import io from "socket.io-client";
import baseURL from "./baseURL";

const socket = io.connect(baseURL);
export default socket;