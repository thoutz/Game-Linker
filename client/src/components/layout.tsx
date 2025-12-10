import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Users, User, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Users, label: "Discover", href: "/discover" },
    { icon: MessageSquare, label: "Chat", href: "/messages" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pb-20 md:pb-0 md:pl-20">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-20 border-r border-border bg-card/50 backdrop-blur-xl z-50 items-center py-8 gap-8">
        <div className="text-primary">
          <Gamepad2 className="w-8 h-8" />
        </div>
        <nav className="flex flex-col gap-6 w-full items-center">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "p-3 rounded-xl transition-all duration-300 hover:bg-primary/10 hover:text-primary group relative",
              location === item.href
                ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(139,47,201,0.3)]"
                : "text-muted-foreground"
            )}>
              <item.icon className="w-6 h-6" />
              <span className="sr-only">{item.label}</span>
              {location === item.href && (
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/50" />
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border flex items-center justify-around z-50 px-2 safe-area-pb">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn(
            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
            location === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}>
            <item.icon className={cn("w-6 h-6 transition-transform", location === item.href && "scale-110")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
