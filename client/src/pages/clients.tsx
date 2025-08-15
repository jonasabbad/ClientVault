import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Printer, Edit2, Trash2, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SearchBar from "@/components/search-bar";
import ClientModal from "@/components/client-modal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type ClientWithCodes } from "@shared/schema";
import { printThermalReceipt } from "@/components/thermal-print";

export default function Clients() {
  const { toast } = useToast();
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithCodes | undefined>();
  const [searchResults, setSearchResults] = useState<ClientWithCodes[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { data: clients, isLoading } = useQuery<ClientWithCodes[]>({
    queryKey: ["/api/clients"],
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiRequest("DELETE", `/api/clients/${clientId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Client deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error deleting client", 
        variant: "destructive" 
      });
    },
  });

  const handleSearchResults = (results: ClientWithCodes[]) => {
    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleEditClient = (client: ClientWithCodes) => {
    setEditingClient(client);
    setShowClientModal(true);
  };

  const handleDeleteClient = (client: ClientWithCodes) => {
    if (confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`)) {
      deleteClientMutation.mutate(client.id);
    }
  };

  const handlePrintClient = async (client: ClientWithCodes) => {
    try {
      // Get settings for print header
      const settingsResponse = await fetch('/api/settings');
      const settings = settingsResponse.ok ? await settingsResponse.json() : {};
      
      printThermalReceipt(client, {
        companyName: settings.companyName || 'INEX CASH',
        companyAddress: settings.companyAddress || '',
        companyPhone: settings.companyPhone || ''
      });
      
      toast({ title: "Thermal receipt opened for printing" });
    } catch (error) {
      console.error('Print error:', error);
      toast({ 
        title: "Print error", 
        description: "Could not open print dialog",
        variant: "destructive" 
      });
    }
  };

  const displayClients = showSearchResults ? searchResults : clients || [];

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 flex items-center justify-between">
          <SearchBar onResults={handleSearchResults} onClear={handleClearSearch} />
          
          <div className="flex items-center space-x-4">
            <Button onClick={() => setShowClientModal(true)} className="dark:bg-blue-600 dark:hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
        
        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Showing {searchResults.length} search results
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="p-6 overflow-y-auto h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your clients and their payment codes</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="flex space-x-2 mb-4">
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayClients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="font-medium text-gray-700">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          <p className="text-sm text-gray-600">{client.phone}</p>
                        </div>
                      </div>
                    </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      {(client.paymentCodes || []).slice(0, 4).map((code) => (
                        <div
                          key={code.id}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: code.service?.color || '#gray' }}
                          title={code.service?.name || 'Unknown Service'}
                        />
                      ))}
                      {(client.paymentCodes || []).length > 4 && (
                        <span className="text-xs text-gray-500">+{(client.paymentCodes || []).length - 4}</span>
                      )}
                      {(client.paymentCodes || []).length === 0 && (
                        <span className="text-sm text-gray-400">No payment codes</span>
                      )}
                    </div>
                  </div>
                  
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePrintClient(client);
                        }}
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditClient(client);
                        }}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteClient(client);
                        }}
                        title="Delete"
                        disabled={deleteClientMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showSearchResults ? "No search results" : "No clients yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {showSearchResults 
                  ? "Try adjusting your search query to find what you're looking for."
                  : "Get started by adding your first client with their payment codes."
                }
              </p>
              {!showSearchResults && (
                <Button onClick={() => setShowClientModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Client
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ClientModal 
        isOpen={showClientModal} 
        onClose={() => {
          setShowClientModal(false);
          setEditingClient(undefined);
        }}
        client={editingClient}
      />
    </div>
  );
}
