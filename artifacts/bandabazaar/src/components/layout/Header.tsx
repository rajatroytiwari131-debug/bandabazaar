import { Link, useLocation } from "wouter";
import { ShoppingCart, MapPin, User, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export function Header() {
  const { items } = useCart();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-white shadow-md">
      <div className="container flex h-16 items-center px-4 md:px-6 gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-lg font-black leading-none">B</span>
          </div>
          <span className="text-lg font-bold font-serif tracking-tight hidden sm:block">BandaBazaar</span>
        </Link>

        {/* Location badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/15 hover:bg-white/20 transition-colors rounded-full px-3 py-1.5 text-sm cursor-pointer border border-white/20">
          <MapPin className="h-3.5 w-3.5 text-green-200 shrink-0" />
          <span className="font-medium text-sm truncate max-w-[140px]">Banda, UP 210001</span>
        </div>

        {/* Delivery time badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs border border-white/15">
          <Clock className="h-3.5 w-3.5 text-green-200" />
          <span className="font-semibold text-green-100">Deliver in 25–45 min</span>
        </div>

        <div className="flex-1" />

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white hover:bg-white/15 hover:text-white rounded-lg gap-1.5 text-xs font-semibold hidden sm:flex"
          >
            <Link href="/orders">
              <User className="h-4 w-4" />
              My Orders
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-white hover:bg-white/15 hover:text-white relative md:hidden"
          >
            <Link href="/orders">
              <User className="h-5 w-5" />
            </Link>
          </Button>

          <Link href="/cart">
            <button className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors border border-white/25 rounded-xl px-3 py-2 text-sm font-bold">
              <ShoppingCart className="h-4.5 w-4.5" />
              {itemCount > 0 ? (
                <>
                  <span className="hidden sm:block">₹{cartTotal}</span>
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-yellow-400 text-green-900 text-[10px] font-black flex items-center justify-center shadow-sm">
                    {itemCount}
                  </span>
                </>
              ) : (
                <span className="hidden sm:block text-xs font-medium text-white/80">Cart</span>
              )}
            </button>
          </Link>
        </nav>
      </div>

      {/* Mobile location bar */}
      <div className="md:hidden flex items-center justify-between bg-primary/90 border-t border-white/10 px-4 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-green-100">
          <MapPin className="h-3.5 w-3.5 text-green-300" />
          <span className="font-semibold">Banda, UP 210001</span>
        </div>
        <div className="flex items-center gap-1 text-green-200">
          <Clock className="h-3 w-3" />
          <span className="font-medium">25–45 min delivery</span>
        </div>
      </div>
    </header>
  );
}
