import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/constants';
import type { NotificationResponse, NotificationType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, AlertOctagon, Activity, Bell, Info, Check } from 'lucide-react';

const NOTIFICATION_ICON_MAP: Record<NotificationType, typeof AlertTriangle> = {
  BUDGET_WARNING: AlertTriangle,
  BUDGET_EXCEEDED: AlertOctagon,
  ANOMALY: Activity,
  BILL_REMINDER: Bell,
  SYSTEM: Info,
};

function getNotificationIcon(type: NotificationType) {
  return NOTIFICATION_ICON_MAP[type] ?? Bell;
}

function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: NotificationResponse;
  onMarkAsRead: (id: number) => void;
}) {
  const Icon = getNotificationIcon(notification.type);
  const isUnread = !notification.isRead;

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isUnread
          ? 'border-l-4 border-l-primary bg-primary/5 hover:bg-primary/10'
          : 'border-l-4 border-l-transparent hover:bg-muted/50'
      }`}
      onClick={() => {
        if (isUnread) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isUnread ? 'bg-primary/10' : 'bg-muted'
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              isUnread ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm ${isUnread ? 'font-bold' : 'font-medium'}`}>
              {notification.title}
            </p>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs">
              {notification.type.replace(/_/g, ' ')}
            </Badge>
            {isUnread && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                New
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadNotifications = notifications?.filter((n) => !n.isRead) ?? [];

  function handleMarkAsRead(id: number) {
    markAsRead.mutate(id);
  }

  function handleMarkAllAsRead() {
    markAllAsRead.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your budgets, spending, and account activity.
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : !notifications?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No notifications
            </p>
            <p className="text-sm text-muted-foreground">
              You're all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
