import { Link } from "wouter";
import { ShoppingCart, Menu, MapPin, User, Search } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export function Header() {
  const { items } = useCart();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden text-primary-foreground hover:bg-primary/90">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold font-serif tracking-tight">BandaBazaar</span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none hidden md:flex items-center bg-primary-foreground/10 rounded-full px-3 py-1.5 text-sm">
             <MapPin className="mr-2 h-4 w-4 shrink-0" />
             <span className="truncate">Banda, UP 210001</span>
          </div>
          <nav className="flex items-center space-x-2">
             <Button variant="ghost" size="icon" asChild className="text-primary-foreground hover:bg-primary/90">
                <Link href="/orders">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile / Orders</span>
                </Link>
             </Button>
            <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary/90" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
      <div className="md:hidden flex items-center bg-primary-foreground/10 px-4 py-2 text-sm justify-between">
        <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate font-medium">Banda, UP 210001</span>
        </div>
      </div>
    </header>
  );
}
