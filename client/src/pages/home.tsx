import { useState } from "react";
import Layout from "@/components/layout";
import GamerCard from "@/components/gamer-card";
import CommunityCard from "@/components/community-card";
import CreateSessionDialog from "@/components/create-session-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Plus, Calendar, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [activeTab, setActiveTab] = useState("feed");

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
        <TabsList className="bg-card/50 backdrop-blur p-1 border border-border/50 w-full justify-start overflow-x-auto">
          <TabsTrigger value="feed" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Zap className="w-4 h-4 mr-2" /> Activity Feed
          </TabsTrigger>
          <TabsTrigger value="communities" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
            Communities
          </TabsTrigger>
          <TabsTrigger value="nearby" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
            Nearby Gamers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold">Online Friends</h2>
              <Button variant="link" className="text-accent h-auto p-0">View all</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <GamerCard 
                username="CyberNinja" 
                games={["Apex Legends", "Valorant"]} 
                avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=CyberNinja" 
                status="in-game"
                statusText="Ranked Match - 2/3"
              />
              <GamerCard 
                username="PixelQueen" 
                games={["Minecraft", "Stardew Valley"]} 
                avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen" 
                status="online"
              />
              <GamerCard 
                username="FragMaster99" 
                games={["CS:GO", "COD"]} 
                avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=FragMaster" 
                status="offline"
                statusText="Last seen 2h ago"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold mb-4">Upcoming Sessions</h2>
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between backdrop-blur-md gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-primary/20 p-3 rounded-lg text-primary shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Arc Raiders Raid Night</h3>
                  <p className="text-sm text-muted-foreground">Today, 8:00 PM • with @CyberNinja + 2 others</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full md:w-auto border-primary/50 text-primary hover:bg-primary hover:text-white">
                Join Lobby
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="communities" className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/community/1">
              <a className="block h-full cursor-pointer">
                <CommunityCard 
                  name="Arc Raiders Elite" 
                  game="Arc Raiders" 
                  members={1240} 
                  description="Official community for high-level Arc Raiders gameplay and strategy sharing."
                  image="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670"
                />
              </a>
            </Link>
            <Link href="/community/2">
              <a className="block h-full cursor-pointer">
                <CommunityCard 
                  name="Cozy Gamers" 
                  game="General" 
                  members={5890} 
                  isPrivate
                  description="A chill place for cozy game lovers to share screenshots and vibes."
                  image="https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&q=80&w=2670"
                />
              </a>
            </Link>
            <Link href="/community/3">
              <a className="block h-full cursor-pointer">
                <CommunityCard 
                  name="FPS Legends" 
                  game="Shooters" 
                  members={3200} 
                  description="Competitive shooter discussion, LFG, and tournament organization."
                  image="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=2671"
                />
              </a>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
