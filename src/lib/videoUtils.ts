// Utility functions for handling video links and thumbnails

export interface VideoInfo {
  platform: "youtube" | "vimeo" | "tiktok" | "instagram" | "twitter" | "unknown";
  videoId: string | null;
  thumbnailUrl: string | null;
  embedUrl: string | null;
}

// Extract video ID and generate thumbnail URL from various platforms
export const extractVideoInfo = (url: string): VideoInfo => {
  const trimmedUrl = url.trim();

  // YouTube
  const youtubeMatch = trimmedUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      platform: "youtube",
      videoId,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  // Vimeo
  const vimeoMatch = trimmedUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      platform: "vimeo",
      videoId,
      thumbnailUrl: null, // Vimeo requires API call for thumbnails
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
    };
  }

  // TikTok
  const tiktokMatch = trimmedUrl.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (tiktokMatch) {
    return {
      platform: "tiktok",
      videoId: tiktokMatch[1],
      thumbnailUrl: null, // TikTok doesn't provide static thumbnails
      embedUrl: null,
    };
  }

  // Instagram
  const instagramMatch = trimmedUrl.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
  if (instagramMatch) {
    return {
      platform: "instagram",
      videoId: instagramMatch[1],
      thumbnailUrl: null,
      embedUrl: null,
    };
  }

  // Twitter/X
  const twitterMatch = trimmedUrl.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  if (twitterMatch) {
    return {
      platform: "twitter",
      videoId: twitterMatch[1],
      thumbnailUrl: null,
      embedUrl: null,
    };
  }

  return {
    platform: "unknown",
    videoId: null,
    thumbnailUrl: null,
    embedUrl: null,
  };
};

// Check if a URL is a video link
export const isVideoUrl = (url: string): boolean => {
  const videoPatterns = [
    /youtube\.com\/watch\?v=/i,
    /youtu\.be\//i,
    /youtube\.com\/shorts\//i,
    /vimeo\.com\/\d+/i,
    /tiktok\.com\/@[\w.-]+\/video\//i,
    /instagram\.com\/(?:p|reel)\//i,
    /(?:twitter\.com|x\.com)\/\w+\/status\//i,
  ];

  return videoPatterns.some((pattern) => pattern.test(url));
};

// Get platform display name
export const getPlatformName = (platform: VideoInfo["platform"]): string => {
  const names: Record<VideoInfo["platform"], string> = {
    youtube: "YouTube",
    vimeo: "Vimeo",
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "Twitter/X",
    unknown: "Video",
  };
  return names[platform];
};

// Get platform icon/color
export const getPlatformColor = (platform: VideoInfo["platform"]): string => {
  const colors: Record<VideoInfo["platform"], string> = {
    youtube: "#FF0000",
    vimeo: "#1AB7EA",
    tiktok: "#000000",
    instagram: "#E4405F",
    twitter: "#1DA1F2",
    unknown: "#6B7280",
  };
  return colors[platform];
};
