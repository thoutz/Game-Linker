import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import GamerCard from "@/components/gamer-card";
import CommunityCard from "@/components/community-card";
import CreateSessionDialog from "@/components/create-session-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Search, Calendar, Zap, ChevronLeft, ChevronRight } from "lucide-react";
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

      {/* Upcoming Sessions - Now at top as a swipeable carousel */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Sessions
          </h2>
          {sessions && sessions.length > 1 && (
            <span className="text-xs text-muted-foreground">Swipe to see more</span>
          )}
        </div>
        
        {sessions && sessions.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {sessions.map((session: any) => (
                <CarouselItem key={session.id} className="pl-2 md:pl-4 basis-full md:basis-[85%] lg:basis-[70%]">
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between backdrop-blur-md gap-4 h-full">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="bg-primary/20 p-3 md:p-4 rounded-xl text-primary shrink-0">
                        <Calendar className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-primary font-medium">{session.game}</span>
                        <h3 className="font-bold text-lg md:text-xl">{session.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.scheduledFor).toLocaleString([], { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          with @{session.creator.username} + {session.slotsNeeded} slots open
                        </p>
                      </div>
                    </div>
                    <Link href={`/messages`}>
                      <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(139,47,201,0.3)]">
                        Join Lobby
                      </Button>
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {sessions.length > 1 && (
              <>
                <CarouselPrevious className="hidden md:flex -left-4 bg-card/80 border-border/50 hover:bg-primary/20 hover:text-primary hover:border-primary/50" />
                <CarouselNext className="hidden md:flex -right-4 bg-card/80 border-border/50 hover:bg-primary/20 hover:text-primary hover:border-primary/50" />
              </>
            )}
          </Carousel>
        ) : (
          <div className="bg-card/30 border border-border/50 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No upcoming sessions</p>
            <p className="text-xs text-muted-foreground mt-1">Create one to start playing with friends!</p>
          </div>
        )}
      </section>

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
