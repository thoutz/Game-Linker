import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout";
import AddGameDialog from "@/components/add-game-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Share2, Edit2, Copy, Check, Trophy, Clock, LogOut, Gamepad2, Camera, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const STATUS_OPTIONS = [
  { value: "online", label: "Online", color: "bg-green-500" },
  { value: "away", label: "Away", color: "bg-yellow-500" },
  { value: "busy", label: "Busy", color: "bg-red-500" },
  { value: "offline", label: "Invisible", color: "bg-gray-500" },
];

const AVATAR_STYLES = [
  "avataaars", "bottts", "fun-emoji", "lorelei", "notionists", 
  "open-peeps", "personas", "pixel-art", "adventurer"
];

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editStatusText, setEditStatusText] = useState("");
  const [editStatus, setEditStatus] = useState("online");
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState("avataaars");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const queryClient = useQueryClient();

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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { bio?: string; status?: string; statusText?: string; avatar?: string; username?: string; displayName?: string; profileImageUrl?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast.success("Profile updated!");
      setEditDialogOpen(false);
      setAvatarDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const syncSteamMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/steam/sync-playtime", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to sync Steam playtime");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userGames", user?.id] });
      toast.success(`Synced playtime for ${data.synced} games`);
    },
    onError: () => {
      toast.error("Failed to sync Steam playtime");
    },
  });

  const handleCopy = () => {
    if (user?.username) {
      navigator.clipboard.writeText(user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = () => {
    const updates: any = {
      bio: editBio,
      status: editStatus,
      statusText: editStatusText,
    };
    if (editUsername && editUsername !== user?.username) {
      updates.username = editUsername;
    }
    if (editDisplayName !== (user?.displayName || "")) {
      updates.displayName = editDisplayName;
    }
    updateProfileMutation.mutate(updates);
  };

  const handleSaveAvatar = (style: string) => {
    const newAvatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${user?.username}`;
    updateProfileMutation.mutate({ avatar: newAvatarUrl, profileImageUrl: newAvatarUrl });
  };

  const openEditDialog = () => {
    setEditBio(user?.bio || "");
    setEditStatusText(user?.statusText || "");
    setEditStatus(user?.status || "online");
    setEditUsername(user?.username || "");
    setEditDisplayName(user?.displayName || "");
    setEditDialogOpen(true);
  };

  const openAvatarDialog = () => {
    const currentAvatar = user?.avatar || "";
    const matchedStyle = AVATAR_STYLES.find(style => currentAvatar.includes(style));
    setSelectedAvatarStyle(matchedStyle || "avataaars");
    setCustomAvatarUrl("");
    setAvatarDialogOpen(true);
  };

  const handleSaveCustomAvatar = () => {
    if (customAvatarUrl.trim()) {
      updateProfileMutation.mutate({ profileImageUrl: customAvatarUrl.trim(), avatar: customAvatarUrl.trim() });
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
          <Button onClick={() => window.location.href = "/api/login"} className="bg-primary" data-testid="button-signin">
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  const username = user.username;
  const displayName = user.displayName || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : username);
  const avatarUrl = user.profileImageUrl || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const currentStatus = STATUS_OPTIONS.find(s => s.value === user.status) || STATUS_OPTIONS[0];

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
              className="relative group"
            >
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                <DialogTrigger asChild>
                  <button 
                    onClick={openAvatarDialog}
                    className="absolute bottom-2 right-2 bg-primary p-2 rounded-full shadow-lg border-2 border-background hover:bg-primary/90 transition-colors" 
                    data-testid="button-change-avatar"
                  >
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display">Choose Avatar</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Custom Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/your-image.jpg"
                          value={customAvatarUrl}
                          onChange={(e) => setCustomAvatarUrl(e.target.value)}
                          data-testid="input-custom-avatar"
                        />
                        <Button 
                          onClick={handleSaveCustomAvatar} 
                          disabled={!customAvatarUrl.trim() || updateProfileMutation.isPending}
                          data-testid="button-save-custom-avatar"
                        >
                          {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or choose a style</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {AVATAR_STYLES.map((style) => (
                        <button
                          key={style}
                          onClick={() => setSelectedAvatarStyle(style)}
                          className={cn(
                            "p-2 rounded-xl border-2 transition-all hover:scale-105",
                            selectedAvatarStyle === style 
                              ? "border-primary bg-primary/10" 
                              : "border-border/50 hover:border-primary/50"
                          )}
                          data-testid={`avatar-style-${style}`}
                        >
                          <img 
                            src={`https://api.dicebear.com/7.x/${style}/svg?seed=${username}`}
                            alt={style}
                            className="w-full aspect-square rounded-lg"
                          />
                          <p className="text-xs text-center mt-1 capitalize">{style.replace("-", " ")}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleSaveAvatar(selectedAvatarStyle)} 
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-avatar"
                  >
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Selected Style
                  </Button>
                </DialogContent>
              </Dialog>
              <div className={cn("absolute bottom-0 left-0 w-5 h-5 rounded-full border-3 border-background", currentStatus.color)} />
            </motion.div>
            
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-display font-bold" data-testid="text-displayname">{displayName}</h1>
              <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
                @{username} • {user.bio || "Gamer"} • 
                <span className={cn("flex items-center gap-1", currentStatus.value === "online" ? "text-green-500" : "text-muted-foreground")}>
                  <span className={cn("w-2 h-2 rounded-full", currentStatus.color)} />
                  {currentStatus.label}
                </span>
              </p>
              {user.statusText && (
                <p className="text-sm text-muted-foreground mt-1 italic">"{user.statusText}"</p>
              )}
            </div>

            <div className="flex gap-2 pb-2 w-full md:w-auto flex-wrap">
              <Button onClick={openEditDialog} variant="outline" size="sm" data-testid="button-edit-profile">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button onClick={() => setShowQR(!showQR)} className="bg-accent/10 text-accent hover:bg-accent/20 border border-accent/50" size="sm" data-testid="button-share-profile">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => window.location.href = "/api/logout"} variant="outline" size="icon" title="Sign out" data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your display name"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  data-testid="input-display-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">@</span>
                  <Input
                    id="username"
                    placeholder="username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    data-testid="input-username"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and underscores</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell other gamers about yourself..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  data-testid="input-bio"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="statusText">Status Message</Label>
                <Input
                  id="statusText"
                  placeholder="What are you up to?"
                  value={editStatusText}
                  onChange={(e) => setEditStatusText(e.target.value)}
                  data-testid="input-status-text"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setEditStatus(option.value)}
                      className={cn(
                        "px-3 py-2 rounded-lg border flex items-center gap-2 transition-all",
                        editStatus === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/50"
                      )}
                      data-testid={`status-${option.value}`}
                    >
                      <span className={cn("w-3 h-3 rounded-full", option.color)} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSaveProfile} 
              className="w-full"
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogContent>
        </Dialog>

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
              <div className="flex gap-2">
                {user.steamId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => syncSteamMutation.mutate()}
                    disabled={syncSteamMutation.isPending}
                    data-testid="button-sync-steam"
                  >
                    {syncSteamMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sync Steam
                  </Button>
                )}
                <AddGameDialog />
              </div>
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
