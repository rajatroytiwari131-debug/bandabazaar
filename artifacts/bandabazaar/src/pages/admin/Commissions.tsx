import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { useListCommissions, useAdminListStores } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function AdminCommissions() {
  const [, setLocation] = useLocation();
  const [storeId, setStoreId] = useState<string>("all");

  useEffect(() => {
    const session = localStorage.getItem("bb_admin_authed");
    if (session !== "true") {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: stores } = useAdminListStores();
  const { data: commissions, isLoading } = useListCommissions({ storeId: storeId !== "all" ? parseInt(storeId, 10) : undefined });

  const totalCommission = commissions?.reduce((sum, c) => sum + c.commissionAmount, 0) || 0;
  const totalVolume = commissions?.reduce((sum, c) => sum + c.orderAmount, 0) || 0;

  if (isLoading && !commissions) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-zinc-200 animate-pulse rounded mb-8" />
          <div className="space-y-4">
            <div className="h-24 bg-zinc-200 animate-pulse rounded-xl" />
            <div className="h-64 bg-zinc-200 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-12">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Commissions</h1>
            <p className="text-zinc-500 text-sm">Platform earnings at 8% per order</p>
          </div>
          
          <div className="w-full md:w-64">
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Filter by Store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-none shadow-md shadow-zinc-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Filtered Commission</CardTitle>
              <IndianRupee className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">₹{totalCommission}</div>
              <p className="text-xs text-zinc-500 mt-1">Platform earnings from these orders</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md shadow-zinc-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Filtered Order Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">₹{totalVolume}</div>
              <p className="text-xs text-zinc-500 mt-1">Total order value</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {commissions && commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Store</th>
                    <th className="px-6 py-4">Order Value</th>
                    <th className="px-6 py-4">Commission (8%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {commissions.map((record) => (
                    <tr key={record.orderId} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 text-zinc-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" /> {format(new Date(record.createdAt), "MMM d, yyyy p")}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900">#{record.orderId}</td>
                      <td className="px-6 py-4">{record.storeName}</td>
                      <td className="px-6 py-4 font-medium">₹{record.orderAmount}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">₹{record.commissionAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <IndianRupee className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-lg font-bold text-zinc-900">No commissions yet</p>
              <p className="text-zinc-500">Earnings will appear here when orders are delivered.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
