import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProfileSetup() {
  const user = useUser({ or: "redirect" });
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const createProfileMutation = useMutation({
    mutationFn: async (data: { stackAuthId: string; username: string; email: string; avatar: string; bio: string }) => {
      const response = await fetch("/api/users/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create profile");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Profile created successfully!");
      setLocation("/");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    
    createProfileMutation.mutate({
      stackAuthId: user.id,
      username: username.trim(),
      email: user.primaryEmail || "",
      avatar: user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: bio.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
            Welcome to Nexus
          </h1>
          <p className="text-muted-foreground mt-2">Set up your gamer profile</p>
        </div>
        
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Gamer Tag *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your unique gamer tag"
                className="bg-background/50"
                required
              />
              <p className="text-xs text-muted-foreground">This is how other gamers will find you</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other gamers about yourself..."
                className="bg-background/50 min-h-[100px]"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={createProfileMutation.isPending}
            >
              {createProfileMutation.isPending ? "Creating Profile..." : "Create Profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
