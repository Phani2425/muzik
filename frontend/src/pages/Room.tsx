import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";

interface HomeProp {
  socket:Socket | null
}

const Room:React.FC<HomeProp> = ({ socket }) => {
  const [message, setmessage] = useState("conecting to room");
  const {roomid} = useParams();

  const newUserHandler = (message: string) => {
    console.log(message);
    setmessage(message);
  };

  useEffect(() => {
    if(!socket){
      return;
    }

    socket.emit('joinroom',roomid);

    // Register the handler
    socket.on("newuser", newUserHandler);

    // Return cleanup function that removes the same handler
    return () => {
      socket.off('newuser', newUserHandler);
    }
  }, [socket]);

  return (
    <div className="flex items-center justify-center w-screen h-screen">
      {message}
    </div>
  );
};

export default Room;
