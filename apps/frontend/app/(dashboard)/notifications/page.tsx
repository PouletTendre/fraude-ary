"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PageTransition } from "@/components/ui/PageTransition";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/components/ui/Toast";
import { Bell, CheckCheck, Clock, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "error":
    case "alert":
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case "success":
      return <CheckCircle className="w-5 h-5 text-gain" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "info":
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

function NotificationItem({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: (id: number) => void }) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border transition-colors",
        notification.read
          ? "bg-surface-sunken/50 border-border"
          : "bg-surface border-blue-100 bg-surface-sunken border-primary/20 shadow-sm"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn("font-medium text-sm", !notification.read && "text-text-primary")}>
              {notification.title}
            </p>
            <p className="text-sm text-text-tertiary mt-0.5">
              {notification.message}
            </p>
          </div>
          {!notification.read && (
            <Badge variant="info" className="flex-shrink-0">
              New
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-xs text-text-muted dark:text-text-tertiary">
            <Clock className="w-3 h-3" />
            <span>{new Date(notification.created_at).toLocaleString("fr-FR")}</span>
          </div>
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="text-xs text-primary hover:text-primary-hover dark:text-primary-hover hover:text-primary-hover font-medium"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, isLoading, unreadCount, markAllAsRead, markAsRead, isMarkingAll } = useNotifications();
  const { addToast } = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const handleMarkAllAsRead = () => {
    markAllAsRead(undefined, {
      onSuccess: () => addToast("All notifications marked as read", "success"),
      onError: () => addToast("Failed to mark all as read", "error"),
    });
  };

  const handleMarkAsRead = (id: number) => {
    markAsRead(id, {
      onSuccess: () => addToast("Notification marked as read", "success"),
      onError: () => addToast("Failed to mark as read", "error"),
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notifications
            </h1>
            <p className="text-text-tertiary mt-1">
              {unreadCount > 0 ? (
                <span>
                  You have <span className="font-medium text-primary">{unreadCount}</span> unread notification{unreadCount > 1 ? "s" : ""}
                </span>
              ) : (
                "All caught up! No unread notifications."
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              {isMarkingAll ? "Marking..." : "Mark all as read"}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
              filter === "all"
                ? "bg-blue-600 text-white"
                : "text-text-secondary hover:bg-surface-raised bg-surface-sunken text-text-secondary hover:bg-surface-raised"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
              filter === "unread"
                ? "bg-blue-600 text-white"
                : "text-text-secondary hover:bg-surface-raised bg-surface-sunken text-text-secondary hover:bg-surface-raised"
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="w-12 h-12 text-text-muted dark:text-text-secondary mx-auto mb-4" />
              <p className="text-text-tertiary text-lg font-medium">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-sm text-text-muted dark:text-text-tertiary mt-1">
                {filter === "unread"
                  ? "You have read all your notifications."
                  : "Notifications about your portfolio will appear here."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
