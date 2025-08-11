import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Users, CreditCard, Activity, Search, Printer, Edit2, UserPlus, Upload, Download, FileText, Eye } from "lucide-react";
import { printThermalReceipt } from "@/components/thermal-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SearchBar from "@/components/search-bar";
import ClientModal from "@/components/client-modal";
import ExportModal from "@/components/export-modal";
import { useToast } from "@/hooks/use-toast";
import { type ClientWithCodes, type DashboardStats, type Service } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [showClientModal, setShowClientModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchResults, setSearchResults] = useState<ClientWithCodes[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentClients } = useQuery<ClientWithCodes[]>({
    queryKey: ["/api/clients"],
    select: (data) => data.slice(0, 5), // Get first 5 clients
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const handleSearchResults = (results: ClientWithCodes[]) => {
    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setShowSearchResults(false);
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

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <SearchBar onResults={handleSearchResults} onClear={handleClearSearch} />
          
          <div className="flex items-center space-x-4">
            <Button onClick={() => setShowClientModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
        
        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((client) => (
                <div key={client.id} className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </div>
                    <div className="flex space-x-1">
                      {client.paymentCodes.slice(0, 3).map((code) => (
                        <span
                          key={code.id}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: code.service.color }}
                          title={code.service.name}
                        />
                      ))}
                      {client.paymentCodes.length > 3 && (
                        <span className="text-xs text-gray-500">+{client.paymentCodes.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="p-6 overflow-y-auto h-full">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Payment Codes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalCodes || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Services</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeServices || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Search className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Daily Searches</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.dailySearches || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Clients */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
                  <Button variant="ghost">View All</Button>
                </div>
              </div>
              
              <CardContent className="p-6">
                {recentClients && recentClients.length > 0 ? (
                  <div className="space-y-4">
                    {recentClients.map((client) => (
                      <Link key={client.id} href={`/clients/${client.id}`}>
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="font-medium text-gray-700">
                                {client.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-3">
                              <h3 className="font-medium text-gray-900">{client.name}</h3>
                              <p className="text-sm text-gray-600">{client.phone}</p>
                            </div>
                          </div>
                        
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {client.paymentCodes.slice(0, 3).map((code) => (
                                <span
                                  key={code.id}
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: code.service.color }}
                                  title={code.service.name}
                                />
                              ))}
                            </div>
                            {client.paymentCodes.length > 3 && (
                              <span className="text-xs text-gray-500">+{client.paymentCodes.length - 3}</span>
                            )}
                          </div>
                        
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
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
                              variant="ghost"
                              size="sm"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No clients yet. Add your first client to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowClientModal(true)}
              >
                <UserPlus className="w-5 h-5 text-primary mr-3" />
                Add New Client
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => toast({ title: "Bulk import feature coming soon" })}
              >
                <Upload className="w-5 h-5 text-green-600 mr-3" />
                Import Clients
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowExportModal(true)}
              >
                <Download className="w-5 h-5 text-blue-600 mr-3" />
                Export to CSV
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => toast({ title: "Report generation feature coming soon" })}
              >
                <FileText className="w-5 h-5 text-purple-600 mr-3" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Services Overview */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Services Overview</h2>
          </div>
          
          <CardContent className="p-6">
            {services && services.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="text-center">
                    <div 
                      className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                      style={{ backgroundColor: service.color }}
                    >
                      <span className="text-white font-bold text-lg">
                        {service.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm">{service.name}</h3>
                    <p className="text-xs text-gray-600">
                      {recentClients?.filter(client => 
                        client.paymentCodes.some(code => code.serviceId === service.id)
                      ).length || 0} clients
                    </p>
                  </div>
                ))}
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                    <Plus className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="font-medium text-gray-600 text-sm">Add Service</h3>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No services configured yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ClientModal 
        isOpen={showClientModal} 
        onClose={() => setShowClientModal(false)} 
      />
      
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />
    </>
  );
}
