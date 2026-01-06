import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut, FileText, Clock, CheckCircle, Wallet, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StaffDashboard = () => {
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
        <motion.div 
          className="text-white"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }} data-testid="staff-dashboard-title">
              Staff Dashboard
            </h1>
            <p className="text-gray-400">Welcome back, <span className="text-primary font-semibold">{user?.full_name}</span></p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 rounded-full"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#0A0A0B] to-[#050505] border border-white/5 rounded-2xl overflow-hidden relative group hover:border-primary/30 transition-all duration-300" data-testid="total-invoices-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-gray-500 text-sm mb-1">Total Invoices</CardDescription>
                    <CardTitle className="text-4xl font-bold text-white font-mono">{stats?.total_invoices || 0}</CardTitle>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#0A0A0B] to-[#050505] border border-white/5 rounded-2xl overflow-hidden relative group hover:border-yellow-500/30 transition-all duration-300" data-testid="pending-invoices-card">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-gray-500 text-sm mb-1">Pending</CardDescription>
                    <CardTitle className="text-4xl font-bold text-yellow-400 font-mono">{stats?.pending_invoices || 0}</CardTitle>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#0A0A0B] to-[#050505] border border-white/5 rounded-2xl overflow-hidden relative group hover:border-primary/30 transition-all duration-300" data-testid="paid-invoices-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-gray-500 text-sm mb-1">Completed</CardDescription>
                    <CardTitle className="text-4xl font-bold text-primary font-mono">{stats?.paid_invoices || 0}</CardTitle>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </motion.div>

        {/* Earnings Section */}
        {stats?.earnings && stats.earnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-[#0A0A0B] via-[#0A0A0B] to-primary/5 border border-primary/20 rounded-2xl mb-8 overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-white text-2xl" style={{ fontFamily: 'Space Grotesk' }}>
                    Your Earnings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.earnings.map((earning, index) => (
                    <motion.div
                      key={earning._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="relative p-6 bg-black/20 rounded-xl border border-white/5 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm text-gray-400 font-medium">{earning._id}</span>
                        <TrendingUp className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-3xl font-bold text-primary font-mono">{earning.total}</p>
                      <div className="mt-2 h-1 bg-primary/20 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        ></motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Invoices List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="bg-[#0A0A0B] border border-white/5 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white text-2xl" style={{ fontFamily: 'Space Grotesk' }}>Your Invoices</CardTitle>
              <CardDescription className="text-gray-500">Track all your assigned invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice, index) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="p-4 md:p-5 rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => navigate(`/invoice/${invoice.id}`)}
                      data-testid={`invoice-item-${invoice.id}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">{invoice.description}</h3>
                          <p className="text-sm text-gray-500 font-mono">#{invoice.id.slice(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white font-mono">
                              {invoice.amount} <span className="text-primary text-lg">{invoice.currency}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(invoice.created_at).toLocaleDateString()}</p>
                          </div>
                          {invoice.status === 'pending' ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono uppercase bg-primary/10 text-primary border border-primary/20">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </span>
                          )}
                          <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default StaffDashboard;