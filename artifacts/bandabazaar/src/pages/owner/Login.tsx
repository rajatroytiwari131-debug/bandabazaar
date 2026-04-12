import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Phone, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useListStores } from "@workspace/api-client-react";

export default function OwnerLogin() {
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stores, isLoading } = useListStores({ search: phone }, { query: { enabled: phone.length >= 10 } });

  useEffect(() => {
    const session = localStorage.getItem("bb_owner_phone");
    if (session) {
      setLocation("/owner/dashboard");
    }
  }, [setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast({ title: "Invalid phone number", variant: "destructive" });
      return;
    }

    localStorage.setItem("bb_owner_phone", phone);
    
    // If they have a store, go to dashboard, else register
    if (stores && stores.length > 0) {
      setLocation("/owner/dashboard");
    } else {
      setLocation("/owner/register");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl border shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-serif">BandaBazaar Partner</h1>
          <p className="text-muted-foreground mt-2 text-sm">Manage your store and orders</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                className="pl-9 h-12 text-lg"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2">
              No password needed. Enter your registered phone number.
            </p>
          </div>
          <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={phone.length < 10 || isLoading}>
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
