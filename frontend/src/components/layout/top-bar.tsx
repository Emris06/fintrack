import { Link } from 'react-router';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useAppStore } from '@/store/app-store';

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { data: unreadCount } = useUnreadCount();
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <header className="sticky top-0 z-40 bg-card/60 backdrop-blur-md px-4 md:px-6 h-14 flex items-center gap-4 border-b border-white/10">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold flex-1">{title}</h1>
      <Link to="/notifications" className="relative">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          {unreadCount ? (
            <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </Link>
    </header>
  );
}
