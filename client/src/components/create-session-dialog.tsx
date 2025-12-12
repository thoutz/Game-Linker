import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Gamepad2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface UserGame {
  id: string;
  userId: string;
  gameId: string;
  rank: string | null;
  game: {
    id: string;
    name: string;
    icon: string | null;
  };
}

const SESSION_TAGS = [
  { id: "ranked", label: "Ranked", color: "bg-red-500/20 text-red-400 border-red-500/50" },
  { id: "casual", label: "Casual", color: "bg-green-500/20 text-green-400 border-green-500/50" },
  { id: "competitive", label: "Competitive", color: "bg-orange-500/20 text-orange-400 border-orange-500/50" },
  { id: "mics", label: "Mics Required", color: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
  { id: "18+", label: "18+", color: "bg-purple-500/20 text-purple-400 border-purple-500/50" },
  { id: "chill", label: "Chill Vibes", color: "bg-teal-500/20 text-teal-400 border-teal-500/50" },
  { id: "newplayers", label: "New Players Welcome", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
  { id: "tryhard", label: "Tryhard Mode", color: "bg-pink-500/20 text-pink-400 border-pink-500/50" },
];

const generateSessionTitle = (gameName: string): string => {
  const templates: Record<string, string> = {
    "Valorant": "Valorant Ranked Session",
    "Apex Legends": "Apex Legends Squad Up",
    "Arc Raiders": "Arc Raiders Co-op Run",
    "Minecraft": "Minecraft Building Session",
    "Fortnite": "Fortnite Squad Games",
    "Call of Duty": "Call of Duty Warzone Squad",
    "League of Legends": "League Ranked Grind",
    "Overwatch 2": "Overwatch 2 Competitive",
    "Counter-Strike 2": "CS2 Competitive Match",
    "Rocket League": "Rocket League Ranked",
  };
  return templates[gameName] || `${gameName} Session`;
};

const getScheduledTime = (when: string): Date => {
  const now = new Date();
  switch (when) {
    case "now":
      return now;
    case "tonight":
      const tonight = new Date(now);
      tonight.setHours(20, 0, 0, 0);
      if (tonight < now) tonight.setDate(tonight.getDate() + 1);
      return tonight;
    case "tomorrow":
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      return tomorrow;
    default:
      return now;
  }
};

export default function CreateSessionDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("now");
  const [slotsNeeded, setSlotsNeeded] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: userGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["userGames", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/games`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id && open,
  });

  const selectedGame = userGames?.find((ug: UserGame) => ug.gameId === selectedGameId);

  useEffect(() => {
    if (selectedGame) {
      setTitle(generateSessionTitle(selectedGame.game.name));
    }
  }, [selectedGame]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const description = selectedTags
        .map(tagId => SESSION_TAGS.find(t => t.id === tagId)?.label)
        .filter(Boolean)
        .join(", ");

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          game: selectedGame?.game.name || "Unknown",
          description,
          scheduledFor: getScheduledTime(when).toISOString(),
          slotsNeeded,
        }),
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session created!");
      resetForm();
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to create session");
    },
  });

  const resetForm = () => {
    setSelectedGameId("");
    setTitle("");
    setWhen("now");
    setSlotsNeeded(3);
    setSelectedTags([]);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId) 
        : [...prev, tagId]
    );
  };

  const handleSubmit = () => {
    if (!selectedGameId || !title.trim()) {
      toast.error("Please select a game and enter a title");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,47,201,0.3)]" data-testid="button-create-session">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create Session</DialogTitle>
          <DialogDescription>
            Schedule a gaming session or find players for right now.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create gaming sessions</p>
            <a href="/api/login">
              <Button className="bg-primary">Sign In</Button>
            </a>
          </div>
        ) : gamesLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : userGames?.length === 0 ? (
          <div className="py-8 text-center">
            <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Add games to your profile first</p>
            <Link href="/profile">
              <Button variant="outline" onClick={() => setOpen(false)}>Go to Profile</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="game">Game</Label>
                <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                  <SelectTrigger className="bg-background/50 border-input/50" data-testid="select-game">
                    <SelectValue placeholder="Select from your games" />
                  </SelectTrigger>
                  <SelectContent>
                    {userGames?.map((ug: UserGame) => (
                      <SelectItem key={ug.gameId} value={ug.gameId} data-testid={`game-option-${ug.gameId}`}>
                        <div className="flex items-center gap-2">
                          {ug.game.icon && (
                            <img src={ug.game.icon} alt="" className="w-5 h-5 rounded object-cover" />
                          )}
                          {ug.game.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Session Title</Label>
                <Input 
                  id="title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ranked Grind to Diamond" 
                  className="bg-background/50 border-input/50"
                  data-testid="input-session-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">When</Label>
                  <Select value={when} onValueChange={setWhen}>
                    <SelectTrigger className="bg-background/50 border-input/50" data-testid="select-when">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Right Now</SelectItem>
                      <SelectItem value="tonight">Tonight</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slots">Players Needed</Label>
                  <Input 
                    id="slots" 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={slotsNeeded}
                    onChange={(e) => setSlotsNeeded(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="bg-background/50 border-input/50"
                    data-testid="input-slots"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Session Details</Label>
                <div className="flex flex-wrap gap-2">
                  {SESSION_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        selectedTags.includes(tag.id)
                          ? tag.color
                          : "bg-card/50 text-muted-foreground border-border/50 hover:border-primary/50"
                      )}
                      data-testid={`tag-${tag.id}`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                className="bg-primary hover:bg-primary/90"
                disabled={createMutation.isPending || !selectedGameId || !title.trim()}
                data-testid="button-post-session"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Gamepad2 className="w-4 h-4 mr-2" />
                )}
                Post Session
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
