import { useState } from "react";
import { extractVideoInfo, getPlatformName, isVideoUrl } from "@/lib/videoUtils";
import { Play, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoEmbedProps {
  url: string;
  className?: string;
  showInline?: boolean;
}

export const VideoEmbed = ({ url, className, showInline = true }: VideoEmbedProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoInfo = extractVideoInfo(url);

  if (!isVideoUrl(url)) {
    return null;
  }

  const canEmbed = videoInfo.embedUrl && (videoInfo.platform === "youtube" || videoInfo.platform === "vimeo");

  const handlePlay = () => {
    if (canEmbed && showInline) {
      setIsPlaying(true);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
  };

  // Inline embed player
  if (isPlaying && canEmbed) {
    return (
      <div className={cn("relative aspect-video bg-black rounded-lg overflow-hidden", className)}>
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <iframe
          src={`${videoInfo.embedUrl}?autoplay=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video player"
        />
      </div>
    );
  }

  // Thumbnail view
  return (
    <div 
      className={cn("relative aspect-video bg-muted cursor-pointer group rounded-lg overflow-hidden", className)}
      onClick={handlePlay}
    >
      {videoInfo.thumbnailUrl ? (
        <img
          src={videoInfo.thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src.includes("maxresdefault")) {
              target.src = target.src.replace("maxresdefault", "hqdefault");
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
          <div className="text-center">
            <Play className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{getPlatformName(videoInfo.platform)}</p>
          </div>
        </div>
      )}
      
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-8 h-8 text-black ml-1" />
        </div>
      </div>
      
      {/* Platform badge */}
      <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
        {canEmbed && showInline ? (
          <Play className="w-3 h-3" />
        ) : (
          <ExternalLink className="w-3 h-3" />
        )}
        {getPlatformName(videoInfo.platform)}
      </div>

      {/* Inline play hint */}
      {canEmbed && showInline && (
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
          Click to play
        </div>
      )}
    </div>
  );
};