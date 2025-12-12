import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Gamepad2, Users, MessageSquare, Calendar, QrCode } from "lucide-react";

function SteamIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5l2.14-2.99a3.5 3.5 0 0 1 .94-6.41V8.5a3.5 3.5 0 0 1 6.58-1.68A3.5 3.5 0 0 1 22 10.5a3.5 3.5 0 0 1-3.08 3.47v.03c0 1.93-1.57 3.5-3.5 3.5-.72 0-1.39-.22-1.94-.59l-2.91 4.06c.47.02.95.03 1.43.03 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
    </svg>
  );
}

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSteamLogin = () => {
    window.location.href = "/api/auth/steam";
  };

  const { data: steamStatus } = useQuery({
    queryKey: ["steamAuthStatus"],
    queryFn: async () => {
      const res = await fetch("/api/auth/steam/status");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6 flex items-center justify-between border-b border-border/50">
        <h1 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
          Nexus
        </h1>
        <div className="flex gap-2">
          {steamStatus?.available && (
            <Button 
              onClick={handleSteamLogin} 
              variant="outline" 
              className="border-[#1b2838] bg-[#1b2838] hover:bg-[#2a475e] text-white"
              data-testid="button-steam-signin-header"
            >
              <SteamIcon className="w-4 h-4 mr-2" />
              Steam
            </Button>
          )}
          <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90" data-testid="button-signin-header">
            Sign In
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x bg-[length:200%_auto]">
              Your Gaming Universe, Connected
            </h2>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Connect with players you meet in-game, join communities, schedule sessions, and never lose touch with your squad again.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleLogin} 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-[0_0_30px_rgba(139,47,201,0.4)]"
              data-testid="button-get-started"
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            
            {steamStatus?.available && (
              <Button 
                onClick={handleSteamLogin} 
                size="lg" 
                variant="outline"
                className="border-[#1b2838] bg-[#1b2838] hover:bg-[#2a475e] text-white text-lg px-8 py-6"
                data-testid="button-steam-get-started"
              >
                <SteamIcon className="w-5 h-5 mr-2" />
                Sign in with Steam
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="font-bold">QR Profiles</h3>
              <p className="text-sm text-muted-foreground">Share profiles via QR code with players you meet</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="p-3 rounded-xl bg-accent/20 text-accent">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-bold">Communities</h3>
              <p className="text-sm text-muted-foreground">Join game-specific groups and find your people</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="p-3 rounded-xl bg-green-500/20 text-green-500">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold">Chat</h3>
              <p className="text-sm text-muted-foreground">Message friends and coordinate outside the game</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="p-3 rounded-xl bg-orange-500/20 text-orange-500">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="font-bold">Sessions</h3>
              <p className="text-sm text-muted-foreground">Schedule gaming sessions and never miss a raid</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border/50">
        Built for gamers who want to stay connected
      </footer>
    </div>
  );
}
