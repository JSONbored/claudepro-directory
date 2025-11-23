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

import { DIMENSIONS } from '@heyclaude/web-runtime';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/components/primitives/ui/sheet';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';
import { NotificationList } from './notification-list';

export function NotificationSheet() {
  const { isSheetOpen, closeSheet, unreadCount, flags } = useNotificationsContext();

  if (!flags.enableSheet) return null;

  return (
    <Sheet open={isSheetOpen} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent side="bottom" className={DIMENSIONS.MODAL_MAX}>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'No new notifications'}
          </SheetDescription>
        </SheetHeader>
        <div className={`mt-6 ${DIMENSIONS.NOTIFICATION_MAX} overflow-y-auto`}>
          <NotificationList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
