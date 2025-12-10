import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import CommunityCard from "@/components/community-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Swords } from "lucide-react";
import { Link } from "wouter";

export default function Discover() {
  const { data: communities, isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const response = await fetch("/api/communities");
      return response.json();
    },
  });

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
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["All", "FPS", "RPG", "MMO", "Strategy", "Co-op", "VR"].map((cat) => (
            <Badge 
              key={cat} 
              variant="outline" 
              className="px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all shrink-0"
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
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-card/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities && communities.map((community: any) => (
                <Link key={community.id} href={`/community/${community.id}`}>
                  <a className="block h-full cursor-pointer hover:no-underline">
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
