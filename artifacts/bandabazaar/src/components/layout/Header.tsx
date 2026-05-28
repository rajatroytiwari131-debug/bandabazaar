import { Link, useLocation } from "wouter";
import { ShoppingCart, MapPin, User, Clock, LogOut, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function Header() {
  const { items } = useCart();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [, navigate] = useLocation();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
          {isAuthenticated ? (
            /* Logged-in user menu */
            <div className="flex items-center gap-1">
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
              <div className="group relative hidden sm:block">
                <button className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors rounded-lg px-3 py-2 text-xs font-semibold border border-white/20">
                  <div className="w-5 h-5 rounded-full bg-green-300 text-green-900 flex items-center justify-center text-[10px] font-black">
                    {user!.name[0].toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate">{user!.name.split(" ")[0]}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800 truncate">{user!.name}</p>
                    <p className="text-xs text-gray-500">{user!.phone}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 capitalize">{user!.role.replace("_", " ")}</span>
                  </div>
                  {user!.role === "store_owner" && (
                    <Link href="/owner/dashboard">
                      <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">My Store Dashboard</button>
                    </Link>
                  )}
                  {user!.role === "admin" && (
                    <Link href="/admin/dashboard">
                      <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Admin Panel</button>
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <LogOut className="h-3.5 w-3.5" /> Logout
                  </button>
                </div>
              </div>
              {/* Mobile user icon */}
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
            </div>
          ) : (
            /* Guest: Login / Signup */
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal("login")}
                className="hidden sm:block text-white/80 hover:text-white text-xs font-semibold hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => openAuthModal("signup")}
                className="bg-white text-green-800 hover:bg-green-50 text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
              >
                Sign up
              </button>
            </div>
          )}

          <Link href="/cart">
            <button className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors border border-white/25 rounded-xl px-3 py-2 text-sm font-bold ml-1">
              <ShoppingCart className="h-4 w-4" />
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
