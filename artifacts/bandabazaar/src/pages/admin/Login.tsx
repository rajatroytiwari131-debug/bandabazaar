import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const session = localStorage.getItem("bb_admin_authed");
    if (session === "true") {
      setLocation("/admin/dashboard");
    }
  }, [setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      localStorage.setItem("bb_admin_authed", "true");
      setLocation("/admin/dashboard");
    } else {
      toast({ title: "Invalid PIN", variant: "destructive" });
      setPin("");
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
          <p className="text-zinc-400 mt-2 text-sm">Enter your PIN to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-zinc-300">Admin PIN</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="pin"
                type="password"
                placeholder="••••"
                className="pl-9 h-12 text-lg bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-primary"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                required
              />
            </div>
            <p className="text-xs text-zinc-500 text-center pt-2">Hint: Try 1234</p>
          </div>
          <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={pin.length < 4}>
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
