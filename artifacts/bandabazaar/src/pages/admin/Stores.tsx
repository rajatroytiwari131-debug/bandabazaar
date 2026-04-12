import { useEffect } from "react";
import { useLocation } from "wouter";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { useAdminListStores, useApproveStore, useRejectStore, useBlockStore, getAdminListStoresQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Store, CheckCircle, XCircle, Ban, Search } from "lucide-react";

export default function AdminStores() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const session = localStorage.getItem("bb_admin_authed");
    if (session !== "true") {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: stores, isLoading } = useAdminListStores();

  const approveStore = useApproveStore();
  const rejectStore = useRejectStore();
  const blockStore = useBlockStore();

  const handleApprove = (storeId: number) => {
    approveStore.mutate({ storeId }, {
      onSuccess: () => {
        toast({ title: "Store approved" });
        queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
      }
    });
  };

  const handleReject = (storeId: number) => {
    if (confirm("Are you sure you want to reject this store?")) {
      rejectStore.mutate({ storeId }, {
        onSuccess: () => {
          toast({ title: "Store rejected" });
          queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
        }
      });
    }
  };

  const handleBlock = (storeId: number, currentBlocked: boolean) => {
    const isBlocked = currentBlocked;
    const action = isBlocked ? "unblock" : "block";
    
    if (confirm(`Are you sure you want to ${action} this store?`)) {
      blockStore.mutate({ storeId, data: { blocked: !isBlocked } }, {
        onSuccess: () => {
          toast({ title: `Store ${action}ed successfully` });
          queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-zinc-200 animate-pulse rounded mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-zinc-200 animate-pulse rounded-xl" />)}
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
            <h1 className="text-2xl font-bold text-zinc-900">Manage Stores</h1>
            <p className="text-zinc-500 text-sm">Approve, reject, or block partner stores</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {stores && stores.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">Store Details</th>
                    <th className="px-6 py-4">Owner Info</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center shrink-0">
                            {store.imageUrl ? <img src={store.imageUrl} className="w-full h-full object-cover rounded" /> : <Store className="h-5 w-5 text-zinc-400" />}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900">{store.name}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{store.category}</div>
                            <div className="text-xs text-zinc-400 line-clamp-1 max-w-[200px] mt-0.5" title={store.address}>{store.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900">{store.ownerPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          store.status === 'approved' ? 'default' :
                          store.status === 'pending' ? 'secondary' :
                          store.status === 'blocked' ? 'destructive' : 'outline'
                        } className={
                          store.status === 'approved' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' :
                          store.status === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                          ''
                        }>
                          {store.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {store.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApprove(store.id)} disabled={approveStore.isPending}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleReject(store.id)} disabled={rejectStore.isPending}>
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {(store.status === 'approved' || store.status === 'blocked') && (
                            <Button size="sm" variant="outline" 
                              className={store.status === 'blocked' ? "text-zinc-600" : "text-rose-600 border-rose-200 hover:bg-rose-50"} 
                              onClick={() => handleBlock(store.id, store.status === 'blocked')}
                              disabled={blockStore.isPending}
                            >
                              <Ban className="h-4 w-4 mr-1" /> {store.status === 'blocked' ? 'Unblock' : 'Block'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Store className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-lg font-bold text-zinc-900">No stores found</p>
              <p className="text-zinc-500">There are no stores registered on the platform yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
