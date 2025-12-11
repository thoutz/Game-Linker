import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserResult {
  id: string;
  username: string;
  avatar?: string;
  profileImageUrl?: string;
  status: string;
}

export default function AddFriendDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["userSearch", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
      return response.json();
    },
    enabled: search.length >= 2,
  });

  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await fetch("/api/friendships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          friendId,
        }),
      });
      if (!response.ok) throw new Error("Failed to add friend");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend added!");
      setOpen(false);
      setSearch("");
    },
    onError: () => {
      toast.error("Failed to add friend");
    },
  });

  const filteredResults = searchResults?.filter((u: UserResult) => u.id !== user?.id) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="rounded-full" data-testid="button-add-friend">
          <UserPlus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Friend</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-friend-search"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searching ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : search.length >= 2 && filteredResults.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground text-sm">No users found</p>
            ) : (
              filteredResults.map((u: UserResult) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={u.profileImageUrl || u.avatar} />
                      <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{u.status}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addFriendMutation.mutate(u.id)}
                    disabled={addFriendMutation.isPending}
                    data-testid={`button-add-friend-${u.id}`}
                  >
                    {addFriendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {search.length < 2 && (
            <p className="text-center text-muted-foreground text-sm">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
