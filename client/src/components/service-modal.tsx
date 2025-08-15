import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service;
}

interface ServiceForm {
  name: string;
  color: string;
  icon: string;
}

const serviceIcons = [
  { value: "credit-card", label: "Credit Card" },
  { value: "smartphone", label: "Smartphone" },
  { value: "wifi", label: "WiFi" },
  { value: "tv", label: "TV" },
  { value: "car", label: "Car" },
  { value: "home", label: "Home" },
  { value: "shopping-cart", label: "Shopping" },
  { value: "gift", label: "Gift" },
  { value: "heart", label: "Health" },
  { value: "book", label: "Education" },
];

const serviceColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export default function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ServiceForm>({
    name: "",
    color: "#3B82F6",
    icon: "credit-card"
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceForm) => {
      const response = await apiRequest("POST", "/api/services", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service created successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating service", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceForm) => {
      const response = await apiRequest("PUT", `/api/services/${service!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service updated successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating service", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        color: service.color,
        icon: service.icon
      });
    } else {
      setFormData({
        name: "",
        color: "#3B82F6",
        icon: "credit-card"
      });
    }
  }, [service, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ 
        title: "Please enter a service name", 
        variant: "destructive" 
      });
      return;
    }

    if (service) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {service ? "Edit Service" : "Add New Service"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              placeholder="Enter service name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label>Service Icon</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {serviceIcons.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.icon === icon.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                  title={icon.label}
                >
                  <div className="w-6 h-6 flex items-center justify-center text-lg">
                    {icon.value === 'credit-card' && '💳'}
                    {icon.value === 'smartphone' && '📱'}
                    {icon.value === 'wifi' && '📶'}
                    {icon.value === 'tv' && '📺'}
                    {icon.value === 'car' && '🚗'}
                    {icon.value === 'home' && '🏠'}
                    {icon.value === 'shopping-cart' && '🛒'}
                    {icon.value === 'gift' && '🎁'}
                    {icon.value === 'heart' && '❤️'}
                    {icon.value === 'book' && '📚'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <Label>Service Color</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {serviceColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    formData.color === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {service ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 