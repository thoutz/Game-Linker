import { motion } from "framer-motion";
import { MessageCircle, UserPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface GamerCardProps {
  username: string;
  games: string[];
  avatar: string;
  status?: "online" | "offline" | "in-game";
  statusText?: string;
}

export default function GamerCard({ username, games, avatar, status = "offline", statusText }: GamerCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="bg-card/40 backdrop-blur-md border-border/50 overflow-hidden hover:border-primary/50 transition-colors group relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-border group-hover:border-primary transition-colors">
              <AvatarImage src={avatar} alt={username} />
              <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${
              status === "online" ? "bg-green-500 shadow-[0_0_10px_#22c55e]" :
              status === "in-game" ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-muted-foreground"
            }`} />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-xl font-display font-bold text-foreground truncate">{username}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {statusText || (status === "in-game" ? "Playing..." : status)}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-2">
            {games.map((game) => (
              <Badge key={game} variant="secondary" className="bg-secondary/50 hover:bg-primary/20 hover:text-primary transition-colors cursor-default border-transparent">
                {game}
              </Badge>
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between gap-2 pt-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/20 hover:text-primary">
            <Share2 className="w-4 h-4" />
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/10">
              <UserPlus className="w-4 h-4 mr-2" />
              Add
            </Button>
            <Button size="sm" className="h-9 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/50 shadow-[0_0_15px_rgba(139,47,201,0.15)]">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
