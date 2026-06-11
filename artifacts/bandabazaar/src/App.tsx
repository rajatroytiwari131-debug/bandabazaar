import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";

// Customer Pages
import Home from "@/pages/customer/Home";
import Store from "@/pages/customer/Store";
import Cart from "@/pages/customer/Cart";
import Order from "@/pages/customer/Order";
import Orders from "@/pages/customer/Orders";

// Owner Pages
import OwnerLogin from "@/pages/owner/Login";
import OwnerRegister from "@/pages/owner/Register";
import OwnerDashboard from "@/pages/owner/Dashboard";
import OwnerProducts from "@/pages/owner/Products";
import OwnerPromotions from "@/pages/owner/Promotions";

// Admin Pages
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminStores from "@/pages/admin/Stores";
import AdminCommissions from "@/pages/admin/Commissions";
import AdminCoupons from "@/pages/admin/Coupons";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Customer Routes — public */}
      <Route path="/" component={Home} />
      <Route path="/store/:storeId" component={Store} />
      <Route path="/cart" component={Cart} />
      <Route path="/order/:orderId" component={Order} />
      <Route path="/orders" component={Orders} />

      {/* Owner Login + Register — public */}
      <Route path="/owner" component={OwnerLogin} />
      <Route path="/owner/register" component={OwnerRegister} />

      {/* Owner Protected Routes */}
      <Route path="/owner/dashboard">
        {() => <ProtectedRoute component={OwnerDashboard} roles={["store_owner", "admin"]} redirectTo="/owner" />}
      </Route>
      <Route path="/owner/products">
        {() => <ProtectedRoute component={OwnerProducts} roles={["store_owner", "admin"]} redirectTo="/owner" />}
      </Route>
      <Route path="/owner/promotions">
        {() => <ProtectedRoute component={OwnerPromotions} roles={["store_owner", "admin"]} redirectTo="/owner" />}
      </Route>

      {/* Admin Login — public */}
      <Route path="/admin" component={AdminLogin} />

      {/* Admin Protected Routes */}
      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={AdminDashboard} roles={["admin"]} redirectTo="/admin" />}
      </Route>
      <Route path="/admin/stores">
        {() => <ProtectedRoute component={AdminStores} roles={["admin"]} redirectTo="/admin" />}
      </Route>
      <Route path="/admin/commissions">
        {() => <ProtectedRoute component={AdminCommissions} roles={["admin"]} redirectTo="/admin" />}
      </Route>
      <Route path="/admin/coupons">
        {() => <ProtectedRoute component={AdminCoupons} roles={["admin"]} redirectTo="/admin" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
              <AuthModal />
            </WouterRouter>
          </CartProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
