import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut, Users, FileText, Clock, CheckCircle, UserCog } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: getAuthHeaders()
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
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
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }} data-testid="admin-dashboard-title">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage staff and invoices</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-border text-foreground"
            data-testid="admin-logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="crypto-card" data-testid="admin-total-invoices-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-muted-foreground">Total Invoices</CardDescription>
                  <CardTitle className="text-3xl text-white">{stats?.total_invoices || 0}</CardTitle>
                </div>
                <FileText className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardHeader>
          </Card>

          <Card className="crypto-card" data-testid="admin-pending-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-muted-foreground">Pending</CardDescription>
                  <CardTitle className="text-3xl text-yellow-400">{stats?.pending_invoices || 0}</CardTitle>
                </div>
                <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
              </div>
            </CardHeader>
          </Card>

          <Card className="crypto-card" data-testid="admin-paid-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-muted-foreground">Paid</CardDescription>
                  <CardTitle className="text-3xl text-primary">{stats?.paid_invoices || 0}</CardTitle>
                </div>
                <CheckCircle className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardHeader>
          </Card>

          <Card className="crypto-card" data-testid="admin-staff-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-muted-foreground">Staff Members</CardDescription>
                  <CardTitle className="text-3xl text-secondary">{stats?.total_staff || 0}</CardTitle>
                </div>
                <Users className="w-8 h-8 text-secondary opacity-50" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="crypto-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/admin/staff')}
            data-testid="manage-staff-card"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Manage Staff</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Add and manage staff members with crypto addresses
                  </CardDescription>
                </div>
                <UserCog className="w-12 h-12 text-secondary opacity-30" />
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" data-testid="go-to-staff-button">
                Go to Staff Management
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="crypto-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/admin/invoices')}
            data-testid="manage-invoices-card"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Manage Invoices</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Create and track payment invoices
                  </CardDescription>
                </div>
                <FileText className="w-12 h-12 text-primary opacity-30" />
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" data-testid="go-to-invoices-button">
                Go to Invoice Management
              </Button>
            </CardContent>
          </Card>

          <Card className="crypto-card" data-testid="clients-info-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Total Clients</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Registered client accounts
                  </CardDescription>
                </div>
                <Users className="w-12 h-12 text-primary opacity-30" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{stats?.total_clients || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
