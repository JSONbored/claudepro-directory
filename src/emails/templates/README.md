# Email Templates

This directory contains all React Email templates for ClaudePro Directory.

## Available Templates

### 📧 Newsletter & Onboarding

1. **newsletter-welcome.tsx** - Welcome email sent on newsletter signup
2. **onboarding-getting-started.tsx** - Day 2: Getting started guide
3. **onboarding-power-tips.tsx** - Day 5: Power user tips
4. **onboarding-community.tsx** - Day 9: Community engagement
5. **onboarding-stay-engaged.tsx** - Day 14: Long-term engagement

### 📊 Digest & Updates

6. **weekly-digest.tsx** - Weekly newsletter with new/trending content

### 💳 Transactional

7. **payment-receipt.tsx** - Payment confirmation and receipt
8. **job-posted-confirmation.tsx** - Job posting confirmation

## Development

### Preview Templates Locally

Start the React Email development server:

```bash
npm run email:dev
```

This will open a browser at `http://localhost:3001` showing all templates with live preview and hot reload.

### Send Test Emails

#### Using ResendService

```typescript
import { resendService } from '@/src/lib/services/resend.service';
import { PaymentReceipt } from '@/src/emails/templates/payment-receipt';

// Send test payment receipt
const result = await resendService.sendEmail(
  'test@example.com',
  'Payment Receipt',
  <PaymentReceipt
    email="test@example.com"
    receiptNumber="RCP-2025-001234"
    paymentDate="2025-10-06"
    items={[
      { description: 'Premium Job Listing', amount: 99.00 }
    ]}
    subtotal={99.00}
    tax={8.91}
    total={107.91}
    paymentMethod={{ type: 'card', last4: '4242', brand: 'Visa' }}
  />,
  {
    tags: [
      { name: 'template', value: 'payment_receipt' },
      { name: 'environment', value: 'test' }
    ]
  }
);
```

#### Job Posted Confirmation

```typescript
import { JobPostedConfirmation } from '@/src/emails/templates/job-posted-confirmation';

const result = await resendService.sendEmail(
  'employer@example.com',
  'Your Job is Now Live!',
  <JobPostedConfirmation
    email="employer@example.com"
    jobTitle="Senior React Developer"
    jobDescription="We're looking for an experienced React developer to join our team..."
    companyName="Acme Corp"
    location="Remote"
    jobType="full-time"
    experienceLevel="senior"
    salaryRange="$120k - $160k"
    postedDate={new Date().toISOString()}
    jobUrl="https://claudepro.directory/jobs/senior-react-dev"
    editJobUrl="https://claudepro.directory/jobs/senior-react-dev/edit"
    manageApplicationsUrl="https://claudepro.directory/jobs/senior-react-dev/applications"
    jobId="JOB-001234"
  />
);
```

### Render Without Sending

```typescript
import { renderEmail } from '@/src/emails/utils/render';
import { PaymentReceipt } from '@/src/emails/templates/payment-receipt';

// Get HTML and plain text
const rendered = await renderEmail(
  <PaymentReceipt {...props} />,
  { plainText: true }
);

if (rendered.success) {
  console.log(rendered.html); // HTML version
  console.log(rendered.text);  // Plain text version
}
```

## Template Structure

Each template follows this structure:

```tsx
/**
 * Template description and features
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { BaseLayout } from '../layouts/base-layout';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme';

// TypeScript interface for props
export interface TemplateNameProps {
  email: string;
  // ... other props
}

// Component
export function TemplateName({ email, ...props }: TemplateNameProps) {
  return (
    <BaseLayout preview="Preview text for inbox">
      {/* Template content */}
    </BaseLayout>
  );
}

// Inline styles (required for email clients)
const styles: React.CSSProperties = {
  // ...
};

// Default export
export default TemplateName;
```

## Styling Guidelines

### Use Email-Safe Styles

✅ **DO:**
- Use inline styles (`style={{ ... }}`)
- Use RGB/HEX colors (no OKLCH)
- Use simple layouts (tables, divs, sections)
- Test across email clients

❌ **DON'T:**
- Use CSS classes
- Use flexbox/grid extensively
- Use CSS variables
- Use modern CSS features

### Theme System

Import theme constants for consistency:

```typescript
import {
  borderRadius,    // Border radius values
  brandColors,     // Brand color palette
  emailTheme,      // Dark theme colors
  spacing,         // Spacing scale (8px grid)
  typography       // Font sizes, weights, families
} from '../utils/theme';
```

## Email Client Compatibility

All templates are tested across:
- ✅ Gmail (Web, iOS, Android)
- ✅ Apple Mail (macOS, iOS)
- ✅ Outlook (Windows, macOS, Web)
- ✅ Yahoo Mail
- ✅ ProtonMail

## Best Practices

1. **Preview Text**: Always set a meaningful preview (50-100 chars)
2. **Mobile-First**: Design for mobile screens (max-width: 600px)
3. **Alt Text**: Add alt text for images
4. **Clear CTAs**: Make buttons obvious and tappable
5. **Accessibility**: Use semantic HTML and good color contrast
6. **Testing**: Preview in multiple clients before production

## Integration with Resend

### Automated Flows

Templates are automatically used in:

1. **Newsletter Signup** → `newsletter-welcome.tsx`
2. **Onboarding Sequence** → All onboarding templates (automated via cron)
3. **Weekly Digest** → `weekly-digest.tsx` (Mondays 2 PM UTC)

### Manual Sending

Use `resendService` for transactional emails:

```typescript
import { resendService } from '@/src/lib/services/resend.service';

await resendService.sendEmail(to, subject, template, options);
```

### Batch Sending

For campaigns or bulk emails:

```typescript
const subscribers = await resendService.getAllContacts();

const results = await resendService.sendBatchEmails(
  subscribers,
  'Subject',
  <Template />,
  { tags: [...], delayMs: 1000 }
);
```

## Environment Variables

Required environment variables in `.env`:

```bash
RESEND_API_KEY=re_xxx           # Resend API key
RESEND_AUDIENCE_ID=xxx          # Default audience ID
RESEND_WEBHOOK_SECRET=whsec_xxx # Webhook signing secret
```

## Resources

- [React Email Documentation](https://react.email/docs)
- [Resend API Docs](https://resend.com/docs)
- [Email Client Support](https://www.caniemail.com/)
- [Testing Tools](https://litmus.com/)
