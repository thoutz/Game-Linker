import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, MessageSquare, Users, Calendar, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  community: Users,
  message: MessageSquare,
  session: Calendar,
  voice: Volume2,
  default: Bell,
};

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["notificationsUnreadCount"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  if (!user) return null;

  const count = unreadCount?.count || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Notifications</CardTitle>
            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {notifications && notifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const Icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "w-full p-4 text-left hover:bg-muted/50 transition-colors flex gap-3",
                          !notification.isRead && "bg-primary/5"
                        )}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          notification.isRead ? "bg-muted" : "bg-primary/20"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4",
                            notification.isRead ? "text-muted-foreground" : "text-primary"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm line-clamp-1",
                            !notification.isRead && "font-medium"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
