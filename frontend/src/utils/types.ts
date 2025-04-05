import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";

export interface Track {
  id: string;
  title: string;
  smallThumbnail: string;
  bigThumbnail: string;
  votes: number;
}

export interface CurrentPlayerState {
  roomId: string;
  currTrack: number;
  timeStamp: string;
  lastUpdated: number
}

export interface YoutubePlayerProps {
  currentTrack: Track;
  onVideoEnd: () => void;
  socket: Socket | null;
  roomId: string;
  currentPlayerState: CurrentPlayerState | null;
  setcurrentPlyerState: Dispatch<SetStateAction<CurrentPlayerState | null>>;
}
