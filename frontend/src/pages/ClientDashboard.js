import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut, FileText, Clock, CheckCircle, Download } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API}/invoices`, { headers: getAuthHeaders() })
      ]);
      setStats(statsRes.data);
      setInvoices(invoicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }} data-testid="dashboard-title">
              Client Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back, {user?.full_name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-border text-foreground"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="crypto-card" data-testid="total-invoices-card">
            <CardHeader>
              <CardDescription className="text-muted-foreground">Total Invoices</CardDescription>
              <CardTitle className="text-3xl text-white">{stats?.total_invoices || 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="crypto-card" data-testid="pending-invoices-card">
            <CardHeader>
              <CardDescription className="text-muted-foreground">Pending</CardDescription>
              <CardTitle className="text-3xl text-yellow-400">{stats?.pending_invoices || 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="crypto-card" data-testid="paid-invoices-card">
            <CardHeader>
              <CardDescription className="text-muted-foreground">Paid</CardDescription>
              <CardTitle className="text-3xl text-primary">{stats?.paid_invoices || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Invoices List */}
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk' }}>Your Invoices</CardTitle>
            <CardDescription className="text-muted-foreground">View and manage your payment invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No invoices found</p>
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
                      <div>
                        <h3 className="text-lg font-semibold text-white">{invoice.description}</h3>
                        <p className="text-sm text-muted-foreground font-mono">#{invoice.id.slice(0, 8)}</p>
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
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                      {invoice.status === 'paid' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`${API}/invoices/${invoice.id}/receipt`, '_blank');
                          }}
                          data-testid={`download-receipt-${invoice.id}`}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Receipt
                        </Button>
                      )}
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

export default ClientDashboard;
