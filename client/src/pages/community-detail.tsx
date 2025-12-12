import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout";
import { VoiceChannelList } from "@/components/voice-channel";
import { CreatePostWithVoice } from "@/components/create-post-with-voice";
import { PostWithVoice } from "@/components/post-with-voice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Lock, MessageSquare, Calendar, Hash, Volume2 } from "lucide-react";
import { toast } from "sonner";

export default function CommunityDetail({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: community, isLoading: communityLoading } = useQuery({
    queryKey: ["community", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${params.id}`);
      if (!response.ok) throw new Error("Community not found");
      return response.json();
    },
  });

  const { data: isMember } = useQuery({
    queryKey: ["membership", params.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const response = await fetch(`/api/communities/${params.id}/is-member/${user.id}`);
      const data = await response.json();
      return data.isMember;
    },
    enabled: !!user?.id,
  });

  const { data: posts } = useQuery({
    queryKey: ["posts", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${params.id}/posts`);
      return response.json();
    },
    enabled: !!isMember,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await fetch(`/api/communities/${params.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to join");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership", params.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["posts", params.id] });
      toast.success("Joined community successfully!");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await fetch(`/api/communities/${params.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to leave");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership", params.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["posts", params.id] });
      toast.success("Left community");
    },
  });

  if (communityLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-card/30 rounded-2xl" />
          <div className="h-96 bg-card/30 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!community) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold">Community not found</h2>
          <Button onClick={() => setLocation("/discover")} className="mt-4">
            Back to Discover
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/discover")} className="pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Discover
        </Button>

        {/* Hero Header */}
        <div className="relative h-64 rounded-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
          <img src={community.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670"} alt={community.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 p-6 z-20 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/50">{community.game}</Badge>
                {community.isPrivate && <Badge variant="outline" className="border-white/20 text-white"><Lock className="w-3 h-3 mr-1" /> Private</Badge>}
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white shadow-black drop-shadow-lg">{community.name}</h1>
              <p className="text-white/80 max-w-xl mt-2 line-clamp-2 md:line-clamp-none">{community.description}</p>
            </div>
            <Button 
              size="lg" 
              className={`shadow-xl ${isMember ? "bg-secondary text-secondary-foreground" : "bg-primary hover:bg-primary/90"}`}
              onClick={() => isMember ? leaveMutation.mutate() : joinMutation.mutate()}
              disabled={joinMutation.isPending || leaveMutation.isPending}
            >
              {isMember ? "Leave Community" : "Join Community"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card/30 border border-border/50 rounded-xl p-4 backdrop-blur-md">
              <h3 className="font-bold mb-4 flex items-center"><Users className="w-4 h-4 mr-2 text-primary" /> Members</h3>
              <div className="flex items-center -space-x-2 overflow-hidden mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Avatar key={i} className="inline-block border-2 border-background w-8 h-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-background">
                  +1k
                </div>
              </div>
              <p className="text-sm text-muted-foreground">1,240 gamers</p>
            </div>

            <div className="bg-card/30 border border-border/50 rounded-xl p-4 backdrop-blur-md">
              <h3 className="font-bold mb-4 flex items-center"><Hash className="w-4 h-4 mr-2 text-primary" /> Text Channels</h3>
              <div className="space-y-1">
                {["general", "lfg-raid", "builds", "clips"].map((channel) => (
                  <Button key={channel} variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/10">
                    # {channel}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-card/30 border border-border/50 rounded-xl p-4 backdrop-blur-md">
              <VoiceChannelList communityId={params.id} isMember={!!isMember} />
            </div>
          </div>

          {/* Main Content Feed */}
          <div className="md:col-span-3">
            <Tabs defaultValue="discussion" className="w-full">
              <TabsList className="bg-card/50 border border-border/50">
                <TabsTrigger value="discussion"><MessageSquare className="w-4 h-4 mr-2" /> Discussion</TabsTrigger>
                <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-2" /> Events</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>
              
              <TabsContent value="discussion" className="mt-6 space-y-4">
                {isMember && user && (
                  <CreatePostWithVoice communityId={params.id} user={user} />
                )}

                {!isMember && (
                  <div className="bg-card/30 border border-border/50 rounded-xl p-8 text-center">
                    <p className="text-muted-foreground mb-4">Join this community to see and participate in discussions</p>
                    <Button onClick={() => joinMutation.mutate()}>Join Community</Button>
                  </div>
                )}

                {/* Posts Feed */}
                {posts && posts.map((post: any) => (
                  <PostWithVoice key={post.id} post={post} />
                ))}
              </TabsContent>
              
              <TabsContent value="events">
                <div className="bg-card/30 border border-border/50 rounded-xl p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold">No upcoming events</h3>
                  <p className="text-muted-foreground mb-4">Be the first to schedule a community event!</p>
                  <Button variant="outline">Create Event</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
