'use client';

/**
 * Billing History Component
 * Displays user billing history and invoices
 */

interface BillingHistoryProps {
  userId: string;
}

export function BillingHistory({ userId }: BillingHistoryProps) {
  // For now, show placeholder
  // In production, this would fetch from a billing/invoices table or payment processor API

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-sm">
        <p>No billing history available.</p>
        <p className="mt-2">
          Billing history will appear here once you have active subscriptions or paid invoices.
        </p>
      </div>
    </div>
  );
}
