import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, FileText, Clock, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceManagement = () => {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    client_id: '',
    amount: '',
    currency: 'CRYPTO',
    description: '',
    auto_generate: false,
    frequency: 'weekly'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, staffRes, clientsRes] = await Promise.all([
        axios.get(`${API}/invoices`, { headers: getAuthHeaders() }),
        axios.get(`${API}/staff`, { headers: getAuthHeaders() }),
        axios.get(`${API}/auth/me`, { headers: getAuthHeaders() })
      ]);
      setInvoices(invoicesRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/invoices`,
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: getAuthHeaders() }
      );
      toast.success('Invoice created successfully');
      setDialogOpen(false);
      setFormData({
        staff_id: '',
        client_id: '',
        amount: '',
        currency: 'CRYPTO',
        description: '',
        auto_generate: false,
        frequency: 'weekly'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/admin')}
            variant="ghost"
            className="text-foreground"
            data-testid="back-to-admin-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }} data-testid="invoice-management-title">
              Invoice Management
            </h1>
            <p className="text-muted-foreground">Create and track payment invoices</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="create-invoice-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0B] border-border text-white">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Space Grotesk' }}>Create New Invoice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff" className="text-foreground">Staff Member</Label>
                  <Select
                    value={formData.staff_id}
                    onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                    required
                  >
                    <SelectTrigger className="bg-background border-input" data-testid="staff-select">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0B] border-border text-white">
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id" className="text-foreground">Client ID</Label>
                  <Input
                    id="client_id"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="bg-background border-input"
                    placeholder="Enter client user ID"
                    required
                    data-testid="client-id-input"
                  />
                  <p className="text-xs text-muted-foreground">Enter the client's user ID</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="bg-background border-input"
                      required
                      data-testid="amount-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-foreground">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      required
                    >
                      <SelectTrigger className="bg-background border-input" data-testid="currency-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0B] border-border text-white">
                        <SelectItem value="CRYPTO">Crypto (All Addresses)</SelectItem>
                        <SelectItem value="LTC">LTC Only</SelectItem>
                        <SelectItem value="USDT">USDT Only</SelectItem>
                        <SelectItem value="USDC">USDC Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-input"
                    required
                    data-testid="description-input"
                  />
                </div>

                <div className="space-y-3 p-3 bg-[#0A0A0B] rounded-lg border border-border">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto_generate"
                      checked={formData.auto_generate}
                      onChange={(e) => setFormData({ ...formData, auto_generate: e.target.checked })}
                      className="w-4 h-4"
                      data-testid="auto-generate-checkbox"
                    />
                    <Label htmlFor="auto_generate" className="text-foreground cursor-pointer">
                      Auto-generate this invoice
                    </Label>
                  </div>
                  
                  {formData.auto_generate && (
                    <div className="space-y-2">
                      <Label htmlFor="frequency" className="text-foreground text-sm">Frequency</Label>
                      <Select
                        value={formData.frequency}
                        onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                      >
                        <SelectTrigger className="bg-background border-input" data-testid="frequency-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0A0A0B] border-border text-white">
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-invoice-button">
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary" data-testid="submit-invoice-button">
                    Create Invoice
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="crypto-card">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk' }}>All Invoices</CardTitle>
            <CardDescription className="text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-4 rounded-lg bg-[#0A0A0B] border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/invoice/${invoice.id}`)}
                    data-testid={`invoice-item-${invoice.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{invoice.description}</h3>
                        <p className="text-sm text-muted-foreground font-mono">#{invoice.id.slice(0, 12)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          {invoice.amount} {invoice.currency}
                        </p>
                        {invoice.status === 'pending' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs status-badge-pending">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs status-badge-paid">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(invoice.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceManagement;
