import { Outlet, useLocation, Link } from 'react-router';
import { DesktopSidebar } from './desktop-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { TopBar } from './top-bar';
import ShaderBackground from '@/components/ui/shader-background';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useLogout } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceAssistant } from '@/components/voice/voice-assistant';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ArrowRightLeft,
  Target,
  HandCoins,
  BarChart3,
  CalendarDays,
  Users,
  Brain,
  Bell,
  Car,
  Home,
  UserCircle,
  LogOut,
} from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/accounts': 'Accounts',
  '/transactions': 'Transactions',
  '/transfers': 'Transfers',
  '/budgets': 'Budgets',
  '/debts': 'Debts',
  '/analytics': 'Analytics',
  '/calendar': 'Calendar',
  '/family': 'Family',
  '/ai-insights': 'AI Insights',
  '/notifications': 'Notifications',
  '/cars': 'My Cars',
  '/houses': 'My Houses',
  '/settings': 'Profile',
};

const mobileNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', icon: Wallet },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/transfers', label: 'Transfers', icon: ArrowRightLeft },
  { path: '/budgets', label: 'Budgets', icon: Target },
  { path: '/debts', label: 'Debts', icon: HandCoins },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/family', label: 'Family', icon: Users },
  { path: '/ai-insights', label: 'AI Insights', icon: Brain },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/cars', label: 'My Cars', icon: Car },
  { path: '/houses', label: 'My Houses', icon: Home },
  { path: '/settings', label: 'Profile', icon: UserCircle },
];

const SIDEBAR_WIDTH = 272; // 17rem

export function AppLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'FinTrack';
  const isDashboard = location.pathname === '/dashboard';
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: unreadCount } = useUnreadCount();

  return (
    <div className="flex h-screen overflow-hidden">
      <ShaderBackground />
      <DesktopSidebar />

      {/* Mobile Sidebar — fixed, slides in from left */}
      <aside
        className="md:hidden fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar backdrop-blur-xl border-r border-white/10"
        style={{
          width: SIDEBAR_WIDTH,
          transform: sidebarOpen ? 'translateX(0)' : `translateX(-100%)`,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="p-6 pb-2 text-2xl font-bold text-primary">FinTrack</div>
        <ScrollArea className="flex-1 px-3 pt-2">
          <nav className="space-y-1">
            {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.path === '/notifications' && unreadCount ? (
                    <span className="ml-auto bg-destructive text-white text-xs rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <Separator />
        <div className="p-4 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.fullName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Backdrop overlay */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-black/50"
        style={{
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main content — pushes right when sidebar opens */}
      <div
        className="flex-1 flex flex-col min-w-0 h-screen md:ml-64"
        style={{
          transform: sidebarOpen ? `translateX(${SIDEBAR_WIDTH}px)` : 'translateX(0)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {!isDashboard && <TopBar title={title} />}
        <main className={isDashboard ? 'flex-1 overflow-y-auto pb-20 md:pb-6' : 'flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6'}>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav outside transformed wrapper so position:fixed works relative to viewport */}
      <MobileBottomNav />
      <VoiceAssistant />
    </div>
  );
}
