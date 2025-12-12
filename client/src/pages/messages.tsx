import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Send, MessageSquarePlus, Users, Loader2 } from "lucide-react";
import AddFriendDialog from "@/components/add-friend-dialog";
import { formatDistanceToNow } from "date-fns";

interface ChatUser {
  id: string;
  username: string;
  avatar?: string;
  profileImageUrl?: string;
  status: string;
}

interface ChatPreview {
  user: ChatUser;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  };
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: recentChats, isLoading: chatsLoading } = useQuery({
    queryKey: ["recentChats", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/chats`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: friends } = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/friends`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: conversation, isLoading: conversationLoading, refetch: refetchConversation } = useQuery({
    queryKey: ["conversation", user?.id, selectedChat?.id],
    queryFn: async () => {
      if (!user?.id || !selectedChat?.id) return [];
      const response = await fetch(`/api/messages/${selectedChat.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id && !!selectedChat?.id,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !selectedChat?.id) throw new Error("No chat selected");
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedChat.id,
          content,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchConversation();
      queryClient.invalidateQueries({ queryKey: ["recentChats", user?.id] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const chatList: ChatUser[] = recentChats?.length > 0 
    ? recentChats.map((c: ChatPreview) => c.user)
    : friends || [];

  const filteredChats = chatList.filter((c: ChatUser) => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLastMessage = (chatUser: ChatUser): ChatPreview | undefined => {
    return recentChats?.find((c: ChatPreview) => c.user.id === chatUser.id);
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <MessageSquarePlus className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Sign in to chat</h2>
          <p className="text-muted-foreground mb-6">Connect with other gamers and start conversations</p>
          <a href="/api/login">
            <Button className="bg-primary">Sign In</Button>
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        <div className="md:col-span-1 bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">Messages</h2>
              <AddFriendDialog />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search chats..." 
                className="pl-9 h-9 bg-background/50 border-input/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-chats"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col p-2 gap-1">
              {chatsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add friends to start chatting!</p>
                </div>
              ) : (
                filteredChats.map((chatUser: ChatUser) => {
                  const preview = getLastMessage(chatUser);
                  return (
                    <button
                      key={chatUser.id}
                      onClick={() => setSelectedChat(chatUser)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                        selectedChat?.id === chatUser.id 
                          ? "bg-primary/20 border border-primary/20" 
                          : "hover:bg-card/50 border border-transparent"
                      )}
                      data-testid={`chat-user-${chatUser.id}`}
                    >
                      <div className="relative">
                        <Avatar className="border border-transparent group-hover:border-primary/50 transition-colors">
                          <AvatarImage src={chatUser.profileImageUrl || chatUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatUser.username}`} />
                          <AvatarFallback>{chatUser.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {chatUser.status === "online" && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline">
                          <h4 className={cn("font-bold text-sm truncate", selectedChat?.id === chatUser.id && "text-primary")}>
                            {chatUser.username}
                          </h4>
                          {preview && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(preview.lastMessage.createdAt), { addSuffix: false })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate opacity-80">
                          {preview?.lastMessage.content || "Start a conversation"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="md:col-span-2 h-full hidden md:flex flex-col bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-border/50 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedChat.profileImageUrl || selectedChat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.username}`} />
                  <AvatarFallback>{selectedChat.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">{selectedChat.username}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{selectedChat.status}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {conversationLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversation?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquarePlus className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Send a message to start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversation?.map((msg: Message) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.senderId === user.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            msg.senderId === user.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border/50"
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={cn(
                            "text-[10px] mt-1",
                            msg.senderId === user.id ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-background/50"
                  data-testid="input-message"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquarePlus className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground text-sm">Choose a friend from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
