import { useEffect, useState } from "react";
import {io,Socket} from 'socket.io-client';

export const useSocket = () => {
    const [socket,setsocket] = useState<Socket | null>(null);

    useEffect(() => {

        const server = io(import.meta.env.VITE_BACKEND_URL);
        setsocket(server);

        server.on("connect", () => {
            console.log("✅ Connected to WebSocket");
          });
      
          server.on("disconnect", () => {
            console.log("❌ Disconnected from WebSocket");
          });
      
          return () => {
            server.disconnect(); 
          };

    },[])

    return socket;
}