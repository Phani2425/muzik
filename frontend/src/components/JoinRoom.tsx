import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Clipboard } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoom = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [roomId,setRoomId] = useState<string>("");
  const navigate = useNavigate();

  const createRoomId = () => {
    const roomid = uuidv4();
    if (inputRef.current) {
      inputRef.current.value = roomid;
    }
  };

  const joinRoom = () => {
     navigate(`/room/${roomId}`);
  }

  return (
    <div className="flex flex-col gap-6 h-screen w-screen justify-center items-center">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Generate unique code"
          />
          <Clipboard
            onClick={() => {
              if (inputRef.current) {
                navigator.clipboard.writeText(inputRef.current.value);
              } else {
                return;
              }
            }}
            className="absolute right-0.5"
          />
        </div>
        <Button onClick={createRoomId}>Create Room</Button>
      </div>
      <div className="flex items-center gap-3">
        <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
        <Button onClick={joinRoom}>Join Room</Button>
      </div>
    </div>
  );
};

export default JoinRoom;
