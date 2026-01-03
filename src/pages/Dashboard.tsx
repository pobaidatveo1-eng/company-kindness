import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const role = userRole?.role || 'employee';

  switch (role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

export default Dashboard;
