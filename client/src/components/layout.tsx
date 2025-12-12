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
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pb-24 md:pb-0 md:pl-24">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-24 border-r border-border bg-card/30 backdrop-blur-xl z-50 items-center py-8 gap-8 transition-all hover:bg-card/50">
        <div className="text-primary p-2 bg-primary/10 rounded-xl shadow-[0_0_20px_rgba(139,47,201,0.2)]">
          <Gamepad2 className="w-8 h-8" />
        </div>
        <nav className="flex flex-col gap-4 w-full items-center">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "p-4 rounded-2xl transition-all duration-300 hover:bg-primary/10 hover:text-primary group relative flex flex-col items-center gap-1",
              location === item.href
                ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(139,47,201,0.3)]"
                : "text-muted-foreground"
            )}>
              <item.icon className={cn("w-6 h-6 transition-transform", location === item.href && "scale-110")} />
              <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-1 translate-y-full bg-card px-2 py-1 rounded-md border border-border shadow-lg z-50 pointer-events-none whitespace-nowrap md:hidden xl:block xl:static xl:translate-y-0 xl:bg-transparent xl:border-none xl:shadow-none xl:p-0">
                {item.label}
              </span>
              {location === item.href && (
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/50" />
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Nav - Floating Dock Style */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <nav className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-center justify-between px-6 py-4 safe-area-pb">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "relative group flex flex-col items-center justify-center transition-all duration-300",
                location === item.href ? "text-primary -translate-y-1" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "absolute -inset-4 bg-primary/20 rounded-full blur-xl opacity-0 transition-opacity",
                location === item.href && "opacity-50"
              )} />
              <item.icon className={cn("w-6 h-6 relative z-10 transition-transform", location === item.href && "scale-110")} />
              {location === item.href && (
                <span className="absolute -bottom-3 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
