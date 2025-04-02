import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";

interface HomeProp {
  socket: Socket | null;
}

interface track {
  name: string;
  votes: number;
}

const Room: React.FC<HomeProp> = ({ socket }) => {
  const [message, setmessage] = useState("conecting to room");
  const { roomid } = useParams();
  const [tracks, settracks] = useState<track[]>([]);
  const inputref = useRef<HTMLInputElement | null>(null);
  const [voted, setvoted] = useState<string[]>([]);

  const newUserHandler = (message: string) => {
    console.log(message);
    setmessage(message);
  };

  const addtrack = () => {
    socket?.emit("addtrack", {track:inputref.current?.value,roomId:roomid});
    inputref.current!.value = "";
  };

  const upvote = (track:string) => {
    socket?.emit('upvote', {track,roomid});
    setvoted((prev) => [...prev,track]);
  };

  const downvote = (track:string) => {
    socket?.emit('downvote',{track,roomid});
    setvoted((prev) => prev.filter((track) => track!=track));
  };

  const updatetracks = (updatedtracks : track[]) => {
    console.log(updatedtracks);
    settracks(updatedtracks);
  }

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit("joinroom", roomid);

    // Register the handler
    socket.on("newuser", newUserHandler);

    socket.on("queue_updated", updatetracks);

    // Return cleanup function that removes the same handler
    return () => {
      socket.off("newuser", newUserHandler);
      socket.off('queue_updated', updatetracks);
    };
  }, [socket]);

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen">
      {message}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="enter track with tarckid"
          name="trackInput"
          ref={inputref}
        />
        <Button onClick={addtrack}>Add</Button>
      </div>
      <div>
        {tracks.length > 0 &&
          tracks.map((track,index) => (
            <div
              key={index}
              className="flex gap-2 border-2 rounded-sm border-black"
            >
              <div>{track.name}</div>
              <div className="border-2 border-black flex gap-2 items-center">
                {track.votes}{" "}
                {voted.includes(track.name) ? (
                  <ArrowBigDown onClick={() => downvote(track.name)} />
                ) : (
                  <ArrowBigUp onClick={() => upvote(track.name)} />
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Room;
