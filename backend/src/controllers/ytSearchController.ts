import { Request, Response } from "express";
// @ts-expect-error no types availale for the package
import youtubesearchapi from "youtube-search-api";

export const searchOnYoutubeByKeyword = async (
  req: Request,
  resp: Response
) => {
  try {
    const { keyword } = req.body;
    if (!keyword) {
      return resp.status(400).json({
        success: false,
        message: "keyword not provided for search",
      });
    }
    const result = await youtubesearchapi.GetListByKeyword(keyword);
    if (result) {
      // console.log(result);
      return resp.status(200).json({
        success: true,
        message: "found yt lists",
        data: result,
      });
    }

    return resp.status(500).json({
      success: false,
      message: "could not found any thing",
    });
  } catch (err) {
    if (err instanceof Error) {
      console.log(
        "error occured while fetching results from youtube",
        err.message
      );

      return resp.status(500).json({
        success: false,
        messge: `error occured while geting data from youtube ${err.message}`,
      });
    } else {
      console.log(
        "unknown error occured while fetching data from youtube",
        err
      );

      return resp.status(500).json({
        success: false,
        messge: `error occured while geting data from youtube ${err}`,
      });
    }
  }
};
export const searchonYtById = async (trackId: string) => {
  try {
    if (!trackId) {
      throw new Error("Track ID is required");
    }

    const videoDetails = await youtubesearchapi.GetVideoDetails(trackId);

    if (!videoDetails) {
      throw new Error("Failed to fetch video details");
    }

    let smallThumbnail = "";
    let bigThumbnail = "";

    if (
      videoDetails.thumbnail &&
      Array.isArray(videoDetails.thumbnail.thumbnails) &&
      videoDetails.thumbnail.thumbnails.length > 0
    ) {
      const thumbnails = videoDetails.thumbnail.thumbnails;
      bigThumbnail = thumbnails[thumbnails.length - 1]?.url || "";

      smallThumbnail =
        thumbnails.length > 1
          ? thumbnails[thumbnails.length - 2]?.url || ""
          : bigThumbnail;
    }

    const data = {
      id: videoDetails.id || trackId,
      title: videoDetails.title || "Unknown Title",
      smallThumbnail,
      bigThumbnail,
    };

    console.log(data);

    return data;
  } catch (err) {
    if (err instanceof Error) {
      console.error(
        `Error fetching video details for ID ${trackId}: ${err.message}`
      );
    } else {
      console.error(
        `Unknown error fetching video details for ID ${trackId}`,
        err
      );
    }
    return {
      id: trackId,
      title: "Error fetching video",
      smallThumbnail: "",
      bigThumbnail: "",
    };
  }
};

// searchonYtById("Ue5bOpVswIo");
