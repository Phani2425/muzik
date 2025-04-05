import { SignInButton, useUser } from "@clerk/clerk-react";
import { Copy, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

interface JoinRoomProps {
  socket: Socket | null;
}

const JoinRoom = ({ socket }: JoinRoomProps) => {
  const [roomId, setRoomId] = useState<string>("");
  const [generatedRoomId, setGeneratedRoomId] = useState<string>("");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState<boolean>(false);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  const generateRoomId = () => {
    const generateGroup = () => {
      return Array(4)
        .fill(0)
        .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
        .join("");
    };

    return `${generateGroup()} ${generateGroup()} ${generateGroup()} ${generateGroup()}`;
  };

  const createRoom = () => {
    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }
    
    setCreatingRoom(true);
    const newRoomId = generateRoomId();
    setGeneratedRoomId(newRoomId);
    setRoomId(newRoomId);
    
    if (socket) {
      socket.emit("createRoom", {
        roomId: newRoomId,
        userId: user?.id,
        userName: user?.fullName || user?.username,
      });
    }
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    } else {
      toast("Please enter a room code");
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    socket.on("roomCreated", () => {
      setCreatingRoom(false);
      toast("Room creation successful", {
        description: "Enjoy jamming and streaming..🤗",
      });
      navigate(`/room/${generatedRoomId}`);
    });
    
    socket.on("roomCreationFailed", () => {
      setCreatingRoom(false);
      toast("Failed to create room", {
        description: "Please try again",
      });
    });

    return () => {
      socket.off("roomCreated");
      socket.off("roomCreationFailed");
    };
  }, [socket, generatedRoomId, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-gray-500">You need to sign in to create a room</p>
              <div className="flex justify-between">
                <SignInButton mode="modal" afterSignInUrl={window.location.href}>
                  <Button>Sign In</Button>
                </SignInButton>
                <Button variant="outline" onClick={() => setShowSignInModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Muzik Room</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Create Room Section */}
          <div className="space-y-4">
            <Button 
              onClick={createRoom} 
              disabled={creatingRoom}
              className="w-full py-6"
              size="lg"
            >
              {creatingRoom ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Creating Room...</span>
                </div>
              ) : (
                <span className="text-lg">Create New Room</span>
              )}
            </Button>
            
            {generatedRoomId && (
              <div className="bg-gray-100 p-3 rounded-md flex items-center justify-between">
                <div className="font-mono text-sm tracking-wider">
                  {generatedRoomId}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedRoomId);
                    toast("Room code copied to clipboard");
                  }}
                >
                  <Copy size={18} />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-gray-500 text-sm">OR</span>
            <Separator className="flex-1" />
          </div>
          
          {/* Join Room Section */}
          <div className="space-y-4">
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room code to join"
              className="w-full py-6 text-center"
            />
            <Button 
              onClick={joinRoom} 
              className="w-full"
              variant="outline"
            >
              Join Existing Room
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoom;