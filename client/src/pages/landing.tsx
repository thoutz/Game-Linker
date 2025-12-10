import { Button } from "@/components/ui/button";
import { Gamepad2, Users, MessageSquare, Calendar, QrCode } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6 flex items-center justify-between border-b border-border/50">
        <h1 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
          Nexus
        </h1>
        <a href="/api/login">
          <Button className="bg-primary hover:bg-primary/90">Sign In</Button>
        </a>
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

          <a href="/api/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-[0_0_30px_rgba(139,47,201,0.4)]">
              <Gamepad2 className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </a>

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
