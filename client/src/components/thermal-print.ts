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
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 1mm;">
          ${settings?.companyName || 'INEX CASH'}
        </div>
        ${settings?.companyAddress ? `<div style="font-size: 9px; margin-bottom: 1mm;">${settings.companyAddress}</div>` : ''}
        ${settings?.companyPhone ? `<div style="font-size: 9px; margin-bottom: 1mm;">Tel: ${settings.companyPhone}</div>` : ''}
        <div style="font-size: 10px; font-weight: bold;">RECU DE PAIEMENT</div>
      </div>

      <!-- Client Info -->
      <div style="margin-bottom: 4mm;">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 1mm;">CLIENT:</div>
        <div style="font-size: 10px; margin-left: 2mm;">
          <div style="margin-bottom: 0.5mm;">Nom: ${client.name}</div>
          <div style="margin-bottom: 0.5mm;">Tel: ${client.phone}</div>
        </div>
      </div>

      <!-- Payment Codes -->
      <div style="margin-bottom: 4mm;">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 2mm; border-bottom: 1px solid #000; padding-bottom: 1mm;">
          CODES DE PAIEMENT
        </div>
        ${client.paymentCodes.length > 0 ? client.paymentCodes.map(code => `
          <div style="
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 2mm; 
            padding: 1mm 0;
            border-bottom: 1px dotted #ccc;
          ">
            <div style="font-size: 10px; font-weight: bold;">
              ${code.service.name}:
            </div>
            <div style="
              font-family: 'Source Code Pro', monospace; 
              font-size: 12px; 
              font-weight: bold;
              letter-spacing: 0.5px;
            ">
              ${code.code}
            </div>
          </div>
        `).join('') : '<div style="font-size: 10px; text-align: center; color: #666;">Aucun code de paiement</div>'}
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
        border-top: 1px dashed #000;
        font-size: 9px;
        color: #666;
      ">
        <div>Imprime le: ${dateStr} a ${timeStr}</div>
        <div style="margin-top: 1mm;">Merci pour votre confiance</div>
        <div style="margin-top: 2mm; font-size: 8px;">
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