import { Link, useLocation } from "wouter";
import { ShieldCheck, LogOut, LayoutDashboard, Store, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const [_, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("bb_admin_authed");
    setLocation("/admin");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-zinc-900 text-white shadow-sm">
      <div className="container flex h-16 items-center px-4">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Admin Portal</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2 hidden md:flex text-zinc-300">
            <Button variant="ghost" asChild className="hover:text-white hover:bg-zinc-800">
               <Link href="/admin/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild className="hover:text-white hover:bg-zinc-800">
               <Link href="/admin/stores"><Store className="mr-2 h-4 w-4" /> Stores</Link>
            </Button>
             <Button variant="ghost" asChild className="hover:text-white hover:bg-zinc-800">
               <Link href="/admin/commissions"><IndianRupee className="mr-2 h-4 w-4" /> Commissions</Link>
            </Button>
          </nav>
          <Button variant="secondary" size="sm" onClick={handleLogout} className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
