import { io } from "socket.io-client";

let socket;

export const initSocket = (token) => {
  if (!socket) {
    socket = io("http://192.168.100.196:3000", {
      //   secure: false,
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket"],
      auth: {
        token: token,
      },
    });

    socket.on("connect", () => {
      console.log("Connected to socket server.");
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
    });

    socket.on("error", (error) => {
      console.log("Error:", error);
    });
  }
  return socket;
};

export const likeDislike = (user_id, action) => {
  if (socket) {
    socket.emit("likeDislike", { user_id, action });
  }
};

export const onNewMessage = (callback) => {
  if (socket) {
    socket.on("likeDislikeError", (msg) => {
      callback(msg);
    });

    socket.on("likeDislike", (msg) => {
      callback(msg);
    });
  }
};
