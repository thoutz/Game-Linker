import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import GamerCard from "@/components/gamer-card";
import CommunityCard from "@/components/community-card";
import CreateSessionDialog from "@/components/create-session-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Calendar, Zap } from "lucide-react";
import { Link } from "wouter";

// For demo purposes - in a real app this would come from auth
const CURRENT_USER_ID = "a476ca41-1b48-4406-aeb2-034f85984217"; // NeoGamer2077

export default function Home() {
  const [activeTab, setActiveTab] = useState("feed");

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends", CURRENT_USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/users/${CURRENT_USER_ID}/friends`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: communities, isLoading: communitiesLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const response = await fetch("/api/communities");
      return response.json();
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions");
      return response.json();
    },
  });

  return (
    <Layout>
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x bg-[length:200%_auto]">
            Nexus
          </h1>
          <p className="text-muted-foreground">Your gaming universe, connected.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search gamers, games..." 
              className="pl-9 bg-card/50 border-border/50 focus-visible:ring-accent/50"
            />
          </div>
          <CreateSessionDialog />
        </div>
      </header>

      <Tabs defaultValue="feed" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="inline-flex h-9 items-center rounded-lg text-muted-foreground bg-card/50 backdrop-blur p-1 border border-border/50 w-full justify-center overflow-x-auto no-scrollbar">
          <TabsTrigger value="feed" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary shrink-0">
            <Zap className="w-4 h-4 mr-2" /> Activity Feed
          </TabsTrigger>
          <TabsTrigger value="communities" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent shrink-0">
            Communities
          </TabsTrigger>
          <TabsTrigger value="nearby" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500 shrink-0">
            Nearby Gamers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold">Online Friends</h2>
              <Button variant="link" className="text-accent h-auto p-0">View all</Button>
            </div>
            {friendsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-card/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends && friends.length > 0 ? (
                  friends.map((friend: any) => (
                    <GamerCard 
                      key={friend.id}
                      username={friend.username} 
                      games={["Apex Legends", "Valorant"]} 
                      avatar={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                      status={friend.status as any}
                      statusText={friend.statusText}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-full text-center py-8">No friends yet. Start connecting with other gamers!</p>
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-display font-bold mb-4">Upcoming Sessions</h2>
            {sessions && sessions.length > 0 ? (
              sessions.slice(0, 3).map((session: any) => (
                <div key={session.id} className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between backdrop-blur-md gap-4 mb-4">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="bg-primary/20 p-3 rounded-lg text-primary shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.scheduledFor).toLocaleString()} • with @{session.creator.username} + {session.slotsNeeded} others
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full md:w-auto border-primary/50 text-primary hover:bg-primary hover:text-white">
                    Join Lobby
                  </Button>
                </div>
              ))
            ) : (
              <div className="bg-card/30 border border-border/50 rounded-xl p-8 text-center">
                <p className="text-muted-foreground">No upcoming sessions. Create one to start playing!</p>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="communities" className="animate-in slide-in-from-bottom-4 duration-500">
          {communitiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-card/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities && communities.map((community: any) => (
                <Link key={community.id} href={`/community/${community.id}`}>
                  <a className="block h-full cursor-pointer">
                    <CommunityCard 
                      name={community.name} 
                      game={community.game} 
                      members={1240} 
                      description={community.description || ""}
                      image={community.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670"}
                      isPrivate={community.isPrivate}
                    />
                  </a>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
