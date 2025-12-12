import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreatePostWithVoiceProps {
  communityId: string;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
    avatar?: string | null;
  };
}

export function CreatePostWithVoice({ communityId, user }: CreatePostWithVoiceProps) {
  const [content, setContent] = useState("");
  const [enableVoice, setEnableVoice] = useState(false);
  const [maxSlots, setMaxSlots] = useState("4");
  const queryClient = useQueryClient();

  const postMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId,
          content,
        }),
      });
      if (!response.ok) throw new Error("Failed to post");
      const post = await response.json();
      
      if (enableVoice) {
        const voiceResponse = await fetch(`/api/posts/${post.id}/voice-channel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ maxSlots: parseInt(maxSlots) }),
        });
        if (!voiceResponse.ok) {
          console.error("Failed to create voice channel for post");
        }
      }
      
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", communityId] });
      setContent("");
      setEnableVoice(false);
      setMaxSlots("4");
      toast.success(enableVoice ? "Posted with voice channel!" : "Posted successfully!");
    },
    onError: () => {
      toast.error("Failed to create post");
    },
  });

  return (
    <div className="bg-card/30 border border-border/50 rounded-xl p-4">
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src={user.profileImageUrl || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
          <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community... (e.g., 'Meet up tonight at 8pm, need 2 more!')"
            className="bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground resize-none min-h-[60px]"
            data-testid="input-post-content"
          />
          
          <div className={cn(
            "flex flex-wrap items-center gap-4 p-3 rounded-lg border transition-all",
            enableVoice ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/50"
          )}>
            <div className="flex items-center gap-2">
              <Switch
                id="enableVoice"
                checked={enableVoice}
                onCheckedChange={setEnableVoice}
                data-testid="switch-enable-voice"
              />
              <Label htmlFor="enableVoice" className="flex items-center gap-2 cursor-pointer">
                <Mic className={cn("w-4 h-4", enableVoice && "text-primary")} />
                <span className={cn(enableVoice && "text-primary font-medium")}>Voice Channel</span>
              </Label>
            </div>
            
            {enableVoice && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm text-muted-foreground">Max players:</Label>
                <Select value={maxSlots} onValueChange={setMaxSlots}>
                  <SelectTrigger className="w-20 h-8" data-testid="select-max-slots">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => postMutation.mutate()}
              disabled={!content.trim() || postMutation.isPending}
              data-testid="button-submit-post"
            >
              {postMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {enableVoice ? "Post with Voice" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
