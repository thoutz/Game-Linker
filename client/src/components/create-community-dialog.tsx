import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GameResult {
  id: number;
  name: string;
  icon: string;
  released: string;
  rating: number;
  platforms: string[];
}

export default function CreateCommunityDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);
  const queryClient = useQueryClient();

  const { data: gameResults, isLoading: searchingGames } = useQuery({
    queryKey: ["gameSearch", gameSearch],
    queryFn: async () => {
      if (gameSearch.length < 2) return { results: [] };
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(gameSearch)}`);
      return response.json();
    },
    enabled: gameSearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          game: selectedGame?.name || gameSearch,
          image: selectedGame?.icon,
          isPrivate,
          createdBy: user?.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to create community");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Community created!");
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create community");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsPrivate(false);
    setGameSearch("");
    setSelectedGame(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedGame) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full bg-primary hover:bg-primary/90" data-testid="button-create-community">
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create Community</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game">Game *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="game"
                placeholder="Search for a game..."
                value={selectedGame ? selectedGame.name : gameSearch}
                onChange={(e) => {
                  setGameSearch(e.target.value);
                  setSelectedGame(null);
                }}
                className="pl-9"
                data-testid="input-game-search"
              />
            </div>
            {gameSearch.length >= 2 && !selectedGame && (
              <div className="border rounded-lg max-h-48 overflow-y-auto bg-card">
                {searchingGames ? (
                  <div className="p-3 text-center text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                ) : gameResults?.results?.length > 0 ? (
                  gameResults.results.map((game: GameResult) => (
                    <button
                      key={game.id}
                      type="button"
                      className="w-full p-2 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
                      onClick={() => {
                        setSelectedGame(game);
                        setGameSearch("");
                      }}
                      data-testid={`game-result-${game.id}`}
                    >
                      {game.icon && (
                        <img src={game.icon} alt={game.name} className="w-10 h-10 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{game.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {game.released?.split("-")[0]} • {game.rating?.toFixed(1)}★
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="p-3 text-center text-muted-foreground text-sm">No games found</p>
                )}
              </div>
            )}
            {selectedGame && (
              <div className="flex items-center gap-3 p-2 bg-accent/20 rounded-lg">
                {selectedGame.icon && (
                  <img src={selectedGame.icon} alt={selectedGame.name} className="w-10 h-10 rounded object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedGame.name}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedGame(null)}>
                  Change
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Community Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Arc Raiders Squad Finder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-community-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's this community about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-community-description"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="private">Private Community</Label>
              <p className="text-xs text-muted-foreground">Only invited members can join</p>
            </div>
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              data-testid="switch-private"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createMutation.isPending}
            data-testid="button-submit-community"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Create Community
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
