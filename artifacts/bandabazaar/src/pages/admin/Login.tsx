import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const [phone, setPhone] = useState("9999999999");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      setLocation("/admin/dashboard");
    }
    // Backward-compat: legacy localStorage session
    const legacy = localStorage.getItem("bb_admin_authed");
    if (legacy === "true" && !user) {
      setLocation("/admin/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loggedIn = await login(phone, password);
      if (loggedIn.role !== "admin") {
        toast({ title: "Access denied", description: "This portal is for admins only.", variant: "destructive" });
        return;
      }
      // Legacy compat
      localStorage.setItem("bb_admin_authed", "true");
      setLocation("/admin/dashboard");
    } catch (err) {
      toast({ title: "Login failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 text-zinc-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-white">Admin Portal</h1>
          <p className="text-zinc-400 mt-2 text-sm">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-300">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="phone"
                type="tel"
                placeholder="Admin phone number"
                className="pl-9 h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-primary"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="pl-9 pr-10 h-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500 text-center pt-1">Demo: phone 9999999999 / password 1234</p>
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-bold mt-2"
            disabled={isLoading || password.length < 1}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
