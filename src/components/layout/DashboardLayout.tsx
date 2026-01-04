import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions, AVAILABLE_PERMISSIONS } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { 
  Zap, 
  LogOut, 
  User,
  ClipboardList,
  Calendar,
  FileText,
  LayoutDashboard,
  AlertTriangle,
  Scale,
  Building2,
  BarChart3,
  Settings,
  Menu,
  Users,
  Briefcase,
  UserPlus,
  Video,
  MessageSquare,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const iconMap: Record<string, any> = {
  dashboard: Building2,
  tasks: ClipboardList,
  leads: UserPlus,
  meetings: Video,
  chat: MessageSquare,
  clients: Users,
  contracts: Briefcase,
  'ai-insights': BarChart3,
  settings: Settings,
  events: Calendar,
  manual: FileText,
  account: User,
};

const DashboardLayout = () => {
  const { t, dir, language } = useLanguage();
  const { profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { data: userPermissions = [] } = useMyPermissions();

  const role = userRole?.role || 'employee';
  const roleStr = role as string;
  const isAdminOrSuper = roleStr === 'super_admin' || roleStr === 'admin';

  const getMenuItems = () => {
    const allMenuItems = [
      { title: t('nav.dashboard'), icon: Building2, path: '/dashboard', key: 'dashboard' },
      { title: t('nav.tasks'), icon: ClipboardList, path: '/dashboard/tasks', key: 'tasks' },
      { title: t('nav.leads'), icon: UserPlus, path: '/dashboard/leads', key: 'leads' },
      { title: t('nav.meetings'), icon: Video, path: '/dashboard/meetings', key: 'meetings' },
      { title: t('nav.chat'), icon: MessageSquare, path: '/dashboard/chat', key: 'chat' },
      { title: t('nav.clients'), icon: Users, path: '/dashboard/clients', key: 'clients' },
      { title: t('nav.contracts'), icon: Briefcase, path: '/dashboard/contracts', key: 'contracts' },
      { title: t('nav.aiInsights'), icon: BarChart3, path: '/dashboard/ai-insights', key: 'ai-insights' },
      { title: t('dashboard.companySettings'), icon: Settings, path: '/dashboard/settings', key: 'settings' },
    ];

    // For admins, show all menu items
    if (isAdminOrSuper) {
      return allMenuItems;
    }

    // For other roles, filter based on permissions
    return allMenuItems.filter(item => userPermissions.includes(item.key));
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">{t('app.name')}</h1>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{profile?.full_name || 'المستخدم'}</p>
            <p className="text-xs text-muted-foreground">{t(`role.${role}`)}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{item.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-center gap-2">
          <NotificationBell />
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 me-2" />
          {t('auth.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex" dir={dir}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-e border-sidebar-border flex-col">
        <NavContent />
      </aside>

      {/* Mobile Header & Sheet */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">{t('app.name')}</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="p-0 w-72">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
