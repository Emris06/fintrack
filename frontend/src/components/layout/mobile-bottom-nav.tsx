import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Wallet, Plus, BarChart3, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', icon: Wallet },
  { path: '/transactions', label: 'Add', icon: Plus, isFab: true },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Profile', icon: UserCircle },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/60 backdrop-blur-md z-50 border-t border-white/10">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          if (tab.isFab) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex items-center justify-center -mt-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg"
              >
                <tab.icon className="h-6 w-6" />
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center gap-1 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
