import { Link, useLocation } from "wouter";
import { Store, Package, LogOut, LayoutDashboard, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OwnerHeader() {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("bb_owner_phone");
    setLocation("/owner");
  };

  const navItems = [
    { href: "/owner/dashboard", label: "Orders",   icon: LayoutDashboard },
    { href: "/owner/products",  label: "Products", icon: Package },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
      <div className="container flex h-16 items-center px-4">
        <Link href="/owner/dashboard" className="flex items-center gap-2.5 mr-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-base font-bold text-primary tracking-tight leading-none block">Store Partner</span>
            <span className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">BandaBazaar</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <button className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground text-xs border-border hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Logout
          </Button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden flex border-t border-border">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link key={href} href={href} className="flex-1">
              <button className={`w-full flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
