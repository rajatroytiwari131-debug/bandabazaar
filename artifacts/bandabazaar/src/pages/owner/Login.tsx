import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Phone, Lock, ArrowRight, Eye, EyeOff, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function OwnerLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, user, isLoading: authLoading, openAuthModal } = useAuth();

  useEffect(() => {
    if (!authLoading && user?.role === "store_owner") {
      setLocation("/owner/dashboard");
    }
    // Backward-compat: legacy localStorage session
    const legacy = localStorage.getItem("bb_owner_phone");
    if (legacy && !user) {
      setLocation("/owner/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loggedIn = await login(phone, password);
      if (loggedIn.role !== "store_owner" && loggedIn.role !== "admin") {
        toast({ title: "Access denied", description: "This portal is for store owners only.", variant: "destructive" });
        return;
      }
      localStorage.setItem("bb_owner_phone", phone);
      setLocation("/owner/dashboard");
    } catch (err) {
      toast({ title: "Login failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl border shadow-lg p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Store className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold font-serif">Store Partner Login</h1>
            <p className="text-muted-foreground mt-2 text-sm">Manage your store and orders</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Registered phone number"
                  className="pl-9 h-12"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  className="pl-9 pr-10 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold"
              disabled={phone.length < 10 || password.length < 1 || isLoading}
            >
              {isLoading ? "Logging in..." : <>Login <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </form>
        </div>

        {/* New store signup CTA */}
        <div className="mt-4 bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Want to list your store?</p>
            <p className="text-xs text-muted-foreground">Join 100+ kirana stores on BandaBazaar</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-primary border-primary/30 hover:bg-primary/5"
            onClick={() => openAuthModal("signup")}
          >
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}
