import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Loader2, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

interface GameResult {
  id: number;
  name: string;
  icon: string;
  released: string;
  rating: number;
  platforms: string[];
}

export default function AddGameDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);
  const [rank, setRank] = useState("");
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

  const addGameMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGame || !user?.id) throw new Error("No game selected");
      const response = await fetch(`/api/users/${user.id}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: selectedGame.name,
          gameIcon: selectedGame.icon,
          rank: rank || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to add game");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userGames", user?.id] });
      toast.success("Game added to your profile!");
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add game");
    },
  });

  const resetForm = () => {
    setGameSearch("");
    setSelectedGame(null);
    setRank("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) {
      toast.error("Please select a game");
      return;
    }
    addGameMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2" data-testid="button-add-game">
          <Plus className="w-4 h-4" />
          Add Game
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Add Game to Profile
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game">Search Game *</Label>
            <p className="text-xs text-muted-foreground">Search from 500,000+ games</p>
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
                  <img src={selectedGame.icon} alt={selectedGame.name} className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{selectedGame.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedGame.released?.split("-")[0]} • {selectedGame.platforms?.slice(0, 2).join(", ")}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedGame(null)}>
                  Change
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rank">Rank (optional)</Label>
            <Input
              id="rank"
              placeholder="e.g., Diamond, Gold, Level 50"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              data-testid="input-rank"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={addGameMutation.isPending || !selectedGame}
            data-testid="button-submit-game"
          >
            {addGameMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Add to Profile
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
