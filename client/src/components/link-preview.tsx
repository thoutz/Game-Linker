import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ExternalLink, Play, Loader2 } from "lucide-react";
import { isYouTubeUrl, getYouTubeVideoId } from "@/lib/linkify";

interface LinkPreviewProps {
  url: string;
}

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const isYouTube = isYouTubeUrl(url);
  const videoId = isYouTube ? getYouTubeVideoId(url) : null;

  const { data: metadata, isLoading } = useQuery<LinkMetadata>({
    queryKey: ["linkPreview", url],
    queryFn: async () => {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Failed to fetch preview");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="mt-3 p-3 bg-card/50 border-border/50 animate-pulse">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading preview...</span>
        </div>
      </Card>
    );
  }

  if (isYouTube && videoId) {
    return (
      <Card className="mt-3 overflow-hidden bg-card/50 border-border/50">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative aspect-video bg-black/20">
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt={metadata?.title || "YouTube video"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
          </div>
          <div className="p-3">
            <p className="font-medium text-sm line-clamp-2">{metadata?.title || "YouTube Video"}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              youtube.com
            </p>
          </div>
        </a>
      </Card>
    );
  }

  if (!metadata) {
    return (
      <Card className="mt-3 p-3 bg-card/50 border-border/50">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary hover:underline text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          <span className="break-all line-clamp-1">{url}</span>
        </a>
      </Card>
    );
  }

  return (
    <Card className="mt-3 overflow-hidden bg-card/50 border-border/50 hover:bg-card/70 transition-colors">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {metadata.image && (
          <div className="sm:w-32 sm:h-24 w-full h-40 flex-shrink-0 bg-black/10">
            <img
              src={metadata.image}
              alt={metadata.title || "Preview"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="p-3 flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-2">{metadata.title || url}</p>
          {metadata.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{metadata.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{metadata.siteName || new URL(url).hostname}</span>
          </p>
        </div>
      </a>
    </Card>
  );
}
