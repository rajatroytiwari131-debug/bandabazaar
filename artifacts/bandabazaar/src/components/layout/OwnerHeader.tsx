import { Link, useLocation } from "wouter";
import { Store, Package, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OwnerHeader() {
  const [_, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("bb_owner_phone");
    setLocation("/owner");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center px-4">
        <Link href="/owner/dashboard" className="flex items-center space-x-2">
          <Store className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">Store Partner</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2 hidden md:flex">
            <Button variant="ghost" asChild>
               <Link href="/owner/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Orders</Link>
            </Button>
            <Button variant="ghost" asChild>
               <Link href="/owner/products"><Package className="mr-2 h-4 w-4" /> Products</Link>
            </Button>
          </nav>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
