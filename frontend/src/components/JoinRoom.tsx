import { Input } from "@/components/ui/input";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { Copy, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface JoinRoomProps {
  socket: Socket | null;
}

const JoinRoom = ({ socket }: JoinRoomProps) => {
  const createInputRef = useRef<HTMLInputElement>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const [creatingRoom, setcreatingRoom] = useState<boolean>(false);

  const createRoom = () => {
    // Check if user is signed in
    setcreatingRoom(true);
    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }

    if (socket) {
      socket.emit("createRoom", {
        roomId: roomId,
        userId: user?.id,
        userName: user?.fullName || user?.username,
      });
    }
  };

  const createRoomId = () => {
    const generateGroup = () => {
      return Array(4)
        .fill(0)
        .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))) // Using uppercase (ASCII 65-90)
        .join("");
    };

    const roomid = `${generateGroup()} ${generateGroup()} ${generateGroup()} ${generateGroup()}`;

    if (createInputRef.current) {
      createInputRef.current.value = roomid;
    }
    setRoomId(roomid);
  };

  const joinRoom = () => {
    navigate(`/room/${roomId}`);
  };

  useEffect(() => {
    if (!socket) return;
    
    socket?.on("roomCreated", () => {
      setcreatingRoom(false);
      toast("Room creation successfull", {
        description: "Enjoy jamming and streaming..🤗",
      });
      joinRoom();
    });
    socket?.on("roomCreationFailed", () => {
      setcreatingRoom(false);
      toast("failed to create Room", {
        description: "try again with different code",
      });
    });

    return () => {
      socket?.off("roomCreated");
      socket?.off("roomCreationFailed");
    };
  }, [socket,roomId]);

  return (
    <div className="flex flex-col gap-6 h-screen w-screen justify-center items-center">
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Sign in required</h2>
            <p className="mb-6">You need to sign in to create a room</p>
            <div className="flex justify-center">
              <SignInButton mode="modal" afterSignInUrl={window.location.href}>
                <Button>Sign In</Button>
              </SignInButton>
            </div>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setShowSignInModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-between gap-3 border-2 border-gray-200 px-1 py-1 rounded-lg">
          <Input
            ref={createInputRef}
            type="text"
            placeholder="Generate unique code"
            readOnly
            className="text-black px-5 border-none font-semibold text-xl placeholder:text-md focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0"
          />
          <Button
            variant={"ghost"}
            onClick={() => {
              if (
                createInputRef.current &&
                createInputRef.current.value.trim() != ""
              ) {
                navigator.clipboard.writeText(createInputRef.current.value);
              }
            }}
            className="cursor-pointer font-semibold"
          >
            <Copy size={24} />
          </Button>
        </div>
        <Button onClick={createRoomId} className="px-3 py-5.5">
          Generate Room Id
        </Button>
      </div>
      <Button
        onClick={createRoom}
        disabled={creatingRoom}
        className="w-xs px-3 py-4"
      >
        {creatingRoom ? (
          <Loader2 size={23} className="animate-spin" />
        ) : (
          <span>Create Room</span>
        )}
      </Button>
      <div className="flex items-center gap-3">
        <Input
          onChange={(e) => setRoomId(e.target.value)}
          className="focus:shadow-none focus-visible:ring-0"
        />
        <Button onClick={joinRoom}>Join Room</Button>
      </div>
    </div>
  );
};

export default JoinRoom;
