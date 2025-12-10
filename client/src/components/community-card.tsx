import { motion } from "framer-motion";
import { Users, Lock, Unlock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CommunityCardProps {
  name: string;
  members: number;
  game: string;
  isPrivate?: boolean;
  description: string;
  image: string;
}

export default function CommunityCard({ name, members, game, isPrivate, description, image }: CommunityCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
      <Card className="h-full bg-card/40 backdrop-blur-md border-border/50 overflow-hidden group hover:border-accent/50 transition-colors">
        <div className="h-32 w-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent z-10" />
          <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute top-2 right-2 z-20">
            <Badge variant="outline" className="bg-black/50 backdrop-blur border-none text-white">
              {isPrivate ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
              {isPrivate ? "Invite Only" : "Public"}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pt-4 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-display font-bold text-foreground group-hover:text-accent transition-colors">{name}</h3>
              <p className="text-xs text-accent font-medium uppercase tracking-wider">{game}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
        
        <CardFooter className="flex items-center justify-between pt-4">
          <div className="flex items-center text-muted-foreground text-xs">
            <Users className="w-3 h-3 mr-1" />
            {members.toLocaleString()} members
          </div>
          <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform p-0 h-auto hover:bg-transparent text-accent hover:text-accent/80">
            Join <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
