import { Link, useLocation } from "wouter";
import { ShieldCheck, LogOut, LayoutDashboard, Store, IndianRupee, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("bb_admin_authed");
    setLocation("/admin");
  };

  const navItems = [
    { href: "/admin/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
    { href: "/admin/stores",      label: "Stores",      icon: Store },
    { href: "/admin/commissions", label: "Commissions", icon: IndianRupee },
    { href: "/admin/coupons",     label: "Coupons",     icon: Ticket },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-900/30 bg-gradient-to-r from-green-950 to-green-900 text-white shadow-lg">
      <div className="container flex h-16 items-center px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 mr-6">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-green-300" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight leading-none block">BandaBazaar</span>
            <span className="text-[10px] text-green-400 font-semibold tracking-widest uppercase">Admin Portal</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <button className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/25 text-white"
                    : "text-green-200 hover:text-white hover:bg-white/10"
                }`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-green-800/50 rounded-lg px-3 py-1.5 text-xs text-green-300 font-medium border border-green-700/40">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
            Admin Access
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-green-200 hover:text-white hover:bg-white/10 border border-green-700/40 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Logout
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-green-800/50">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link key={href} href={href} className="flex-1">
              <button className={`w-full flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                active ? "text-green-300" : "text-green-500 hover:text-green-300"
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
