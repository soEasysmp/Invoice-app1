import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LogOut, FileText, Clock, CheckCircle, Download, Search, Filter, TrendingUp, Wallet, DollarSign, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, filterStatus, searchTerm]);

  const fetchData = async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API}/invoices`, { headers: getAuthHeaders() })
      ]);
      setStats(statsRes.data);
      setInvoices(invoicesRes.data);
      setFilteredInvoices(invoicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const calculateTotalPaid = () => {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
      .toFixed(2);
  };

  const calculateTotalPending = () => {
    return invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0)
      .toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <motion.div 
          className="text-white text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading your dashboard...
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
        ></motion.div>
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }} data-testid="dashboard-title">
              Client Dashboard
            </h1>
            <p className="text-gray-400">Welcome back, <span className="text-cyan-400 font-semibold">{user?.full_name}</span></p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 rounded-full transition-all"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#0A0A0B] to-[#050505] border border-white/5 rounded-2xl overflow-hidden relative group hover:border-primary/30 transition-all duration-300" data-testid="total-invoices-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <CardDescription className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Invoices</CardDescription>
                <CardTitle className="text-3xl font-bold text-white font-mono">{stats?.total_invoices || 0}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#0A0A0B] to-[#050505] border border-white/5 rounded-2xl overflow-hidden relative group hover:border-yellow-500/30 transition-all duration-300" data-testid="pending-invoices-card">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <CardDescription className="text-gray-500 text-xs uppercase tracking-wider mb-1">Pending</CardDescription>
                <CardTitle className="text-3xl font-bold text-yellow-400 font-mono">{stats?.pending_invoices || 0}</CardTitle>
                <p className="text-xs text-gray-500 mt-1 font-mono">${calculateTotalPending()}</p>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#0A0A0B] to-[#050505] border border-white/5 rounded-2xl overflow-hidden relative group hover:border-primary/30 transition-all duration-300" data-testid="paid-invoices-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <CardDescription className="text-gray-500 text-xs uppercase tracking-wider mb-1">Completed</CardDescription>
                <CardTitle className="text-3xl font-bold text-primary font-mono">{stats?.paid_invoices || 0}</CardTitle>
                <p className="text-xs text-gray-500 mt-1 font-mono">${calculateTotalPaid()}</p>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-cyan-500/5 via-[#0A0A0B] to-[#050505] border border-cyan-500/20 rounded-2xl overflow-hidden relative group hover:border-cyan-500/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <CardDescription className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Paid</CardDescription>
                <CardTitle className="text-2xl font-bold text-cyan-400 font-mono">${calculateTotalPaid()}</CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary font-mono">All time</span>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6"
        >
          <Card className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-white/10 focus:border-primary/50 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilterStatus('all')}
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  className={filterStatus === 'all' ? 'bg-primary text-black' : 'bg-black/20 border-white/10 text-white hover:bg-white/5'}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilterStatus('pending')}
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  className={filterStatus === 'pending' ? 'bg-yellow-500 text-black' : 'bg-black/20 border-white/10 text-white hover:bg-white/5'}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  onClick={() => setFilterStatus('paid')}
                  variant={filterStatus === 'paid' ? 'default' : 'outline'}
                  className={filterStatus === 'paid' ? 'bg-primary text-black' : 'bg-black/20 border-white/10 text-white hover:bg-white/5'}
                  size="sm"
                >
                  Paid
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Invoices List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="bg-[#0A0A0B] border border-white/5 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-2xl" style={{ fontFamily: 'Space Grotesk' }}>Your Invoices</CardTitle>
                  <CardDescription className="text-gray-500">
                    {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'} found
                  </CardDescription>
                </div>
                <Receipt className="w-6 h-6 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredInvoices.map((invoice, index) => (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 md:p-5 rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                        onClick={() => navigate(`/invoice/${invoice.id}`)}
                        data-testid={`invoice-item-${invoice.id}`}
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">{invoice.description}</h3>
                            <p className="text-sm text-gray-500 font-mono">#{invoice.id.slice(0, 12)}</p>
                            <p className="text-xs text-gray-600 mt-1">{new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white font-mono">
                                {invoice.amount} <span className="text-primary text-base">{invoice.currency}</span>
                              </p>
                            </div>
                            {invoice.status === 'pending' ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 whitespace-nowrap">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono uppercase bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </span>
                            )}
                          </div>
                        </div>
                        {invoice.status === 'paid' && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`${API}/invoices/${invoice.id}/receipt`, '_blank');
                              }}
                              data-testid={`download-receipt-${invoice.id}`}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download Receipt
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientDashboard;
