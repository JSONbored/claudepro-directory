/**
 * Payment Receipt Email Template
 * Sent when a payment is successfully processed
 *
 * Features:
 * - Transaction details
 * - Itemized breakdown
 * - Payment method information
 * - Professional receipt format
 * - Downloadable receipt link
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { BaseLayout } from '../layouts/base-layout';
import {
  contentSection,
  dividerStyle,
  headingStyle,
  heroSection,
  labelCellStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
  subheadingStyle,
  successBadgeStyle,
  tableCellStyle,
  valueCellStyle,
} from '../utils/common-styles';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme';

/**
 * Line item for payment receipt
 */
export interface ReceiptLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

/**
 * Payment method details
 */
export interface PaymentMethodDetails {
  type: 'card' | 'paypal' | 'bank_transfer' | 'other';
  last4?: string; // Last 4 digits of card
  brand?: string; // e.g., 'Visa', 'Mastercard'
  description?: string; // For other payment types
}

/**
 * Props for PaymentReceipt email
 */
export interface PaymentReceiptProps {
  /**
   * Customer's email address
   */
  email: string;

  /**
   * Receipt/Transaction number
   */
  receiptNumber: string;

  /**
   * Payment date (ISO string or formatted string)
   */
  paymentDate: string;

  /**
   * Line items purchased
   */
  items: ReceiptLineItem[];

  /**
   * Subtotal amount (before tax/fees)
   */
  subtotal: number;

  /**
   * Tax amount
   */
  tax?: number;

  /**
   * Total amount paid
   */
  total: number;

  /**
   * Currency code (e.g., 'USD', 'EUR')
   * @default 'USD'
   */
  currency?: string;

  /**
   * Payment method details
   */
  paymentMethod: PaymentMethodDetails;

  /**
   * Billing name
   */
  billingName?: string;

  /**
   * Billing address
   */
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };

  /**
   * Link to download PDF receipt
   */
  downloadReceiptUrl?: string;

  /**
   * Customer support contact
   */
  supportEmail?: string;
}

/**
 * PaymentReceipt Email Component
 *
 * Professional receipt email for payment confirmation.
 *
 * @example
 * ```tsx
 * <PaymentReceipt
 *   email="customer@example.com"
 *   receiptNumber="RCP-2025-001234"
 *   paymentDate="2025-10-06"
 *   items={[...]}
 *   subtotal={99.00}
 *   tax={8.91}
 *   total={107.91}
 *   paymentMethod={{ type: 'card', last4: '4242', brand: 'Visa' }}
 * />
 * ```
 */
export function PaymentReceipt({
  email,
  receiptNumber,
  paymentDate,
  items,
  subtotal,
  tax = 0,
  total,
  currency = 'USD',
  paymentMethod,
  billingName,
  billingAddress,
  downloadReceiptUrl,
  supportEmail = 'support@claudepro.directory',
}: PaymentReceiptProps) {
  const formattedDate = formatDate(paymentDate);
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <BaseLayout
      preview={`Payment Receipt - ${receiptNumber} | ${currencySymbol}${total.toFixed(2)}`}
    >
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={successBadgeStyle}>✓ Payment Successful</Text>
        <Text style={headingStyle}>Payment Receipt</Text>
        <Text style={subheadingStyle}>
          Thank you for your payment. Your transaction has been completed successfully.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Receipt Details */}
      <Section style={receiptDetailsSection}>
        <table style={detailsTableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>Receipt Number:</td>
              <td style={valueCellStyle}>
                <strong style={strongStyle}>{receiptNumber}</strong>
              </td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Payment Date:</td>
              <td style={valueCellStyle}>{formattedDate}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Email:</td>
              <td style={valueCellStyle}>{email}</td>
            </tr>
            {billingName && (
              <tr>
                <td style={labelCellStyle}>Billing Name:</td>
                <td style={valueCellStyle}>{billingName}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Hr style={dividerStyle} />

      {/* Line Items */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>Items</Text>

        <table style={itemsTableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeaderCellStyle}>Description</th>
              {items.some((item) => item.quantity) && (
                <th style={{ ...tableHeaderCellStyle, textAlign: 'center' }}>Qty</th>
              )}
              <th style={{ ...tableHeaderCellStyle, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.description}-${item.amount}-${index}`} style={tableRowStyle}>
                <td style={tableCellStyle}>{item.description}</td>
                {items.some((i) => i.quantity) && (
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>{item.quantity || '-'}</td>
                )}
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                  {currencySymbol}
                  {item.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Totals */}
      <Section style={totalsSection}>
        <table style={totalsTableStyle}>
          <tbody>
            <tr>
              <td style={totalLabelStyle}>Subtotal:</td>
              <td style={totalValueStyle}>
                {currencySymbol}
                {subtotal.toFixed(2)}
              </td>
            </tr>
            {tax > 0 && (
              <tr>
                <td style={totalLabelStyle}>Tax:</td>
                <td style={totalValueStyle}>
                  {currencySymbol}
                  {tax.toFixed(2)}
                </td>
              </tr>
            )}
            <tr style={totalRowStyle}>
              <td style={totalLabelBoldStyle}>Total Paid:</td>
              <td style={totalValueBoldStyle}>
                {currencySymbol}
                {total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Hr style={dividerStyle} />

      {/* Payment Method */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>Payment Method</Text>
        <Section style={paymentMethodCard}>
          <Text style={paymentMethodTextStyle}>{formatPaymentMethod(paymentMethod)}</Text>
        </Section>
      </Section>

      {/* Billing Address */}
      {billingAddress && (
        <>
          <Hr style={dividerStyle} />
          <Section style={contentSection}>
            <Text style={sectionTitleStyle}>Billing Address</Text>
            <Section style={addressCard}>
              <Text style={addressTextStyle}>{billingAddress.line1}</Text>
              {billingAddress.line2 && <Text style={addressTextStyle}>{billingAddress.line2}</Text>}
              <Text style={addressTextStyle}>
                {billingAddress.city}
                {billingAddress.state && `, ${billingAddress.state}`} {billingAddress.postalCode}
              </Text>
              <Text style={addressTextStyle}>{billingAddress.country}</Text>
            </Section>
          </Section>
        </>
      )}

      <Hr style={dividerStyle} />

      {/* Actions */}
      <Section style={actionsSection}>
        {downloadReceiptUrl && (
          <Button href={downloadReceiptUrl} style={primaryButtonStyle}>
            Download PDF Receipt
          </Button>
        )}
        <Button href="https://claudepro.directory/account/billing" style={secondaryButtonStyle}>
          View Billing History
        </Button>
      </Section>

      {/* Support Section */}
      <Section style={supportSection}>
        <Text style={supportTextStyle}>
          Questions about this payment? Contact us at{' '}
          <a href={`mailto:${supportEmail}`} style={linkStyle}>
            {supportEmail}
          </a>
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Helper functions
 */

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
  };
  return symbols[currency.toUpperCase()] || currency;
}

function formatPaymentMethod(method: PaymentMethodDetails): string {
  switch (method.type) {
    case 'card':
      return `${method.brand || 'Card'} ending in ${method.last4 || '••••'}`;
    case 'paypal':
      return 'PayPal';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'other':
      return method.description || 'Other Payment Method';
    default:
      return 'Payment Method';
  }
}

/**
 * Email-safe inline styles
 */

const receiptDetailsSection: React.CSSProperties = {
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const detailsTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const itemsTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: spacing.md,
};

const tableHeaderRowStyle: React.CSSProperties = {
  borderBottom: `2px solid ${emailTheme.borderDefault}`,
};

const tableHeaderCellStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  padding: `${spacing.sm} ${spacing.md}`,
  textAlign: 'left',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: `1px solid ${emailTheme.borderLight}`,
};

const totalsSection: React.CSSProperties = {
  marginTop: spacing.md,
  marginBottom: spacing.lg,
};

const totalsTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: spacing.md,
};

const totalLabelStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  padding: `${spacing.xs} ${spacing.sm}`,
  textAlign: 'right',
};

const totalValueStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  padding: `${spacing.xs} ${spacing.sm}`,
  textAlign: 'right',
  width: '30%',
};

const totalRowStyle: React.CSSProperties = {
  borderTop: `2px solid ${emailTheme.borderDefault}`,
};

const totalLabelBoldStyle: React.CSSProperties = {
  ...totalLabelStyle,
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  paddingTop: spacing.md,
};

const totalValueBoldStyle: React.CSSProperties = {
  ...totalValueStyle,
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  paddingTop: spacing.md,
};

const paymentMethodCard: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  border: `1px solid ${emailTheme.borderDefault}`,
  borderRadius: borderRadius.md,
  padding: spacing.md,
  marginTop: spacing.sm,
};

const paymentMethodTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  margin: 0,
};

const addressCard: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  border: `1px solid ${emailTheme.borderDefault}`,
  borderRadius: borderRadius.md,
  padding: spacing.md,
  marginTop: spacing.sm,
};

const addressTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  margin: `${spacing.xs} 0`,
  lineHeight: typography.lineHeight.relaxed,
};

const actionsSection: React.CSSProperties = {
  textAlign: 'center',
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const supportSection: React.CSSProperties = {
  marginTop: spacing.lg,
  textAlign: 'center',
};

const supportTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  color: brandColors.primary,
  textDecoration: 'none',
};

/**
 * Export default for easier imports
 */
export default PaymentReceipt;
