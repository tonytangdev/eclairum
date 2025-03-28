"use client"

import { useState } from "react"
import { Bell, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type Notification = {
  id: string
  title: string
  message: string
  time: Date
  read: boolean
  type: "info" | "success" | "warning" | "error"
}

// Sample notifications for demonstration
const sampleNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "Quiz Created",
    message: "Your 'Solar System Quiz' has been successfully created.",
    time: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
    type: "success",
  },
  {
    id: "notif-2",
    title: "New Feature",
    message: "Check out our new question editing feature!",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    type: "info",
  },
  {
    id: "notif-3",
    title: "Reminder",
    message: "You haven't studied your 'Biology Terms' quiz in a while.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    type: "warning",
  },
]

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const toggleNotifications = () => {
    setIsOpen(!isOpen)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    }
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "warning":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "info":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={toggleNotifications}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white"
            aria-hidden="true"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] overflow-hidden z-50 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-5 p-0 gap-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                  Mark all as read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn("p-4 relative transition-colors", !notification.read && "bg-muted/30")}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-8">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              "inline-block h-2 w-2 rounded-full",
                              notification.read ? "bg-gray-300 dark:bg-gray-600" : "bg-blue-500",
                            )}
                          />
                          <h4 className="font-medium">{notification.title}</h4>
                        </div>
                        <p
                          className={cn(
                            "text-sm text-muted-foreground mb-2",
                            getNotificationColor(notification.type),
                            "px-2 py-1 rounded-md inline-block",
                          )}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTime(notification.time)}</p>
                      </div>
                      <div className="flex gap-1 absolute top-3 right-3">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-red-500"
                          onClick={() => removeNotification(notification.id)}
                          title="Remove notification"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove notification</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No notifications</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

