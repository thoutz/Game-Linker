import { useState } from "react";
import { Send, Image as ImageIcon, Video, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "me" | "them";
  content: string;
  timestamp: string;
  type: "text" | "image";
}

export default function ChatInterface({ activeUser }: { activeUser?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "them", content: "Hey! Good game earlier.", timestamp: "10:30 PM", type: "text" },
    { id: "2", sender: "me", content: "Yeah that was intense! We should squad up again.", timestamp: "10:31 PM", type: "text" },
    { id: "3", sender: "them", content: "For sure. I'm free tomorrow night.", timestamp: "10:32 PM", type: "text" },
    { id: "4", sender: "me", content: "Perfect. I'll send invite.", timestamp: "10:33 PM", type: "text" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages([...messages, {
      id: Date.now().toString(),
      sender: "me",
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text"
    }]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[600px] bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-card/50">
        <Avatar>
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser || "User"}`} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-bold font-display">{activeUser || "Select a chat"}</h3>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex max-w-[80%]",
                msg.sender === "me" ? "ml-auto" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm",
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-secondary text-secondary-foreground rounded-bl-none"
                )}
              >
                {msg.content}
                <div className={cn("text-[10px] mt-1 opacity-70", msg.sender === "me" ? "text-primary-foreground" : "text-muted-foreground")}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-card/50 border-t border-border/50">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-background/50 border-border/50 focus-visible:ring-primary/50"
          />
          <Button onClick={handleSend} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
