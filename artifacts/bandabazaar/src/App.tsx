import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
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

// Admin Pages
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminStores from "@/pages/admin/Stores";
import AdminCommissions from "@/pages/admin/Commissions";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Customer Routes */}
      <Route path="/" component={Home} />
      <Route path="/store/:storeId" component={Store} />
      <Route path="/cart" component={Cart} />
      <Route path="/order/:orderId" component={Order} />
      <Route path="/orders" component={Orders} />

      {/* Owner Routes */}
      <Route path="/owner" component={OwnerLogin} />
      <Route path="/owner/register" component={OwnerRegister} />
      <Route path="/owner/dashboard" component={OwnerDashboard} />
      <Route path="/owner/products" component={OwnerProducts} />

      {/* Admin Routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/stores" component={AdminStores} />
      <Route path="/admin/commissions" component={AdminCommissions} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </CartProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
