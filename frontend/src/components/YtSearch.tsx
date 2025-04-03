import React from "react";

interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface VideoData {
  id: string;
  title: string;
  thumbnail: {
    thumbnails: Thumbnail[];
  };
  channelTitle?: string;
  length?: {
    simpleText: string;
  };
}

interface YtSearchProps {
  data: VideoData;
  onSelect: (trackid: string) => void;
}

const YtSearch: React.FC<YtSearchProps> = ({ data, onSelect }) => {
  // Get the first thumbnail (smallest one)
  const thumbnail = data.thumbnail.thumbnails[0];
  
  return (
    <div 
      className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer h-16"
      onClick={() => onSelect(data.id)}
    >
      {/* Thumbnail */}
      <div className="relative h-12 w-20 min-w-[80px] mr-3">
        <img 
          src={thumbnail.url} 
          alt={data.title}
          className="h-full w-full object-cover rounded"
        />
        {data.length && (
          <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-[10px] px-1">
            {data.length.simpleText}
          </div>
        )}
      </div>
      
      {/* Text content */}
      <div className="flex flex-col overflow-hidden">
        <h3 className="text-xs font-medium truncate">
          {data.title}
        </h3>
        {data.channelTitle && (
          <p className="text-[10px] text-gray-500 truncate">
            {data.channelTitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default YtSearch;