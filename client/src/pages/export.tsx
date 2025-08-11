import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Calendar, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { ClientWithCodes, Service } from "@shared/schema";

export default function Export() {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [includePaymentCodes, setIncludePaymentCodes] = useState(true);
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<ClientWithCodes[]>({
    queryKey: ["/api/clients"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    }
  };

  const getFilteredClients = () => {
    let filtered = [...clients];

    // Filter by selected services
    if (selectedServices.length > 0) {
      filtered = filtered.filter((client) =>
        client.paymentCodes?.some(code => selectedServices.includes(code.serviceId))
      );
    }

    return filtered;
  };

  const exportToCSV = () => {
    const filteredClients = getFilteredClients();
    
    if (filteredClients.length === 0) {
      toast({
        title: "No data to export",
        description: "Please adjust your filters or add some clients first",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Name", "Phone"];
    if (includePaymentCodes) {
      headers.push("Service", "Payment Code");
    }

    const csvContent = [
      headers.join(","),
      ...filteredClients.flatMap((client) => {
        if (includePaymentCodes && client.paymentCodes?.length) {
          return client.paymentCodes.map(code => {
            const service = services.find((s) => s.id === code.serviceId);
            return [
              `"${client.name}"`,
              `"${client.phone}"`,
              `"${service?.name || 'Unknown'}"`,
              `"${code.code}"`
            ].join(",");
          });
        } else {
          const row = [`"${client.name}"`, `"${client.phone}"`];
          if (includePaymentCodes) {
            row.push('""', '""');
          }
          return [row.join(",")];
        }
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${filteredClients.length} clients exported to CSV`,
    });
  };

  const exportToPDF = () => {
    toast({
      title: "Feature coming soon",
      description: "PDF export will be available in the next update",
    });
  };

  const handleExport = () => {
    if (exportFormat === "csv") {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const filteredClients = getFilteredClients();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
        <p className="text-gray-600">Export client data and payment codes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Export Settings
              </CardTitle>
              <CardDescription>
                Configure your export preferences and filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="pdf">PDF Document (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="include-codes"
                    checked={includePaymentCodes}
                    onCheckedChange={(checked) => setIncludePaymentCodes(Boolean(checked))}
                  />
                  <Label htmlFor="include-codes">Include payment codes</Label>
                </div>
              </div>

              <div>
                <Label>Date Range (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="date"
                    placeholder="From date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder="To date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Filter by Services</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => handleServiceToggle(service.id, Boolean(checked))}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {services.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No services available</p>
                )}
              </div>

              <Button 
                onClick={handleExport} 
                className="w-full flex items-center gap-2"
                disabled={filteredClients.length === 0}
              >
                <Download className="w-4 h-4" />
                Export {filteredClients.length} Clients
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Export Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Total Clients</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredClients.length}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Format</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {exportFormat.toUpperCase()}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Export Date</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>

                {selectedServices.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium mb-2">Filtered Services</div>
                    <div className="space-y-1">
                      {selectedServices.map(serviceId => {
                        const service = services.find((s) => s.id === serviceId);
                        return (
                          <div key={serviceId} className="text-xs text-gray-600">
                            • {service?.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}