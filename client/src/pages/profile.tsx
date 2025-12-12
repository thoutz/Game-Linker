import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout";
import AddGameDialog from "@/components/add-game-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Edit2, Copy, Check, Trophy, Clock, LogOut, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface UserGame {
  id: string;
  userId: string;
  gameId: string;
  rank: string | null;
  hoursPlayed: number | null;
  game: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: userGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["userGames", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/games`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id,
  });

  const handleCopy = () => {
    if (user?.username) {
      navigator.clipboard.writeText(user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
          <div className="h-48 bg-card/30 rounded-2xl" />
          <div className="h-32 bg-card/30 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center py-16">
          <h1 className="text-3xl font-display font-bold mb-4">Sign in to view your profile</h1>
          <p className="text-muted-foreground mb-8">Create an account or sign in to start connecting with other gamers.</p>
          <a href="/api/login">
            <Button className="bg-primary" data-testid="button-signin">Sign In</Button>
          </a>
        </div>
      </Layout>
    );
  }

  const username = user.username;
  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : username;
  const avatarUrl = user.profileImageUrl || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="relative">
          <div className="h-48 w-full rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-purple-500/20 to-accent/20 border border-border/50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
          </div>
          
          <div className="px-6 relative flex flex-col md:flex-row items-end md:items-center gap-6 -mt-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-2 right-2 bg-background p-1.5 rounded-full shadow-sm border border-border">
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
            
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-display font-bold" data-testid="text-displayname">{displayName}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                @{username} • {user.bio || "Gamer"} • <span className="text-green-500">Online</span>
              </p>
            </div>

            <div className="flex gap-2 pb-2 w-full md:w-auto">
              <Button onClick={() => setShowQR(!showQR)} className="flex-1 md:flex-none bg-accent/10 text-accent hover:bg-accent/20 border border-accent/50" data-testid="button-share-profile">
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
              <a href="/api/logout">
                <Button variant="outline" size="icon" title="Sign out" data-testid="button-logout">
                  <LogOut className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>

        {showQR && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
          >
            <Card className="bg-white/5 backdrop-blur-xl border-accent/30">
              <CardContent className="p-8 flex flex-col items-center text-center gap-6">
                <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                  <QRCodeSVG value={`${window.location.origin}/profile/${user.id}`} size={200} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display mb-2">Scan to add {username}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Share this code with friends you meet in-game.</p>
                  <Button variant="secondary" onClick={handleCopy} className="w-full max-w-xs" data-testid="button-copy-username">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Username"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="games" className="w-full">
          <TabsList className="bg-card/50 p-1 w-full justify-start">
            <TabsTrigger value="games">My Games</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="games" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                Games I Play
              </h3>
              <AddGameDialog />
            </div>
            
            {gamesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 bg-card/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : userGames && userGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userGames.map((userGame: UserGame) => (
                  <Card key={userGame.id} className="bg-card/40 border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      {userGame.game.icon ? (
                        <img 
                          src={userGame.game.icon} 
                          alt={userGame.game.name} 
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                          {userGame.game.name[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold">{userGame.game.name}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          {userGame.rank && (
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> {userGame.rank}
                            </span>
                          )}
                          {userGame.hoursPlayed && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {userGame.hoursPlayed}h
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card/20 border-dashed border-2 border-border/50">
                <CardContent className="p-8 text-center">
                  <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h4 className="font-bold mb-1">No games added yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add the games you play to help others find you
                  </p>
                  <AddGameDialog />
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="stats">
            <Card className="bg-card/20 border-border/50 mt-6">
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h4 className="font-bold mb-1">Stats coming soon</h4>
                <p className="text-sm text-muted-foreground">
                  Track your gaming achievements and progress
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
