import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, type SignupData } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  ShoppingBag,
  Store,
  Phone,
  Lock,
  User,
  Mail,
  MapPin,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";

type Screen =
  | "role-select"
  | "login"
  | "signup-customer"
  | "signup-owner"
  | "pending-approval";

export default function AuthModal() {
  const { showAuthModal, closeAuthModal, login, signup, authMode } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [screen, setScreen] = useState<Screen>(authMode === "signup" ? "role-select" : "login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Customer signup state
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPassword, setCustPassword] = useState("");
  const [custAddress, setCustAddress] = useState("");

  // Owner signup state
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeCategory, setStoreCategory] = useState("Grocery");
  const [pendingMessage, setPendingMessage] = useState("");

  useEffect(() => {
    if (showAuthModal) {
      setScreen(authMode === "signup" ? "role-select" : "login");
      setShowPassword(false);
    }
  }, [showAuthModal, authMode]);

  if (!showAuthModal) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(loginPhone, loginPassword);
      closeAuthModal();
      toast({ title: `Welcome back, ${user.name}!` });
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "store_owner") navigate("/owner/dashboard");
      else navigate("/");
    } catch (err) {
      toast({ title: "Login failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data: SignupData = {
        role: "customer",
        name: custName,
        phone: custPhone,
        email: custEmail || undefined,
        password: custPassword,
        address: custAddress || undefined,
      };
      const result = await signup(data);
      closeAuthModal();
      toast({ title: `Welcome, ${result.user.name}! 🎉` });
      navigate("/");
    } catch (err) {
      toast({ title: "Signup failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data: SignupData = {
        role: "store_owner",
        name: ownerName,
        phone: ownerPhone,
        email: ownerEmail || undefined,
        password: ownerPassword,
        storeName,
        storeAddress,
        storeCategory,
      };
      const result = await signup(data);
      setPendingMessage(result.message ?? "Your store is waiting for admin approval.");
      setScreen("pending-approval");
    } catch (err) {
      toast({ title: "Registration failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && closeAuthModal()}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Green header bar */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 px-6 pt-6 pb-8">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-white/20 rounded-lg p-1.5">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">BandaBazaar</span>
          </div>
          <p className="text-white/80 text-sm">Banda, UP 210001</p>
        </div>

        {/* Card pulled up over header */}
        <div className="-mt-4 bg-white rounded-t-2xl px-6 pt-6 pb-6">
          {/* ── ROLE SELECT ── */}
          {screen === "role-select" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Create Account</h2>
              <p className="text-gray-500 text-sm mb-6">How would you like to join BandaBazaar?</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setScreen("signup-customer")}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                    <ShoppingBag className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800 text-sm">Customer</div>
                    <div className="text-xs text-gray-500 mt-0.5">Shop & order groceries</div>
                  </div>
                </button>
                <button
                  onClick={() => setScreen("signup-owner")}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                    <Store className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800 text-sm">Store Partner</div>
                    <div className="text-xs text-gray-500 mt-0.5">List your kirana store</div>
                  </div>
                </button>
              </div>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <button
                  onClick={() => setScreen("login")}
                  className="text-green-700 font-semibold hover:underline"
                >
                  Login
                </button>
              </p>
            </div>
          )}

          {/* ── LOGIN ── */}
          {screen === "login" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setScreen("role-select")} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Welcome back</h2>
                  <p className="text-gray-500 text-sm">Login to your account</p>
                </div>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="10-digit mobile number"
                      className="pl-9"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-9 pr-9"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-11"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4">
                New here?{" "}
                <button
                  onClick={() => setScreen("role-select")}
                  className="text-green-700 font-semibold hover:underline"
                >
                  Create account
                </button>
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                <strong>Demo:</strong> Admin → 9999999999 / 1234
              </div>
            </div>
          )}

          {/* ── CUSTOMER SIGNUP ── */}
          {screen === "signup-customer" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setScreen("role-select")} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Customer Signup</h2>
                  <p className="text-gray-500 text-sm">Start shopping from local stores</p>
                </div>
              </div>
              <form onSubmit={handleCustomerSignup} className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Ramesh Kumar" className="pl-9" value={custName} onChange={(e) => setCustName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="tel" placeholder="10-digit mobile number" className="pl-9" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email <span className="text-gray-400">(optional)</span></Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="email" placeholder="you@example.com" className="pl-9" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Delivery Address <span className="text-gray-400">(optional)</span></Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Mohalla, Banda" className="pl-9" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Choose a strong password"
                      className="pl-9 pr-9"
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      required
                      minLength={4}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-11 mt-2" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Customer Account"}
                </Button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-3">
                Already registered?{" "}
                <button onClick={() => setScreen("login")} className="text-green-700 font-semibold hover:underline">Login</button>
              </p>
            </div>
          )}

          {/* ── OWNER SIGNUP ── */}
          {screen === "signup-owner" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setScreen("role-select")} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Store Partner Signup</h2>
                  <p className="text-gray-500 text-sm">Register your kirana store on BandaBazaar</p>
                </div>
              </div>
              <form onSubmit={handleOwnerSignup} className="space-y-3">
                <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800 font-medium">
                  📋 Your store will be reviewed and approved by our admin team within 24 hours.
                </div>

                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Owner Details</div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Owner Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Suresh Sharma" className="pl-9" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="tel" placeholder="10-digit mobile number" className="pl-9" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email <span className="text-gray-400">(optional)</span></Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="email" placeholder="owner@example.com" className="pl-9" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Choose a strong password"
                      className="pl-9 pr-9"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      required
                      minLength={4}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Store Details</div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Store Name</Label>
                  <div className="relative mt-1">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Sharma Kirana Store" className="pl-9" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Store Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Mohalla, Banda, UP 210001" className="pl-9" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Store Category</Label>
                  <select
                    className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                  >
                    {["Grocery", "Vegetables", "Dairy", "Snacks", "Pharmacy", "Beverages", "Bakery", "Meat"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-11 mt-2" disabled={isLoading}>
                  {isLoading ? "Registering store..." : "Register My Store"}
                </Button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-3">
                Already registered?{" "}
                <button onClick={() => setScreen("login")} className="text-green-700 font-semibold hover:underline">Login</button>
              </p>
            </div>
          )}

          {/* ── PENDING APPROVAL ── */}
          {screen === "pending-approval" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-green-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Store Registered!</h2>
              <p className="text-gray-600 text-sm mb-4">{pendingMessage}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6 text-left">
                <strong>What happens next?</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>✅ Your store application is submitted</li>
                  <li>⏳ Admin reviews within 24 hours</li>
                  <li>📱 You'll be able to login once approved</li>
                </ul>
              </div>
              <Button onClick={closeAuthModal} className="w-full bg-green-700 hover:bg-green-800 text-white">
                Got it
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
