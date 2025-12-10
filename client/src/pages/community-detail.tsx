import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, Lock, MessageSquare, Calendar, Hash } from "lucide-react";

export default function CommunityDetail({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const [joined, setJoined] = useState(false);

  // Mock data - in a real app, fetch based on ID
  const community = {
    id: "1",
    name: "Arc Raiders Elite",
    game: "Arc Raiders",
    members: 1240,
    isPrivate: false,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670",
    description: "The premier community for high-level Arc Raiders gameplay. We organize daily raids, share meta builds, and help new players get started.",
    channels: ["general", "lfg-raid", "builds", "clips"],
    posts: [
      { id: 1, user: "RaidLeader", content: "Need 2 more for deep run tonight. 8PM EST.", time: "2h ago", likes: 12, comments: 4 },
      { id: 2, user: "SniperWolf", content: "Just found this insane loot spot in the sunken city!", time: "4h ago", likes: 45, comments: 8 },
      { id: 3, user: "NewGuy", content: "Is the heavy laser worth crafting?", time: "6h ago", likes: 5, comments: 12 },
    ]
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/discover")} className="pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Discover
        </Button>

        {/* Hero Header */}
        <div className="relative h-64 rounded-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
          <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
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
              className={`shadow-xl ${joined ? "bg-secondary text-secondary-foreground" : "bg-primary hover:bg-primary/90"}`}
              onClick={() => setJoined(!joined)}
            >
              {joined ? "Joined" : "Join Community"}
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
              <p className="text-sm text-muted-foreground">{community.members.toLocaleString()} gamers</p>
            </div>

            <div className="bg-card/30 border border-border/50 rounded-xl p-4 backdrop-blur-md">
              <h3 className="font-bold mb-4 flex items-center"><Hash className="w-4 h-4 mr-2 text-primary" /> Channels</h3>
              <div className="space-y-1">
                {community.channels.map((channel) => (
                  <Button key={channel} variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/10">
                    # {channel}
                  </Button>
                ))}
              </div>
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
                {/* Post Input */}
                <div className="bg-card/30 border border-border/50 rounded-xl p-4 flex gap-4">
                  <Avatar>
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=NeoGamer" />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Share something with the community..." 
                      className="w-full bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm">Post</Button>
                    </div>
                  </div>
                </div>

                {/* Posts Feed */}
                {community.posts.map((post) => (
                  <div key={post.id} className="bg-card/30 border border-border/50 rounded-xl p-4 hover:border-primary/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user}`} />
                        <AvatarFallback>{post.user[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                          <h4 className="font-bold">{post.user}</h4>
                          <span className="text-xs text-muted-foreground">{post.time}</span>
                        </div>
                        <p className="mt-1 text-sm">{post.content}</p>
                        <div className="flex gap-4 mt-3">
                          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary">
                            Likes ({post.likes})
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary">
                            Comments ({post.comments})
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
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
