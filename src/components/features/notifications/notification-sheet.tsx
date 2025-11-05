/**
 * Notification Sheet Component
 *
 * Mobile sheet component for displaying notifications.
 * Triggered by NotificationFAB on mobile devices.
 *
 * Features:
 * - shadcn Sheet component
 * - Controlled by Zustand store
 * - Accessible keyboard navigation
 * - Smooth animations
 *
 * @module components/features/notifications/notification-sheet
 */

'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/components/primitives/sheet';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';
import { NotificationList } from './notification-list';

export function NotificationSheet() {
  const isSheetOpen = useNotificationStore((state: NotificationStore) => state.isSheetOpen);
  const closeSheet = useNotificationStore((state: NotificationStore) => state.closeSheet);
  // ✅ Select stable state value (not function call)
  const unreadCount = useNotificationStore((state: NotificationStore) => state.unreadCount);

  return (
    <Sheet open={isSheetOpen} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'No new notifications'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 max-h-[calc(80vh-8rem)] overflow-y-auto">
          <NotificationList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
