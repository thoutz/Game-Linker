import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import CommunityCard from "@/components/community-card";
import CreateCommunityDialog from "@/components/create-community-dialog";
import CreateSessionDialog from "@/components/create-session-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Swords, Users, Calendar, Plus } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Discover() {
  const { data: communities, isLoading: communitiesLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const response = await fetch("/api/communities");
      return response.json();
    },
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions");
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

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["All", "FPS", "RPG", "MMO", "Strategy", "Co-op", "VR"].map((cat) => (
            <Badge 
              key={cat} 
              variant="outline" 
              className="px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all shrink-0"
              data-testid={`badge-category-${cat.toLowerCase()}`}
            >
              {cat}
            </Badge>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-accent">
              <Flame className="w-5 h-5" />
              <h2 className="text-xl font-display font-bold">Trending Communities</h2>
            </div>
            <CreateCommunityDialog />
          </div>
          {communitiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-card/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : communities && communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community: any) => (
                <Link key={community.id} href={`/community/${community.id}`}>
                  <a className="block h-full cursor-pointer hover:no-underline" data-testid={`card-community-${community.id}`}>
                    <CommunityCard 
                      name={community.name} 
                      game={community.game} 
                      members={community.memberCount || 0} 
                      description={community.description || ""}
                      image={community.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670"}
                      isPrivate={community.isPrivate}
                    />
                  </a>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card/30 border border-border/50 rounded-xl p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-bold mb-1">No communities yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Be the first to create a community!</p>
              <CreateCommunityDialog />
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Swords className="w-5 h-5" />
              <h2 className="text-xl font-display font-bold">Looking for Group</h2>
            </div>
            <CreateSessionDialog />
          </div>
          {sessionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-card/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session: any) => (
                <div 
                  key={session.id} 
                  className="bg-card/30 border border-border/50 p-4 rounded-xl flex items-center justify-between hover:bg-card/50 transition-colors"
                  data-testid={`card-session-${session.id}`}
                >
                  <div className="flex gap-4 items-center">
                    <div className="bg-primary/20 p-3 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold">{session.title}</h4>
                      <p className="text-xs text-muted-foreground">{session.game}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(session.scheduledFor), { addSuffix: true })} • 
                        {session.slotsNeeded} {session.slotsNeeded === 1 ? 'slot' : 'slots'} needed
                      </p>
                    </div>
                  </div>
                  <Link href="/messages">
                    <Button size="sm" variant="outline" data-testid={`button-join-${session.id}`}>Join</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card/30 border border-border/50 rounded-xl p-8 text-center">
              <Swords className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-bold mb-1">No LFG posts yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Create a session to find players!</p>
              <CreateSessionDialog />
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
