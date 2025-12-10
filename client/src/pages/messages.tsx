import Layout from "@/components/layout";
import ChatInterface from "@/components/chat-interface";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";

const chats = [
  { id: 1, name: "CyberNinja", lastMessage: "Ready for the raid?", time: "2m", online: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CyberNinja" },
  { id: 2, name: "Arc Raiders Team", lastMessage: "Server is up!", time: "1h", online: false, group: true, avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=ArcRaiders" },
  { id: 3, name: "PixelQueen", lastMessage: "Look at this screenshot!", time: "3h", online: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen" },
];

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<number>(1);

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Chat List */}
        <div className="md:col-span-1 bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-xl font-display font-bold">Messages</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col p-2 gap-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                    selectedChat === chat.id 
                      ? "bg-primary/20 border border-primary/20" 
                      : "hover:bg-card/50 border border-transparent"
                  )}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>{chat.name[0]}</AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-sm truncate">{chat.name}</h4>
                      <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 h-full hidden md:block">
          <ChatInterface activeUser={chats.find(c => c.id === selectedChat)?.name} />
        </div>
      </div>
    </Layout>
  );
}
