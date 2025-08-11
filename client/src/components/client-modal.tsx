import { useState, useEffect } from "react";
import { X, Plus, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type ClientWithCodes, type Service, type ClientForm } from "@shared/schema";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: ClientWithCodes;
}

interface PaymentCodeForm {
  serviceId: string;
  code: string;
}

export default function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentCodes, setPaymentCodes] = useState<PaymentCodeForm[]>([]);

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: isOpen,
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Client created successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating client", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      const response = await apiRequest("PUT", `/api/clients/${client!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Client updated successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating client", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  useEffect(() => {
    if (client) {
      setName(client.name);
      setPhone(client.phone);
      setPaymentCodes(client.paymentCodes.map(pc => ({
        serviceId: pc.serviceId,
        code: pc.code,
      })));
    } else {
      setName("");
      setPhone("");
      setPaymentCodes([]);
    }
  }, [client, isOpen]);

  const addPaymentCode = () => {
    setPaymentCodes([...paymentCodes, { serviceId: "", code: "" }]);
  };

  const removePaymentCode = (index: number) => {
    setPaymentCodes(paymentCodes.filter((_, i) => i !== index));
  };

  const updatePaymentCode = (index: number, field: keyof PaymentCodeForm, value: string) => {
    const updated = [...paymentCodes];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentCodes(updated);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Payment code copied to clipboard" });
    } catch (error) {
      toast({ 
        title: "Failed to copy code", 
        variant: "destructive" 
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast({ 
        title: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }

    const formData: ClientForm = {
      name: name.trim(),
      phone: phone.trim(),
      paymentCodes: paymentCodes.filter(pc => pc.serviceId && pc.code.trim()),
    };

    if (client) {
      updateClientMutation.mutate(formData);
    } else {
      createClientMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {client ? "Edit Client" : "Add New Client"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                placeholder="Enter client name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+212 6XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment Codes</h3>
              <Button type="button" variant="outline" onClick={addPaymentCode}>
                <Plus className="w-4 h-4 mr-2" />
                Add Code
              </Button>
            </div>
            
            <div className="space-y-4">
              {paymentCodes.map((code, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label>Service</Label>
                    <Select 
                      value={code.serviceId} 
                      onValueChange={(value) => updatePaymentCode(index, "serviceId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {(services as Service[])?.map((service: Service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label>Payment Code</Label>
                    <Input
                      placeholder="Enter payment code"
                      value={code.code}
                      onChange={(e) => updatePaymentCode(index, "code", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-6">
                    {code.code && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyCode(code.code)}
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removePaymentCode(index)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
            >
              {(createClientMutation.isPending || updateClientMutation.isPending) ? "Saving..." : "Save Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
