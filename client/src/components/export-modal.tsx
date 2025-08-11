import { useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState("csv");
  const [fields, setFields] = useState({
    names: true,
    phones: true,
    codes: true,
    services: true,
  });

  const handleExport = async () => {
    try {
      if (format === "csv") {
        const response = await fetch("/api/export/csv");
        if (!response.ok) throw new Error("Export failed");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "clients-export.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({ title: "CSV export completed successfully" });
      } else {
        // PDF export would be implemented here
        toast({ 
          title: "PDF export not yet implemented", 
          variant: "destructive" 
        });
      }
      
      onClose();
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Please try again later",
        variant: "destructive" 
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Export Format
            </Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (Excel Compatible)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF Report</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Include Fields
            </Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="names" 
                  checked={fields.names}
                  onCheckedChange={(checked) => 
                    setFields({ ...fields, names: checked as boolean })
                  }
                />
                <Label htmlFor="names">Client Names</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="phones" 
                  checked={fields.phones}
                  onCheckedChange={(checked) => 
                    setFields({ ...fields, phones: checked as boolean })
                  }
                />
                <Label htmlFor="phones">Phone Numbers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="codes" 
                  checked={fields.codes}
                  onCheckedChange={(checked) => 
                    setFields({ ...fields, codes: checked as boolean })
                  }
                />
                <Label htmlFor="codes">Payment Codes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="services" 
                  checked={fields.services}
                  onCheckedChange={(checked) => 
                    setFields({ ...fields, services: checked as boolean })
                  }
                />
                <Label htmlFor="services">Service Types</Label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
