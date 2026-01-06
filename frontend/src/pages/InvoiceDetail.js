import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Copy, RefreshCw, CheckCircle, Clock, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await axios.get(`${API}/invoices/${id}`, {
        headers: getAuthHeaders()
      });
      setInvoice(response.data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async () => {
    setChecking(true);
    try {
      const response = await axios.post(
        `${API}/invoices/${id}/check-payment`,
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.status === 'paid') {
        toast.success('Payment detected!');
        fetchInvoice();
      } else {
        toast.info('No payment detected yet');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      toast.error('Failed to check payment');
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-white">Invoice not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 text-foreground"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid gap-6">
          {/* Invoice Header */}
          <Card className="crypto-card" data-testid="invoice-header">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                    {invoice.description}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">Invoice #{invoice.id.slice(0, 12)}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white mb-1">
                    {invoice.amount} {invoice.currency}
                  </p>
                  {invoice.status === 'pending' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded text-sm status-badge-pending">
                      <Clock className="w-4 h-4 mr-1" />
                      Pending Payment
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded text-sm status-badge-paid">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Paid
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Payment Instructions */}
          {invoice.status === 'pending' && (
            <Card className="crypto-card success-glow" data-testid="payment-instructions">
              <CardHeader>
                <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk' }}>
                  Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-primary/10 border-primary/30">
                  <AlertDescription className="text-white">
                    Send exactly <strong>{invoice.amount} {invoice.currency}</strong> to the address below
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Payment Address</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-[#121214] rounded-lg border border-border">
                      <p className="text-white font-mono break-all" data-testid="payment-address">
                        {invoice.payment_address}
                      </p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(invoice.payment_address)}
                      variant="outline"
                      size="icon"
                      data-testid="copy-address-button"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={checkPayment}
                    disabled={checking}
                    className="btn-primary flex-1"
                    data-testid="check-payment-button"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                    {checking ? 'Checking...' : 'Check Payment Status'}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Payments are checked automatically every 2 minutes. Click to check manually.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Invoice Details */}
          <Card className="crypto-card">
            <CardHeader>
              <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk' }}>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Created</span>
                <span className="text-white">{new Date(invoice.created_at).toLocaleString()}</span>
              </div>
              {invoice.paid_at && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Paid At</span>
                  <span className="text-white">{new Date(invoice.paid_at).toLocaleString()}</span>
                </div>
              )}
              {invoice.tx_hash && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Transaction Hash</span>
                  <span className="text-white font-mono text-sm">{invoice.tx_hash.slice(0, 20)}...</span>
                </div>
              )}
              
              {invoice.status === 'paid' && (
                <div className="pt-4">
                  <Button
                    onClick={() => window.open(`${API}/invoices/${invoice.id}/receipt`, '_blank')}
                    className="w-full btn-primary"
                    data-testid="download-receipt-button"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt (PDF)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
