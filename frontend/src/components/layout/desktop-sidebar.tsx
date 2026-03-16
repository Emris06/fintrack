import { Link, useLocation } from 'react-router';
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
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useLogout } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const navItems = [
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

export function DesktopSidebar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: unreadCount } = useUnreadCount();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar backdrop-blur-xl h-screen fixed top-0 left-0 z-40 border-r border-white/10">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">FinTrack</h1>
      </div>
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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
  );
}
