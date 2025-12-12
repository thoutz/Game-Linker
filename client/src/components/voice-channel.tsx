import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LiveKitRoom, RoomAudioRenderer, useParticipants, useTracks } from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, PhoneOff, Volume2, Users, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceChannel {
  id: string;
  name: string;
  maxParticipants: number;
  participantCount: number;
  livekitRoom: string | null;
}

interface VoiceChannelListProps {
  communityId: string;
  isMember: boolean;
}

export function VoiceChannelList({ communityId, isMember }: VoiceChannelListProps) {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [connectionData, setConnectionData] = useState<{ token: string; url: string } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const queryClient = useQueryClient();

  const { data: channels, isLoading } = useQuery<VoiceChannel[]>({
    queryKey: ["voiceChannels", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/voice-channels`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: livekitConfig } = useQuery({
    queryKey: ["livekitConfig"],
    queryFn: async () => {
      const res = await fetch("/api/livekit/config");
      return res.json();
    },
  });

  const joinChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch(`/api/voice-channels/${channelId}/join`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to join channel");
      }
      return res.json();
    },
    onSuccess: (data, channelId) => {
      setConnectionData({ token: data.token, url: data.url });
      setActiveChannel(channelId);
      queryClient.invalidateQueries({ queryKey: ["voiceChannels", communityId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const leaveChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await fetch(`/api/voice-channels/${channelId}/leave`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      setConnectionData(null);
      setActiveChannel(null);
      queryClient.invalidateQueries({ queryKey: ["voiceChannels", communityId] });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/communities/${communityId}/voice-channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, maxParticipants: 10 }),
      });
      if (!res.ok) throw new Error("Failed to create channel");
      return res.json();
    },
    onSuccess: () => {
      setCreateDialogOpen(false);
      setNewChannelName("");
      queryClient.invalidateQueries({ queryKey: ["voiceChannels", communityId] });
      toast.success("Voice channel created!");
    },
    onError: () => {
      toast.error("Failed to create voice channel");
    },
  });

  const handleJoin = (channelId: string) => {
    if (!livekitConfig?.configured) {
      toast.error("Voice chat is not configured. Please set up LiveKit credentials.");
      return;
    }
    joinChannelMutation.mutate(channelId);
  };

  const handleLeave = () => {
    if (activeChannel) {
      leaveChannelMutation.mutate(activeChannel);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-card/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          Voice Channels
        </h3>
        {isMember && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="button-create-voice-channel">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Voice Channel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="channelName">Channel Name</Label>
                  <Input
                    id="channelName"
                    placeholder="General Voice"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    data-testid="input-channel-name"
                  />
                </div>
              </div>
              <Button
                onClick={() => createChannelMutation.mutate(newChannelName)}
                disabled={!newChannelName.trim() || createChannelMutation.isPending}
                data-testid="button-confirm-create-channel"
              >
                {createChannelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Channel
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!livekitConfig?.configured && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-sm text-yellow-200">
            Voice channels require LiveKit configuration. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL to enable.
          </CardContent>
        </Card>
      )}

      {channels && channels.length > 0 ? (
        <div className="space-y-2">
          {channels.map((channel) => (
            <Card
              key={channel.id}
              className={cn(
                "bg-card/40 border-border/50 transition-all",
                activeChannel === channel.id && "border-primary bg-primary/10"
              )}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className={cn("w-5 h-5", activeChannel === channel.id ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {channel.participantCount}/{channel.maxParticipants}
                    </p>
                  </div>
                </div>
                {activeChannel === channel.id ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleLeave}
                    disabled={leaveChannelMutation.isPending}
                    data-testid={`button-leave-channel-${channel.id}`}
                  >
                    <PhoneOff className="w-4 h-4 mr-1" />
                    Leave
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleJoin(channel.id)}
                    disabled={
                      !livekitConfig?.configured ||
                      joinChannelMutation.isPending ||
                      channel.participantCount >= channel.maxParticipants
                    }
                    data-testid={`button-join-channel-${channel.id}`}
                  >
                    {joinChannelMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : channel.participantCount >= channel.maxParticipants ? (
                      "Full"
                    ) : (
                      "Join"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/20 border-dashed border-2 border-border/50">
          <CardContent className="p-6 text-center">
            <Volume2 className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No voice channels yet</p>
            {isMember && <p className="text-xs text-muted-foreground mt-1">Create one to start talking!</p>}
          </CardContent>
        </Card>
      )}

      {connectionData && activeChannel && (
        <VoiceRoom
          token={connectionData.token}
          serverUrl={connectionData.url}
          onDisconnect={handleLeave}
        />
      )}
    </div>
  );
}

interface VoiceRoomProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
}

function VoiceRoom({ token, serverUrl, onDisconnect }: VoiceRoomProps) {
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
      <VoiceRoomUI onLeave={onDisconnect} />
    </LiveKitRoom>
  );
}

function VoiceRoomUI({ onLeave }: { onLeave: () => void }) {
  const [muted, setMuted] = useState(false);
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Microphone]);

  const toggleMute = () => {
    setMuted(!muted);
  };

  return (
    <Card className="bg-card/60 border-primary/30 mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-primary">Connected to voice</p>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant={muted ? "destructive" : "secondary"}
              onClick={toggleMute}
              data-testid="button-toggle-mute"
            >
              {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={onLeave}
              data-testid="button-disconnect"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {participants.map((participant) => (
            <div
              key={participant.identity}
              className="flex items-center gap-2 bg-background/50 px-3 py-2 rounded-lg"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`} />
                <AvatarFallback>{participant.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{participant.name || "Anonymous"}</span>
              {participant.isSpeaking && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
