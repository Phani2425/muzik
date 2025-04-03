import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { ArrowBigDown, ArrowBigUp, Loader, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import axios from "axios";
import YtSearch from "@/components/YtSearch";
import { extractYoutubeId } from "@/utils/utils";

interface HomeProp {
  socket: Socket | null;
}

interface track {
  name: string;
  votes: number;
}

const Room: React.FC<HomeProp> = ({ socket }) => {
  const [message, setmessage] = useState("connecting to room");
  const { roomid } = useParams();
  const [tracks, settracks] = useState<track[]>([]);
  const inputref = useRef<HTMLInputElement | null>(null);
  const [voted, setvoted] = useState<string[]>([]);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { isSignedIn } = useUser();
  const [searchKeyword, setsearchKeyword] = useState("");

  const validateUrl = (url: string) => {
    const urlRegex =
      /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

    if (url.match(urlRegex)) {
      toast("Invalid URL used", {
        description: "Paste a valid Youtube Url to Proceed",
      });
      return;
    }
    return true;
  };

  const searchInYoutube = async () => {
    try {
      const query = searchKeyword.trim();
      if (query.length > 0) {
        setIsSearching(true);
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/search/keyword`,
          {
            keyword: query,
          }
        );
        console.log(response.data.data.items.slice(1));
        setSearchResults(response.data.data.items.slice(1) || []);
        setIsSearching(false);
      } else {
        return;
      }
    } catch (err) {
      setIsSearching(false);
      console.error("Error searching YouTube:", err);
      toast.error("Failed to search YouTube");
    }
  };

  //applying debounciing
  useEffect(() => {
    const timeOutid = setTimeout(searchInYoutube, 1000);

    return () => {
      clearTimeout(timeOutid);
    };
  }, [searchKeyword]);

  const newUserHandler = (message: string) => {
    console.log(message);
    setmessage(message);
  };

  const requireAuth = (callback: () => void) => {
    if (isSignedIn) {
      callback();
    } else {
      setShowSignInModal(true);
    }
  };

  const addtrack = (tarckId: string = "") => {
    requireAuth(() => {
      //agar track id aya hai then to bhai ame direct socket event emit karidaba
      if (tarckId) {
        socket?.emit("addtrack", {
          track: tarckId,
          roomid: roomid,
        });
      }

      //au jadi asini the ta bhai ame chcek kariba ki inputref re kichi value achi na nahi,inputre re thiba url valid yt url ki nahi
      //au chekc kala pare se url ru id extarct kariba
      else {
        if (inputref.current?.value && validateUrl(inputref.current?.value)) {
          const trackId = extractYoutubeId(inputref.current?.value);
          socket?.emit("addtrack", {
            track: trackId,
            roomId: roomid,
          });
          if (inputref.current) inputref.current.value = "";
        }
      }
    });
  };

  const upvote = (track: string) => {
    requireAuth(() => {
      socket?.emit("upvote", { track, roomid });
      setvoted((prev) => [...prev, track]);
    });
  };

  const downvote = (trackName: string) => {
    requireAuth(() => {
      socket?.emit("downvote", { track: trackName, roomid });
      setvoted((prev) => prev.filter((item) => item !== trackName));
    });
  };

  const updatetracks = (updatedtracks: track[]) => {
    console.log(updatedtracks);
    settracks(updatedtracks);
  };

  useEffect(() => {
    if (!socket) return;

    socket.emit("joinroom", roomid);
    socket.on("newuser", newUserHandler);
    socket.on("queue_updated", updatetracks);

    return () => {
      socket.off("newuser", newUserHandler);
      socket.off("queue_updated", updatetracks);
    };
  }, [socket]);

  const ytSelectHandler = (tarckId: string) => {
    setsearchKeyword("");
    setSearchResults([]);
    addtrack(tarckId);
  };

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-gray-100">
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Sign in required
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSignInModal(false)}
                className="rounded-full h-8 w-8"
              >
                <X size={20} />
              </Button>
            </div>
            <p className="text-gray-600 mb-8">
              You need to sign in to interact with tracks in this room
            </p>
            <div className="flex justify-center">
              <SignInButton mode="modal" afterSignInUrl={window.location.href}>
                <Button className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">{message}</h1>

      <div className="flex gap-4">
        <div className="flex gap-3 items-center bg-white p-4 rounded-lg shadow-md mb-6 w-full max-w-md">
          <Input
            placeholder="Enter track name or ID"
            name="trackInput"
            ref={inputref}
            className="flex-grow focus:ring-blue-500"
          />
          <Button
            onClick={() => addtrack()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Track
          </Button>
        </div>

        <div className="flex flex-col gap-3 items-center bg-white p-4 rounded-lg shadow-md mb-6 w-full max-w-md">
          <Input
            placeholder="Search videos on Youtube"
            name="searchInput"
            className="flex-grow focus:ring-blue-500"
            onChange={(e) => setsearchKeyword(e.target.value)}
            value={searchKeyword}
          />
          <div className="flex flex-col gap-1">
            {isSearching ? (
              <Loader size={25} className="animate-spin" />
            ) : (
              searchResults.length > 0 && (
                <div className="flex flex-col gap-2 overflow-y-scroll h-[300px] w-[450px]">
                  {searchResults.map((result, index) => (
                    <YtSearch
                      onSelect={ytSelectHandler}
                      key={index}
                      data={result}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-3">
        {tracks.length > 0 ? (
          tracks.map((track, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md"
            >
              <div className="font-medium text-gray-800">{track.name}</div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-bold">{track.votes}</span>
                {voted.includes(track.name) ? (
                  <button
                    onClick={() => downvote(track.name)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <ArrowBigDown className="text-red-500" />
                  </button>
                ) : (
                  <button
                    onClick={() => upvote(track.name)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <ArrowBigUp className="text-green-500" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No tracks added yet. Be the first to add one!
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
