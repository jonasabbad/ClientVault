import type { ClientWithCodes } from "@shared/schema";

interface PrintSettings {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
}

export function createThermalPrint(client: ClientWithCodes, settings?: PrintSettings) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  return `
    <div style="
      font-family: 'Source Code Pro', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.3;
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      padding: 2mm;
      color: #000;
      background: #fff;
    ">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 4mm; border-bottom: 1px dashed #000; padding-bottom: 2mm;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 2mm;">
          RECU DE PAIEMENT
        </div>
        <div style="font-size: 10px;">
          ${dateStr} - ${timeStr}
        </div>
      </div>

      <!-- Client Info -->
      <div style="margin-bottom: 4mm; padding: 2mm; background: #f9f9f9; border-radius: 2mm;">
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 2mm; text-align: center;">
          ${client.name.toUpperCase()}
        </div>
        <div style="font-size: 11px; text-align: center;">
          Tel: ${client.phone}
        </div>
      </div>

      <!-- Payment Codes -->
      <div style="margin-bottom: 4mm;">
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 3mm; text-align: center; border-bottom: 2px solid #000; padding-bottom: 1mm;">
          CODES DE PAIEMENT
        </div>
        ${client.paymentCodes.length > 0 ? client.paymentCodes.map((code, index) => `
          <div style="
            margin-bottom: 3mm; 
            padding: 2mm;
            border: 1px solid #ddd;
            border-radius: 2mm;
            background: ${index % 2 === 0 ? '#f5f5f5' : '#fff'};
          ">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 1mm; text-align: center;">
              ${code.service.name}
            </div>
            <div style="
              font-family: 'Source Code Pro', monospace; 
              font-size: 14px; 
              font-weight: bold;
              letter-spacing: 1px;
              text-align: center;
              padding: 1mm;
              border: 1px dashed #666;
              background: white;
            ">
              ${code.code}
            </div>
          </div>
        `).join('') : '<div style="font-size: 11px; text-align: center; color: #666; padding: 4mm;">Aucun code de paiement</div>'}
      </div>

      <!-- Summary -->
      <div style="border-top: 1px dashed #000; padding-top: 2mm; margin-top: 4mm;">
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 1mm;">
          <span>Total codes:</span>
          <span style="font-weight: bold;">${client.paymentCodes.length}</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        text-align: center; 
        margin-top: 4mm; 
        padding-top: 2mm; 
        border-top: 2px dashed #000;
        font-size: 10px;
      ">
        <div style="margin-bottom: 2mm; font-weight: bold;">
          Merci pour votre confiance
        </div>
        <div style="font-size: 8px; color: #666;">
          ================================
        </div>
      </div>
    </div>
  `;
}

export function printThermalReceipt(client: ClientWithCodes, settings?: PrintSettings) {
  const printContent = createThermalPrint(client, settings);
  
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Recu - ${client.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
              padding: 0;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 0; 
                font-size: 12px;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              
              * {
                box-sizing: border-box;
              }
            }
            
            body {
              font-family: 'Source Code Pro', 'Courier New', monospace;
              margin: 0;
              padding: 0;
              background: white;
              width: 80mm;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}