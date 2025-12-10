import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, Plus, Gamepad2 } from "lucide-react";
import { useState } from "react";

export default function CreateSessionDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,47,201,0.3)]">
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
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="game">Game</Label>
            <Select>
              <SelectTrigger className="bg-background/50 border-input/50">
                <SelectValue placeholder="Select game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arc">Arc Raiders</SelectItem>
                <SelectItem value="apex">Apex Legends</SelectItem>
                <SelectItem value="valorant">Valorant</SelectItem>
                <SelectItem value="minecraft">Minecraft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Session Title</Label>
            <Input id="title" placeholder="e.g. Ranked Grind to Diamond" className="bg-background/50 border-input/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">When</Label>
              <Select defaultValue="now">
                <SelectTrigger className="bg-background/50 border-input/50">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Right Now</SelectItem>
                  <SelectItem value="tonight">Tonight</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slots">Players Needed</Label>
              <Input id="slots" type="number" min="1" max="10" placeholder="1" className="bg-background/50 border-input/50" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Details</Label>
            <Textarea id="description" placeholder="Requirements, mic needed, chill vibes only..." className="bg-background/50 border-input/50" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)} className="bg-primary hover:bg-primary/90">
            <Gamepad2 className="w-4 h-4 mr-2" />
            Post Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
