import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LiveKitRoom, RoomAudioRenderer, useParticipants } from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, PhoneOff, Users, Loader2, Heart, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { linkifyContent, extractUrls } from "@/lib/linkify";
import { LinkPreview } from "@/components/link-preview";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  user: {
    id: string;
    username: string;
    avatar?: string;
    profileImageUrl?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    profileImageUrl?: string;
  };
}

interface PostVoiceChannel {
  id: string;
  postId: string;
  maxSlots: number;
  livekitRoom: string | null;
  isActive: boolean;
  participantCount: number;
  participants: Array<{
    id: string;
    user: {
      id: string;
      username: string;
      avatar?: string;
    };
  }>;
}

interface PostWithVoiceProps {
  post: Post;
}

export function PostWithVoice({ post }: PostWithVoiceProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [connectionData, setConnectionData] = useState<{ token: string; url: string } | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const queryClient = useQueryClient();

  const { data: likedStatus } = useQuery({
    queryKey: ["postLiked", post.id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/liked`);
      if (!res.ok) return { liked: false };
      return res.json();
    },
    enabled: !!user,
  });

  if (likedStatus && likedStatus.liked !== isLiked) {
    setIsLiked(likedStatus.liked);
  }

  const { data: comments, refetch: refetchComments } = useQuery<Comment[]>({
    queryKey: ["postComments", post.id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: commentsOpen,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle like");
      return res.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);
    },
    onError: () => {
      toast.error("Failed to like post");
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const { data: voiceChannel, isLoading: voiceLoading } = useQuery<PostVoiceChannel | null>({
    queryKey: ["postVoiceChannel", post.id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/voice-channel`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: isInCall ? 5000 : 10000,
  });

  const { data: livekitConfig } = useQuery({
    queryKey: ["livekitConfig"],
    queryFn: async () => {
      const res = await fetch("/api/livekit/config");
      return res.json();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!voiceChannel) throw new Error("No voice channel");
      const res = await fetch(`/api/post-voice-channels/${voiceChannel.id}/join`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to join");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setConnectionData({ token: data.token, url: data.url });
      setIsInCall(true);
      queryClient.invalidateQueries({ queryKey: ["postVoiceChannel", post.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!voiceChannel) return;
      await fetch(`/api/post-voice-channels/${voiceChannel.id}/leave`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      setConnectionData(null);
      setIsInCall(false);
      queryClient.invalidateQueries({ queryKey: ["postVoiceChannel", post.id] });
    },
  });

  const handleJoin = () => {
    if (!livekitConfig?.configured) {
      toast.error("Voice chat is not configured");
      return;
    }
    joinMutation.mutate();
  };

  const handleLeave = () => {
    leaveMutation.mutate();
  };

  const isFull = voiceChannel && voiceChannel.participantCount >= voiceChannel.maxSlots;
  const isUserInCall = voiceChannel?.participants?.some(p => p.user.id === user?.id);

  return (
    <div className="bg-card/30 border border-border/50 rounded-xl p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={post.user.profileImageUrl || post.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`} />
          <AvatarFallback>{post.user.username[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <h4 
              className="font-bold hover:text-primary cursor-pointer transition-colors"
              onClick={() => setLocation(`/profile/${post.user.id}`)}
              data-testid={`link-user-${post.user.id}`}
            >
              {post.user.username}
            </h4>
            <span className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-2 text-sm whitespace-pre-wrap break-words leading-relaxed">
            {linkifyContent(post.content)}
          </p>
          
          {extractUrls(post.content).slice(0, 1).map((url) => (
            <LinkPreview key={url} url={url} />
          ))}

          {voiceChannel && voiceChannel.isActive && (
            <Card className={cn(
              "mt-3 transition-all",
              isInCall ? "bg-primary/10 border-primary/30" : "bg-card/50 border-border/50"
            )}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Mic className={cn("w-5 h-5", isInCall ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-medium">Voice Chat</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {voiceChannel.participantCount}/{voiceChannel.maxSlots} slots
                      </p>
                    </div>
                  </div>
                  
                  {voiceChannel.participants && voiceChannel.participants.length > 0 && (
                    <div className="flex -space-x-2">
                      {voiceChannel.participants.slice(0, 5).map((p) => (
                        <Avatar key={p.id} className="w-6 h-6 border-2 border-background">
                          <AvatarImage src={p.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user.username}`} />
                          <AvatarFallback>{p.user.username[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  )}

                  {isInCall || isUserInCall ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleLeave}
                      disabled={leaveMutation.isPending}
                      data-testid={`button-leave-post-voice-${post.id}`}
                    >
                      <PhoneOff className="w-4 h-4 mr-1" />
                      Leave
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleJoin}
                      disabled={!livekitConfig?.configured || joinMutation.isPending || !!isFull}
                      data-testid={`button-join-post-voice-${post.id}`}
                    >
                      {joinMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFull ? (
                        "Full"
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-1" />
                          Join
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {connectionData && isInCall && (
                  <PostVoiceRoom
                    token={connectionData.token}
                    serverUrl={connectionData.url}
                    onDisconnect={handleLeave}
                  />
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8", isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500")}
              onClick={() => user && likeMutation.mutate()}
              disabled={!user || likeMutation.isPending}
              data-testid={`button-like-${post.id}`}
            >
              <Heart className={cn("w-4 h-4 mr-1", isLiked && "fill-current")} />
              {likeCount}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-muted-foreground hover:text-primary"
              onClick={() => setCommentsOpen(true)}
              data-testid={`button-comments-${post.id}`}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.commentCount || 0}
            </Button>
          </div>

          <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 max-h-[50vh] pr-4">
                {comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.user.profileImageUrl || comment.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.username}`} />
                          <AvatarFallback>{comment.user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-sm">{comment.user.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No comments yet</p>
                )}
              </ScrollArea>
              {user && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newComment.trim()) {
                        commentMutation.mutate(newComment.trim());
                      }
                    }}
                    data-testid="input-comment"
                  />
                  <Button
                    size="icon"
                    onClick={() => newComment.trim() && commentMutation.mutate(newComment.trim())}
                    disabled={!newComment.trim() || commentMutation.isPending}
                    data-testid="button-send-comment"
                  >
                    {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

interface PostVoiceRoomProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
}

function PostVoiceRoom({ token, serverUrl, onDisconnect }: PostVoiceRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onDisconnect}
    >
      <RoomAudioRenderer />
      <PostVoiceUI onLeave={onDisconnect} />
    </LiveKitRoom>
  );
}

function PostVoiceUI({ onLeave }: { onLeave: () => void }) {
  const [muted, setMuted] = useState(false);
  const participants = useParticipants();

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-primary font-medium">Connected</p>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant={muted ? "destructive" : "ghost"}
            className="w-7 h-7"
            onClick={() => setMuted(!muted)}
          >
            {muted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-7 h-7 text-destructive hover:text-destructive"
            onClick={onLeave}
          >
            <PhoneOff className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {participants.map((p) => (
          <div
            key={p.identity}
            className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded text-xs"
          >
            <span>{p.name || "Anonymous"}</span>
            {p.isSpeaking && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
          </div>
        ))}
      </div>
    </div>
  );
}
