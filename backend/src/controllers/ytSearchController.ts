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
