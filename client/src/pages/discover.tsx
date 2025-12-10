import Layout from "@/components/layout";
import CommunityCard from "@/components/community-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Flame, Swords } from "lucide-react";

export default function Discover() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Discover</h1>
            <p className="text-muted-foreground">Find your next squad or community.</p>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["All", "FPS", "RPG", "MMO", "Strategy", "Co-op", "VR"].map((cat) => (
            <Badge 
              key={cat} 
              variant="outline" 
              className="px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all"
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Featured Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-accent">
            <Flame className="w-5 h-5" />
            <h2 className="text-xl font-display font-bold">Trending Communities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <CommunityCard 
              name="Arc Raiders Elite" 
              game="Arc Raiders" 
              members={1240} 
              description="Official community for high-level Arc Raiders gameplay and strategy sharing."
              image="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670"
            />
            <CommunityCard 
              name="Neon City Roleplay" 
              game="Cyberpunk 2077" 
              members={8900} 
              description="Deep immersion roleplay server. Whitelist only."
              image="https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=2670"
              isPrivate
            />
            <CommunityCard 
              name="Destiny 2 Raids" 
              game="Destiny 2" 
              members={15400} 
              description="Find a fireteam for any raid, any time. Sherpas available."
              image="https://images.unsplash.com/photo-1624138784181-dc7f5b759b2d?auto=format&fit=crop&q=80&w=2670"
            />
          </div>
        </section>

        {/* LFG Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Swords className="w-5 h-5" />
            <h2 className="text-xl font-display font-bold">Looking for Group</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="bg-card/30 border border-border/50 p-4 rounded-xl flex items-center justify-between hover:bg-card/50 transition-colors">
                 <div className="flex gap-4 items-center">
                    <div className="bg-secondary p-2 rounded-lg font-bold text-xs w-12 text-center">
                      LFG
                    </div>
                    <div>
                      <h4 className="font-bold">Apex Legends Ranked</h4>
                      <p className="text-sm text-muted-foreground">Need 1 more, Platinum+, comms req</p>
                    </div>
                 </div>
                 <Button size="sm" variant="outline">Apply</Button>
               </div>
             ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
