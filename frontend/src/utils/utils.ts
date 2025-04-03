/**
 * Extracts the YouTube video ID from various URL formats
 * @param url The YouTube URL to extract ID from
 * @returns The video ID or null if no valid ID found
 */
export const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;

  // Handle various YouTube URL formats
  const patterns = [
    // youtu.be URLs (short format)
    /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,

    // youtube.com/watch URLs with v parameter
    /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,

    // youtube.com/embed URLs
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,

    // youtube.com/v URLs
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,

    // youtube.com/shorts URLs
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If no matches found
  return null;
};

// console.log(
//   "youtube id extracted:- ",
//   extractYoutubeId("https://www.youtube.com/watch?v=GhH1QWY6BDc&t=16200s")
// );
