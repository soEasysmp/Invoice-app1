import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Mail, User, Wallet, Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StaffManagement = () => {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    ltc_address: '',
    usdt_address: '',
    usdc_address: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API}/staff`, {
        headers: getAuthHeaders()
      });
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await axios.put(
          `${API}/staff/${editingStaff.id}`,
          formData,
          { headers: getAuthHeaders() }
        );
        toast.success('Staff updated successfully');
      } else {
        await axios.post(
          `${API}/staff`,
          formData,
          { headers: getAuthHeaders() }
        );
        toast.success('Staff created successfully');
      }
      setDialogOpen(false);
      setEditingStaff(null);
      setFormData({
        name: '',
        email: '',
        ltc_address: '',
        usdt_address: '',
        usdc_address: ''
      });
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error(error.response?.data?.detail || 'Failed to save staff');
    }
  };

  const openEditDialog = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      password: '',
      ltc_address: staffMember.ltc_address || '',
      usdt_address: staffMember.usdt_address || '',
      usdc_address: staffMember.usdc_address || ''
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      ltc_address: '',
      usdt_address: '',
      usdc_address: ''
    });
    setDialogOpen(true);
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
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }} data-testid="staff-management-title">
              Staff Management
            </h1>
            <p className="text-muted-foreground">Manage staff members and their crypto addresses</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" onClick={openCreateDialog} data-testid="add-staff-button">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0B] border-border text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Space Grotesk' }}>
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 bg-background border-input"
                      required
                      data-testid="staff-name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 bg-background border-input"
                      required
                      data-testid="staff-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password {editingStaff && '(leave blank to keep current)'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 bg-background border-input"
                      required={!editingStaff}
                      placeholder={editingStaff ? 'Leave blank to keep current' : 'Create password'}
                      data-testid="staff-password-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ltc" className="text-foreground">Litecoin Address (LTC)</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ltc"
                      value={formData.ltc_address}
                      onChange={(e) => setFormData({ ...formData, ltc_address: e.target.value })}
                      className="pl-10 bg-background border-input font-mono text-sm"
                      placeholder="ltc1q..."
                      data-testid="staff-ltc-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usdt" className="text-foreground">USDT Address (ERC20)</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="usdt"
                      value={formData.usdt_address}
                      onChange={(e) => setFormData({ ...formData, usdt_address: e.target.value })}
                      className="pl-10 bg-background border-input font-mono text-sm"
                      placeholder="0x..."
                      data-testid="staff-usdt-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usdc" className="text-foreground">USDC Address (ERC20)</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="usdc"
                      value={formData.usdc_address}
                      onChange={(e) => setFormData({ ...formData, usdc_address: e.target.value })}
                      className="pl-10 bg-background border-input font-mono text-sm"
                      placeholder="0x..."
                      data-testid="staff-usdc-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-staff-button">
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary" data-testid="save-staff-button">
                    {editingStaff ? 'Update Staff' : 'Create Staff'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="crypto-card">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk' }}>Staff Members</CardTitle>
            <CardDescription className="text-muted-foreground">
              {staff.length} staff member{staff.length !== 1 ? 's' : ''} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No staff members yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-lg bg-[#0A0A0B] border border-border"
                    data-testid={`staff-member-${member.id}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Button
                        onClick={() => openEditDialog(member)}
                        variant="outline"
                        size="sm"
                        data-testid={`edit-staff-${member.id}`}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      {member.ltc_address && (
                        <div>
                          <span className="text-muted-foreground">LTC: </span>
                          <span className="text-white font-mono">{member.ltc_address}</span>
                        </div>
                      )}
                      {member.usdt_address && (
                        <div>
                          <span className="text-muted-foreground">USDT: </span>
                          <span className="text-white font-mono">{member.usdt_address}</span>
                        </div>
                      )}
                      {member.usdc_address && (
                        <div>
                          <span className="text-muted-foreground">USDC: </span>
                          <span className="text-white font-mono">{member.usdc_address}</span>
                        </div>
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

export default StaffManagement;
