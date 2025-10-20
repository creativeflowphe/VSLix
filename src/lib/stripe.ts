interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  salonName: string;
  salonAddress: string;
  clientName: string;
  clientEmail: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'overdue';
}

export async function createStripePaymentIntent(
  amount: number,
  currency: string = 'brl',
  metadata?: Record<string, string>
): Promise<PaymentIntent> {
  const stripeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`;

  const response = await fetch(stripeUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return await response.json();
}

export async function processDigitalWalletPayment(
  paymentMethod: 'apple_pay' | 'google_pay',
  amount: number,
  bookingId: string
): Promise<{ success: boolean; transactionId: string }> {
  const posUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-wallet-payment`;

  const response = await fetch(posUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentMethod,
      amount,
      bookingId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to process digital wallet payment');
  }

  return await response.json();
}

export function generateQRCodePaymentLink(
  bookingId: string,
  amount: number
): string {
  const baseUrl = window.location.origin;
  const paymentData = btoa(
    JSON.stringify({
      bookingId,
      amount,
      timestamp: Date.now(),
    })
  );
  return `${baseUrl}/pay/${paymentData}`;
}

export function generateInvoicePDF(invoiceData: InvoiceData): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #333;
        }
        .header {
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #1e40af;
          font-size: 32px;
        }
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .invoice-info div {
          flex: 1;
        }
        .invoice-number {
          font-size: 18px;
          font-weight: bold;
          color: #3b82f6;
        }
        .status {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
        }
        .status.paid { background: #d1fae5; color: #065f46; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.overdue { background: #fee2e2; color: #991b1b; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
        }
        th {
          background: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .totals {
          margin-left: auto;
          width: 300px;
          margin-top: 20px;
        }
        .totals div {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .totals .final-total {
          font-size: 20px;
          font-weight: bold;
          color: #1e40af;
          border-top: 2px solid #3b82f6;
          padding-top: 12px;
          margin-top: 8px;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FATURA</h1>
        <p class="invoice-number">${invoiceData.invoiceNumber}</p>
      </div>

      <div class="invoice-info">
        <div>
          <h3>De:</h3>
          <p><strong>${invoiceData.salonName}</strong></p>
          <p>${invoiceData.salonAddress}</p>
        </div>
        <div>
          <h3>Para:</h3>
          <p><strong>${invoiceData.clientName}</strong></p>
          <p>${invoiceData.clientEmail}</p>
        </div>
        <div>
          <h3>Detalhes:</h3>
          <p>Data: ${new Date(invoiceData.date).toLocaleDateString('pt-BR')}</p>
          <p>Vencimento: ${new Date(invoiceData.dueDate).toLocaleDateString('pt-BR')}</p>
          <p>Status: <span class="status ${invoiceData.status}">${invoiceData.status === 'paid' ? 'Pago' : invoiceData.status === 'pending' ? 'Pendente' : 'Vencido'}</span></p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th style="text-align: center;">Qtd</th>
            <th style="text-align: right;">Preço Unit.</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items
            .map(
              (item) => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">R$ ${item.unitPrice.toFixed(2)}</td>
              <td style="text-align: right;">R$ ${item.total.toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="totals">
        <div>
          <span>Subtotal:</span>
          <span>R$ ${invoiceData.subtotal.toFixed(2)}</span>
        </div>
        <div>
          <span>Taxa (8%):</span>
          <span>R$ ${invoiceData.tax.toFixed(2)}</span>
        </div>
        ${
          invoiceData.tip > 0
            ? `
        <div>
          <span>Gorjeta:</span>
          <span>R$ ${invoiceData.tip.toFixed(2)}</span>
        </div>
        `
            : ''
        }
        <div class="final-total">
          <span>TOTAL:</span>
          <span>R$ ${invoiceData.total.toFixed(2)}</span>
        </div>
        <div style="margin-top: 10px; font-size: 11px; color: #6b7280;">
          <span>Método de Pagamento:</span>
          <span>${formatPaymentMethod(invoiceData.paymentMethod)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Obrigado pelo seu negócio!</p>
        <p>Este é um documento gerado eletronicamente e não requer assinatura.</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    stripe: 'Cartão de Crédito (Stripe)',
    pos: 'POS In-App',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    cash: 'Dinheiro',
  };
  return methods[method] || method;
}

export async function generateAndSaveInvoice(): Promise<string> {
  return '';
}
