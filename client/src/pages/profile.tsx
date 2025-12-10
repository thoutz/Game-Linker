import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Edit2, Copy, Check, Trophy, Clock, LogOut } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

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
            <Button className="bg-primary">Sign In</Button>
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
              <h1 className="text-3xl font-display font-bold">{displayName}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                @{username} • {user.bio || "Gamer"} • <span className="text-green-500">Online</span>
              </p>
            </div>

            <div className="flex gap-2 pb-2 w-full md:w-auto">
              <Button onClick={() => setShowQR(!showQR)} className="flex-1 md:flex-none bg-accent/10 text-accent hover:bg-accent/20 border border-accent/50">
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
              <a href="/api/logout">
                <Button variant="outline" size="icon" title="Sign out">
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
                  <QRCodeSVG value={`https://nexus.gg/${username}`} size={200} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display mb-2">Scan to add {username}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Share this code with friends you meet in-game.</p>
                  <Button variant="secondary" onClick={handleCopy} className="w-full max-w-xs">
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
            <TabsTrigger value="clips">Clips</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="games" className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {["Apex Legends", "Arc Raiders", "Valorant", "The Finals"].map((game, i) => (
              <Card key={game} className="bg-card/40 border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                    {game[0]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{game}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> Rank: Diamond</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 240h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="clips">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="aspect-video bg-black/50 rounded-xl relative group overflow-hidden border border-border/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
