/**
 * Example implementations for email templates
 * 
 * This file shows how to use each email template in your application.
 * Copy these examples into your actual implementation files.
 */

import { resendService } from '@/src/lib/services/resend.service';
import { PaymentReceipt } from '@/src/emails/templates/payment-receipt';
import { JobPostedConfirmation } from '@/src/emails/templates/job-posted-confirmation';

/**
 * Example 1: Send Payment Receipt
 * 
 * Use this when a payment is successfully processed
 */
export async function sendPaymentReceipt(paymentData: {
  customerEmail: string;
  transactionId: string;
  amount: number;
  items: Array<{ description: string; amount: number }>;
  paymentMethodLast4: string;
  paymentMethodBrand: string;
}) {
  const result = await resendService.sendEmail(
    paymentData.customerEmail,
    `Payment Receipt - ${paymentData.transactionId}`,
    <PaymentReceipt
      email={paymentData.customerEmail}
      receiptNumber={paymentData.transactionId}
      paymentDate={new Date().toISOString()}
      items={paymentData.items}
      subtotal={paymentData.amount}
      tax={paymentData.amount * 0.09} // 9% tax example
      total={paymentData.amount * 1.09}
      currency="USD"
      paymentMethod={{
        type: 'card',
        last4: paymentData.paymentMethodLast4,
        brand: paymentData.paymentMethodBrand,
      }}
      downloadReceiptUrl={`https://claudepro.directory/receipts/${paymentData.transactionId}.pdf`}
    />,
    {
      tags: [
        { name: 'template', value: 'payment_receipt' },
        { name: 'transaction_id', value: paymentData.transactionId },
      ],
    }
  );

  return result;
}

/**
 * Example 2: Send Job Posted Confirmation
 * 
 * Use this when an employer successfully posts a job listing
 */
export async function sendJobPostedConfirmation(jobData: {
  employerEmail: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salaryRange?: string;
  jobSlug: string;
}) {
  const result = await resendService.sendEmail(
    jobData.employerEmail,
    `Your Job is Now Live: ${jobData.jobTitle}`,
    <JobPostedConfirmation
      email={jobData.employerEmail}
      jobTitle={jobData.jobTitle}
      jobDescription={jobData.jobDescription}
      companyName={jobData.companyName}
      location={jobData.location}
      jobType={jobData.jobType}
      experienceLevel={jobData.experienceLevel}
      salaryRange={jobData.salaryRange}
      postedDate={new Date().toISOString()}
      expiresDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()} // 30 days from now
      jobUrl={`https://claudepro.directory/jobs/${jobData.jobSlug}`}
      editJobUrl={`https://claudepro.directory/jobs/${jobData.jobSlug}/edit`}
      manageApplicationsUrl={`https://claudepro.directory/jobs/${jobData.jobSlug}/applications`}
      jobId={jobData.jobId}
    />,
    {
      tags: [
        { name: 'template', value: 'job_posted' },
        { name: 'job_id', value: jobData.jobId },
        { name: 'job_type', value: jobData.jobType },
      ],
    }
  );

  return result;
}

/**
 * Example 3: Preview Template Rendering (without sending)
 * 
 * Useful for testing or generating HTML for other purposes
 */
export async function previewPaymentReceipt() {
  const { renderEmail } = await import('@/src/emails/utils/render');

  const rendered = await renderEmail(
    <PaymentReceipt
      email="preview@example.com"
      receiptNumber="RCP-2025-PREVIEW"
      paymentDate={new Date().toISOString()}
      items={[
        { description: 'Premium Job Listing (30 days)', amount: 99.0 },
        { description: 'Featured Placement', amount: 49.0 },
      ]}
      subtotal={148.0}
      tax={13.32}
      total={161.32}
      currency="USD"
      paymentMethod={{
        type: 'card',
        last4: '4242',
        brand: 'Visa',
      }}
      billingName="John Doe"
      billingAddress={{
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States',
      }}
    />,
    { plainText: true }
  );

  if (rendered.success) {
    console.log('HTML:', rendered.html);
    console.log('Plain Text:', rendered.text);
  }

  return rendered;
}

/**
 * Example 4: Batch Send (for campaigns)
 * 
 * Send emails to multiple recipients with rate limiting
 */
export async function sendJobPostingReminders() {
  // Get all users with expiring job postings
  const expiringJobs = await getExpiringJobPostings(); // Your DB query

  const results = await resendService.sendBatchEmails(
    expiringJobs.map((job) => job.employerEmail),
    'Your Job Listing is Expiring Soon',
    // Note: Create a separate template for this use case
    <JobPostedConfirmation {...expiringJobs[0]} />, // Simplified example
    {
      tags: [
        { name: 'campaign', value: 'job_expiring_reminder' },
        { name: 'batch', value: new Date().toISOString() },
      ],
      delayMs: 1000, // 1 second delay between batches
    }
  );

  console.log(`Sent: ${results.success}, Failed: ${results.failed}`);
  return results;
}

/**
 * Example 5: Server Action for Payment Receipt
 * 
 * Use in Next.js server actions
 */
export async function handlePaymentSuccess(paymentData: {
  customerEmail: string;
  transactionId: string;
  amount: number;
}) {
  'use server';

  try {
    const emailResult = await sendPaymentReceipt({
      customerEmail: paymentData.customerEmail,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      items: [{ description: 'Payment', amount: paymentData.amount }],
      paymentMethodLast4: '4242',
      paymentMethodBrand: 'Visa',
    });

    if (!emailResult.success) {
      console.error('Failed to send receipt email:', emailResult.error);
      // Handle error but don't fail the payment
    }

    return { success: true, emailSent: emailResult.success };
  } catch (error) {
    console.error('Payment success handler error:', error);
    return { success: false, error: 'Failed to process payment confirmation' };
  }
}

/**
 * Example 6: API Route for Job Posting
 * 
 * Use in Next.js API routes
 */
export async function POST(request: Request) {
  try {
    const jobData = await request.json();

    // Save job to database
    const savedJob = await saveJobToDatabase(jobData); // Your DB logic

    // Send confirmation email
    const emailResult = await sendJobPostedConfirmation({
      employerEmail: jobData.employerEmail,
      jobId: savedJob.id,
      jobTitle: jobData.title,
      jobDescription: jobData.description,
      companyName: jobData.companyName,
      location: jobData.location,
      jobType: jobData.jobType,
      experienceLevel: jobData.experienceLevel,
      salaryRange: jobData.salaryRange,
      jobSlug: savedJob.slug,
    });

    return Response.json({
      success: true,
      jobId: savedJob.id,
      emailSent: emailResult.success,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to create job posting' },
      { status: 500 }
    );
  }
}

// Placeholder functions - implement these based on your database
async function getExpiringJobPostings() {
  // Your database query logic
  return [];
}

async function saveJobToDatabase(jobData: any) {
  // Your database save logic
  return { id: 'job-123', slug: 'example-job' };
}
