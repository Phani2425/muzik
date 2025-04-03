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
import YoutubePlayer from "@/components/YoutubePlayer";
import { extractYoutubeId } from "@/utils/utils";
import useUserStore from "@/zustand/userStore";

interface HomeProp {
  socket: Socket | null;
}

interface track {
  id: string;
  title: string;
  smallThumbnail: string;
  bigThumbnail: string;
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
  const { isSignedIn, user } = useUser();
  const [searchKeyword, setsearchKeyword] = useState("");
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [currentPlayingTrackId, setCurrentPlayingTrackId] = useState<
    string | null
  >(null);
  const { userState, setUserState } = useUserStore();

  const validateUrl = (url: string) => {
    const urlRegex =
      /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

    if (!url.match(urlRegex)) {
      toast("Invalid URL used", {
        description: "Paste a valid Youtube Url to Proceed",
      });
      return;
    }
    return true;
  };

  const handleVideoEnd = () => {
    if (tracks.length > 0) {
      setCurrentPlayingTrackId(tracks[0].id);
    } else {
      setCurrentPlayingTrackId(null);
    }
  };

  useEffect(() => {
    if (socket && currentPlayingTrackId) {
      socket.emit("trackCompleted", {
        track: currentPlayingTrackId,
        roomId: roomid,
      });
    }
  }, [currentPlayingTrackId]);

  const checkAdmin = async () => {
    if (!user) {
      return;
    }
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/rooms/${roomid}/isadmin`
    );
    if (response && response.data.success) {
      if (response.data.data == user?.id) {
        const userObj = {
          id: user.id,
          role: "admin",
        };
        localStorage.setItem("user", JSON.stringify(userObj));
        setUserState(userObj);
      }
    } else {
      return;
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      checkAdmin();
    }
  }, []);

  useEffect(() => {
    if (tracks.length > 0 && !currentPlayingTrackId) {
      setCurrentPlayingTrackId(tracks[0].id);
    }
  }, [tracks]);

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

  useEffect(() => {
    const timeOutid = setTimeout(searchInYoutube, 700);
    return () => {
      clearTimeout(timeOutid);
    };
  }, [searchKeyword]);

  const newUserHandler = (message: string) => {
    setmessage(message);
  };

  const requireAuth = (callback: () => void) => {
    if (isSignedIn) {
      callback();
    } else {
      setShowSignInModal(true);
    }
  };

  const addtrack = (trackId: string = "") => {
    requireAuth(() => {
      setIsAddingTrack(true);

      if (trackId) {
        socket?.emit("addtrack", {
          track: trackId,
          roomId: roomid,
        });
      } else {
        if (inputref.current?.value && validateUrl(inputref.current?.value)) {
          const extractedId = extractYoutubeId(inputref.current?.value);
          socket?.emit("addtrack", {
            track: extractedId,
            roomId: roomid,
          });
          if (inputref.current) inputref.current.value = "";
        } else {
          setIsAddingTrack(false);
        }
      }
    });
  };

  const upvote = (trackId: string) => {
    requireAuth(() => {
      socket?.emit("upvote", { track: trackId, roomid });
      setvoted((prev) => [...prev, trackId]);
    });
  };

  const downvote = (trackId: string) => {
    requireAuth(() => {
      socket?.emit("downvote", { track: trackId, roomid });
      setvoted((prev) => prev.filter((item) => item !== trackId));
    });
  };

  const updatetracks = (updatedtracks: track[]) => {
    setIsAddingTrack(false);
    settracks(updatedtracks);
  };

  const fetchInitialTracks = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/rooms/${roomid}/tracks`
      );
      if (response.data.success) {
        settracks(response.data.tracks);
      }
    } catch (error) {
      console.error("Failed to fetch initial tracks:", error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    fetchInitialTracks();

    socket.emit("joinroom", roomid);
    socket.on("newuser", newUserHandler);
    socket.on("queue_updated", updatetracks);
    socket.on("track_error", () => {
      setIsAddingTrack(false);
      toast.error("Failed to add track");
    });

    return () => {
      socket.off("newuser", newUserHandler);
      socket.off("queue_updated", updatetracks);
      socket.off("track_error");
    };
  }, [socket, roomid]);

  const ytSelectHandler = (tarckId: string) => {
    setsearchKeyword("");
    setSearchResults([]);
    addtrack(tarckId);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
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
              <SignInButton mode="modal">
                <Button className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{message}</h1>
          <div className="text-xl font-semibold text-blue-600">
            Room: {roomid}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {tracks.length > 0 ? (
              currentPlayingTrackId ? (
                <YoutubePlayer
                  currentTrack={
                    tracks.find((t) => t.id === currentPlayingTrackId) ||
                    tracks[0]
                  }
                  onVideoEnd={handleVideoEnd}
                />
              ) : (
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <Loader size={40} className="animate-spin text-blue-500" />
                </div>
              )
            ) : (
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No tracks added yet</p>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="font-semibold text-lg mb-3">Add Track</h2>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter YouTube URL"
                  name="trackInput"
                  ref={inputref}
                  className="flex-grow focus:ring-blue-500"
                />
                <Button
                  onClick={() => addtrack()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="font-semibold text-lg mb-3">Search YouTube</h2>
              <Input
                placeholder="Search videos"
                name="searchInput"
                className="w-full mb-1"
                onChange={(e) => setsearchKeyword(e.target.value)}
                value={searchKeyword}
              />
              <div className="h-[150px] overflow-y-auto">
                {isSearching ? (
                  <div className="flex justify-center py-4">
                    <Loader size={25} className="animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <YtSearch
                        onSelect={ytSelectHandler}
                        key={index}
                        data={result}
                      />
                    ))}
                  </div>
                ) : searchKeyword ? (
                  <p className="text-center text-gray-500 py-4">
                    No results found
                  </p>
                ) : null}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="font-semibold text-lg mb-3">Queue</h2>
              <div className="h-[300px] overflow-y-auto space-y-2">
                {tracks.length > 0 ? (
                  tracks.map((track, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                    >
                      <div className="flex items-center">
                        <img
                          src={track.smallThumbnail}
                          alt={track.title}
                          className="h-12 w-20 object-cover rounded mr-2"
                        />
                        <div className="text-sm line-clamp-2 max-w-[180px]">
                          {track.title}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <span className="font-bold text-sm">{track.votes}</span>
                        {voted.includes(track.id) ? (
                          <button
                            onClick={() => downvote(track.id)}
                            className="p-1 rounded-full hover:bg-gray-200"
                          >
                            <ArrowBigDown className="text-red-500 h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => upvote(track.id)}
                            className="p-1 rounded-full hover:bg-gray-200"
                          >
                            <ArrowBigUp className="text-green-500 h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Queue is empty
                  </div>
                )}
                {isAddingTrack && (
                  <div className="flex justify-center py-4">
                    <Loader className="animate-spin text-blue-600" size={20} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
