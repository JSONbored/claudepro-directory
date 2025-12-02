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

import { overflow, maxHeight, marginTop } from '@heyclaude/web-runtime/design-system';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@heyclaude/web-runtime/ui';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';
import { NotificationList } from './notification-list';

export function NotificationSheet() {
  const { isSheetOpen, closeSheet, unreadCount, flags } = useNotificationsContext();

  if (!flags.enableSheet) return null;

  return (
    <Sheet open={isSheetOpen} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent side="bottom" className={maxHeight.modal}>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'No new notifications'}
          </SheetDescription>
        </SheetHeader>
        <div className={`${marginTop.comfortable} ${maxHeight.notification} ${overflow.yAuto}`}>
          <NotificationList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
