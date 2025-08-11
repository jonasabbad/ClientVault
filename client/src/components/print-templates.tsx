import { forwardRef } from "react";
import { type ClientWithCodes } from "@shared/schema";

interface PrintTemplateProps {
  client: ClientWithCodes;
  format: "thermal" | "a4";
}

export const PrintTemplate = forwardRef<HTMLDivElement, PrintTemplateProps>(
  ({ client, format }, ref) => {
    if (format === "thermal") {
      return (
        <div ref={ref} className="print-only thermal-print">
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold">CLIENT INFO</h1>
            <p className="text-xs">Payment Codes Receipt</p>
            <hr className="my-2" />
          </div>
          
          <div className="mb-4">
            <p className="font-semibold">{client.name}</p>
            <p className="text-sm">{client.phone}</p>
          </div>
          
          <div className="mb-4">
            <h2 className="font-semibold mb-2">PAYMENT CODES:</h2>
            {client.paymentCodes.map((code) => (
              <div key={code.id} className="flex justify-between mb-1 text-sm">
                <span>{code.service.name}:</span>
                <span className="font-mono">{code.code}</span>
              </div>
            ))}
          </div>
          
          <hr className="my-2" />
          <div className="text-center text-xs">
            <p>Printed: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="print-only a4-print">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Information</h1>
          <p className="text-gray-600">Payment Codes & Contact Details</p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2">
            Client Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Name:</p>
              <p className="text-lg">{client.name}</p>
            </div>
            <div>
              <p className="font-semibold">Phone:</p>
              <p className="text-lg">{client.phone}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2">
            Payment Codes
          </h2>
          <div className="space-y-4">
            {client.paymentCodes.map((code) => (
              <div 
                key={code.id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded"
              >
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: code.service.color }}
                  />
                  <span className="font-medium">{code.service.name}</span>
                </div>
                <span className="font-mono text-lg">{code.code}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    );
  }
);

PrintTemplate.displayName = "PrintTemplate";
