import Layout from "@/components/layout";
import ChatInterface from "@/components/chat-interface";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const chats = [
  { id: 1, name: "CyberNinja", lastMessage: "Ready for the raid?", time: "2m", online: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CyberNinja" },
  { id: 2, name: "Arc Raiders Team", lastMessage: "Server is up!", time: "1h", online: false, group: true, avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=ArcRaiders" },
  { id: 3, name: "PixelQueen", lastMessage: "Look at this screenshot!", time: "3h", online: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen" },
  { id: 4, name: "FragMaster99", lastMessage: "GGs yesterday", time: "1d", online: false, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=FragMaster" },
  { id: 5, name: "CozyClub", lastMessage: "New farm layout looks great", time: "2d", online: true, group: true, avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Cozy" },
];

export default function Messages() {
  const [selectedChatId, setSelectedChatId] = useState<number>(1);
  const selectedChat = chats.find(c => c.id === selectedChatId);

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Chat List */}
        <div className="md:col-span-1 bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/50 space-y-4">
            <h2 className="text-xl font-display font-bold">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search chats..." 
                className="pl-9 h-9 bg-background/50 border-input/50"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col p-2 gap-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                    selectedChatId === chat.id 
                      ? "bg-primary/20 border border-primary/20" 
                      : "hover:bg-card/50 border border-transparent"
                  )}
                >
                  <div className="relative">
                    <Avatar className="border border-transparent group-hover:border-primary/50 transition-colors">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>{chat.name[0]}</AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h4 className={cn("font-bold text-sm truncate", selectedChatId === chat.id && "text-primary")}>{chat.name}</h4>
                      <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate opacity-80">{chat.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 h-full hidden md:block">
          <ChatInterface key={selectedChatId} activeUser={selectedChat?.name} />
        </div>
      </div>
    </Layout>
  );
}
