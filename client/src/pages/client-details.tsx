import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Edit, Trash2, Plus, Phone, User, CreditCard, Calendar, Printer, Copy, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentCodeSchema, type InsertPaymentCode, type ClientWithCodes, type Service } from "@shared/schema";
import { printThermalReceipt } from "@/components/thermal-print";

export default function ClientDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCodeDialogOpen, setIsAddCodeDialogOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  
  // Pagination and search state for payment codes
  const [currentPage, setCurrentPage] = useState(1);
  const [codesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to convert Firestore timestamps
  const convertTimestamps = (data: any): any => {
    if (data === null || data === undefined) {
      return data;
    }
    
    if (typeof data === 'object' && data.constructor === Object) {
      // Check if this is a Firestore timestamp
      if (data.type === 'firestore/timestamp/1.0' && typeof data.seconds === 'number') {
        return new Date(data.seconds * 1000 + (data.nanoseconds || 0) / 1000000);
      }
      
      // Recursively convert object properties
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        converted[key] = convertTimestamps(value);
      }
      return converted;
    }
    
    if (Array.isArray(data)) {
      return data.map(convertTimestamps);
    }
    
    return data;
  };

  // Fetch client data
  const { data: client, isLoading } = useQuery<ClientWithCodes>({
    queryKey: ["/api/clients", id],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      const data = await response.json();
      return convertTimestamps(data);
    },
  });

  // Fetch services for payment code creation
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/clients/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "Client has been successfully deleted",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  // Add payment code form
  const form = useForm<InsertPaymentCode>({
    resolver: zodResolver(insertPaymentCodeSchema),
    defaultValues: {
      clientId: id || "",
      serviceId: "",
      code: "",
    },
  });

  // Add payment code mutation
  const addPaymentCodeMutation = useMutation({
    mutationFn: (data: InsertPaymentCode) =>
      fetch("/api/payment-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", id] });
      setIsAddCodeDialogOpen(false);
      form.reset();
      toast({
        title: "Payment code added",
        description: "Payment code has been successfully added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add payment code",
        variant: "destructive",
      });
    },
  });

  // Delete payment code mutation
  const deletePaymentCodeMutation = useMutation({
    mutationFn: (codeId: string) =>
      fetch(`/api/payment-codes/${codeId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", id] });
      toast({
        title: "Payment code deleted",
        description: "Payment code has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete payment code",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPaymentCode) => {
    addPaymentCodeMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      deleteClientMutation.mutate();
    }
  };

  const handlePrint = async () => {
    if (!client) return;
    
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

  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(codeId);
      toast({ title: "Payment code copied!" });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedCodeId(null);
      }, 2000);
    } catch (error) {
      toast({ 
        title: "Copy failed", 
        description: "Could not copy to clipboard",
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Client not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The client you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Filter and paginate payment codes
  const filteredCodes = client.paymentCodes?.filter(code => 
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.service?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const totalPages = Math.ceil(filteredCodes.length / codesPerPage);
  const startIndex = (currentPage - 1) * codesPerPage;
  const currentPageCodes = filteredCodes.slice(startIndex, startIndex + codesPerPage);

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/")} className="dark:text-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Client Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="dark:border-gray-600 dark:text-gray-100">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} className="dark:border-gray-600 dark:text-gray-100">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <div className="lg:col-span-1">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <User className="w-5 h-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium dark:text-gray-100">{client.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium dark:text-gray-100">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p className="font-medium dark:text-gray-100">
                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Codes */}
        <div className="lg:col-span-2">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                  <CreditCard className="w-5 h-5" />
                  Payment Codes ({filteredCodes.length})
                </CardTitle>
                <Dialog open={isAddCodeDialogOpen} onOpenChange={setIsAddCodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="dark:bg-blue-600 dark:hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="dark:text-gray-100">Add Payment Code</DialogTitle>
                      <DialogDescription className="dark:text-gray-400">
                        Add a new payment code for this client
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="serviceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="dark:text-gray-100">Service</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                                    <SelectValue placeholder="Select a service" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {services.map((service) => (
                                    <SelectItem key={service.id} value={service.id}>
                                      {service.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="dark:text-gray-100">Payment Code</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter payment code" 
                                  {...field} 
                                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            disabled={addPaymentCodeMutation.isPending}
                            className="dark:bg-blue-600 dark:hover:bg-blue-700"
                          >
                            {addPaymentCodeMutation.isPending ? "Adding..." : "Add Code"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddCodeDialogOpen(false)}
                            className="dark:border-gray-600 dark:text-gray-100"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Search Input */}
              {filteredCodes.length > 0 && (
                <div className="mt-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search payment codes or services..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                      }}
                      className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {filteredCodes.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {currentPageCodes.map((code) => (
                    <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: code.service?.color || '#6B7280' }}
                        />
                        <div>
                          <p className="font-semibold dark:text-gray-100">{code.service?.name || 'Unknown Service'}</p>
                          <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">{code.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code, code.id)}
                          className="dark:border-gray-600 dark:text-gray-100"
                          title="Copy payment code"
                        >
                          {copiedCodeId === code.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePaymentCodeMutation.mutate(code.id)}
                          disabled={deletePaymentCodeMutation.isPending}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete payment code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-600">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {startIndex + 1}-{Math.min(startIndex + codesPerPage, filteredCodes.length)} of {filteredCodes.length} codes
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="dark:border-gray-600 dark:text-gray-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 p-0 ${
                              currentPage === page 
                                ? "dark:bg-blue-600 dark:hover:bg-blue-700" 
                                : "dark:border-gray-600 dark:text-gray-100"
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="dark:border-gray-600 dark:text-gray-100"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No payment codes added yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Click "Add Code" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}