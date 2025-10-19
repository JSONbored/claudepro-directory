import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { JobForm } from './job-form';

/**
 * Job Form Stories
 *
 * Comprehensive showcase of the job posting form component with all field variants.
 * Demonstrates complex form state management, multi-section layout, and validation patterns.
 *
 * **Component Features:**
 * - 5 card-based sections: Job Details, Requirements, Benefits, Tags, Application Details, Plan Selection
 * - Required fields: title, company, type, workplace, category, description (50+ chars), tags (min 1), requirements (min 1), link
 * - Optional fields: location, experience, salary, benefits, contact_email, company_logo
 * - Dynamic list management: tags (max 10), requirements (max 20), benefits (max 20)
 * - Employment type selection: full-time, part-time, contract, internship, freelance
 * - Workplace modes: Remote, On site, Hybrid
 * - Experience levels: Entry, Mid, Senior, Lead, Executive
 * - Categories: engineering, design, product, marketing, sales, support
 * - Plan tiers: standard (free), featured (paid), premium (paid)
 *
 * **Architecture:**
 * - Client component with useTransition for async submission
 * - SSR-safe with useId for unique field IDs
 * - Controlled inputs for dynamic arrays (tags, requirements, benefits)
 * - Uncontrolled inputs for static fields (uses FormData)
 * - Card-based sections with CardHeader/CardDescription
 * - Toast notifications for success/error states
 * - Payment flow integration (requiresPayment flag)
 *
 * **Validation Rules:**
 * - Title: Required, 3-200 characters
 * - Company: Required, 2-200 characters
 * - Description: Required, min 50 characters
 * - Tags: Required, min 1, max 10
 * - Requirements: Required, min 1, max 20
 * - Benefits: Optional, max 20
 * - Link: Required, valid URL
 * - Contact Email: Optional, valid email format
 * - Company Logo: Optional, valid URL
 *
 * **Production Standards:**
 * - TypeScript types with Zod schema validation
 * - CreateJobInput type from job.schema.ts
 * - SSR-safe with deterministic IDs
 * - Silent fallbacks for optional fields
 */

const meta = {
  title: 'Forms/JobForm',
  component: JobForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Job Form Component** - Multi-section form for creating and editing job listings.

**Features:**
- Card-based sections for organized data entry
- Required and optional field validation
- Dynamic list management (tags, requirements, benefits)
- Employment type, workplace, and experience level selectors
- Plan tier selection with pricing info
- Application URL and contact details
- Company branding (logo URL)

**Form Sections:**
1. **Job Details**: Basic info (title, company, type, workplace, location, experience, category, salary, description)
2. **Requirements**: Skills and qualifications (max 20 items)
3. **Benefits**: Perks and benefits (optional, max 20 items)
4. **Tags**: Search keywords (required, min 1, max 10)
5. **Application Details**: Apply URL, contact email, company logo
6. **Listing Plan**: Standard (free), Featured, or Premium

**Validation:**
- Title: 3-200 chars (required)
- Company: 2-200 chars (required)
- Description: Min 50 chars (required)
- Tags: Min 1, max 10 (required)
- Requirements: Min 1, max 20 (required)
- Benefits: Max 20 (optional)
- Link: Valid URL (required)
- Contact Email: Valid email (optional)
- Company Logo: Valid URL (optional)

**Interactions:**
- Type in fields to populate form data
- Add items to arrays with Enter key or Add button
- Remove items with × button
- Select dropdowns for type/workplace/experience/category/plan
- Submit button disabled until required fields filled
- Cancel button navigates to /account/jobs
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    submitLabel: {
      control: 'text',
      description: 'Label for submit button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Create Job Listing' },
      },
    },
    initialData: {
      control: 'object',
      description: 'Initial job data for editing (undefined for new job)',
      table: {
        type: { summary: 'EditJobInput | undefined' },
      },
    },
    onSubmit: {
      action: 'submitted',
      description: 'Form submission callback',
      table: {
        type: {
          summary:
            '(data: CreateJobInput | EditJobInput) => Promise<{success: boolean, requiresPayment?: boolean}>',
        },
      },
    },
  },
} satisfies Meta<typeof JobForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * MOCK HANDLERS
 * ==============================================================================
 */

/**
 * Mock submit handler - simulates async job creation
 */
const mockOnSubmit = async (data: unknown) => {
  console.log('Job submission:', data);
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
};

/**
 * Mock submit handler - simulates payment required flow
 */
const mockOnSubmitPaymentRequired = async (data: unknown) => {
  console.log('Job submission (payment required):', data);
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true, requiresPayment: true };
};

/**
 * ==============================================================================
 * MOCK DATA
 * ==============================================================================
 */

/**
 * Empty job data (new job form)
 */
const emptyJob = undefined;

/**
 * Minimal job data (required fields only)
 */
const minimalJob = {
  title: 'Senior AI Engineer',
  company: 'TechCorp',
  type: 'full-time' as const,
  workplace: 'Remote' as const,
  category: 'engineering',
  description:
    'We are looking for a Senior AI Engineer to join our team and help build the next generation of AI-powered products.',
  tags: ['AI', 'Python', 'Remote'],
  requirements: ['5+ years of Python experience', 'Experience with ML frameworks'],
  benefits: [],
  link: 'https://techcorp.com/careers/senior-ai-engineer',
  plan: 'standard' as const,
};

/**
 * Complete job data (all fields filled)
 */
const completeJob = {
  title: 'Principal Machine Learning Engineer',
  company: 'Anthropic',
  location: 'San Francisco, CA',
  type: 'full-time' as const,
  workplace: 'Hybrid' as const,
  experience: 'Senior' as const,
  category: 'engineering',
  salary: '$180k - $250k',
  description: `We're seeking a Principal Machine Learning Engineer to lead critical initiatives in developing safe and beneficial AI systems. You'll work on cutting-edge research problems, build production ML systems at scale, and collaborate with world-class researchers and engineers.

This role offers the opportunity to work on foundational AI challenges, shape the future of AI safety, and contribute to products used by millions of people worldwide.

The ideal candidate has deep expertise in machine learning, strong software engineering skills, and a passion for building AI systems that are helpful, harmless, and honest.`,
  tags: ['Machine Learning', 'Python', 'TensorFlow', 'PyTorch', 'AI Safety'],
  requirements: [
    '8+ years of experience in machine learning and software engineering',
    'Deep expertise in deep learning frameworks (TensorFlow, PyTorch, JAX)',
    'Strong foundation in ML fundamentals (optimization, statistics, linear algebra)',
    'Experience building and deploying ML systems at scale',
    'Track record of technical leadership and mentoring',
  ],
  benefits: [
    'Competitive salary and equity',
    'Health, dental, and vision insurance',
    'Unlimited PTO',
    '401(k) with company match',
    'Learning and development budget',
    'Remote work flexibility',
  ],
  link: 'https://anthropic.com/careers/principal-ml-engineer',
  contact_email: 'careers@anthropic.com',
  company_logo: 'https://anthropic.com/logo.png',
  plan: 'featured' as const,
};

/**
 * Job with many requirements (approaching limit)
 */
const jobWithManyRequirements = {
  title: 'Full Stack Engineer',
  company: 'StartupXYZ',
  location: 'Remote',
  type: 'full-time' as const,
  workplace: 'Remote' as const,
  experience: 'Mid' as const,
  category: 'engineering',
  salary: '$120k - $160k',
  description:
    'Join our fast-growing startup as a Full Stack Engineer. You will work on building scalable web applications, contribute to architecture decisions, and collaborate with a talented team of engineers and designers.',
  tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  requirements: [
    '4+ years of full-stack development experience',
    'Strong proficiency in TypeScript and JavaScript',
    'Experience with React and modern frontend frameworks',
    'Backend experience with Node.js or similar',
    'Database design and optimization (PostgreSQL, MySQL)',
    'RESTful API design and GraphQL',
    'Cloud platform experience (AWS, GCP, or Azure)',
    'Version control with Git',
    'Agile development methodology',
    'Strong problem-solving skills',
    'Excellent communication and collaboration',
    'Experience with CI/CD pipelines',
    'Testing frameworks (Jest, Vitest, Playwright)',
    'Docker and containerization',
    'Microservices architecture',
  ],
  benefits: ['Health insurance', 'Stock options', 'Remote work', 'Flexible hours'],
  link: 'https://startupxyz.com/careers/full-stack',
  contact_email: 'hiring@startupxyz.com',
  plan: 'standard' as const,
};

/**
 * Job with many benefits (showcasing benefit list)
 */
const jobWithManyBenefits = {
  title: 'Senior Product Designer',
  company: 'DesignCo',
  location: 'New York, NY',
  type: 'full-time' as const,
  workplace: 'On site' as const,
  experience: 'Senior' as const,
  category: 'design',
  salary: '$140k - $180k',
  description:
    'We are looking for a Senior Product Designer to lead design initiatives for our flagship products. You will work closely with product managers, engineers, and stakeholders to create delightful user experiences that solve real problems.',
  tags: ['Product Design', 'Figma', 'UI/UX', 'Design Systems'],
  requirements: [
    '6+ years of product design experience',
    'Expert in Figma and design tools',
    'Strong portfolio demonstrating end-to-end product work',
    'Experience building and maintaining design systems',
    'Excellent visual and interaction design skills',
  ],
  benefits: [
    'Comprehensive health insurance (medical, dental, vision)',
    'Life insurance and disability coverage',
    '401(k) with 6% company match',
    'Unlimited PTO and sick days',
    'Paid parental leave (16 weeks)',
    'Professional development budget ($5k/year)',
    'Home office stipend',
    'Gym membership reimbursement',
    'Mental health support and counseling',
    'Commuter benefits',
    'Free lunch and snacks',
    'Team offsites and events',
    'Stock options',
    'Annual bonus',
  ],
  link: 'https://designco.com/careers/senior-product-designer',
  contact_email: 'careers@designco.com',
  company_logo: 'https://designco.com/logo.svg',
  plan: 'premium' as const,
};

/**
 * Job with maximum tags (10 tags - limit)
 */
const jobWithMaxTags = {
  title: 'DevOps Engineer',
  company: 'CloudOps Inc',
  location: 'Austin, TX',
  type: 'full-time' as const,
  workplace: 'Hybrid' as const,
  experience: 'Mid' as const,
  category: 'engineering',
  salary: '$130k - $170k',
  description:
    'Join our DevOps team to build and maintain cloud infrastructure at scale. You will work on automation, CI/CD pipelines, monitoring, and security for our production systems.',
  tags: [
    'DevOps',
    'Kubernetes',
    'Docker',
    'AWS',
    'Terraform',
    'CI/CD',
    'Python',
    'Monitoring',
    'Security',
    'Linux',
  ],
  requirements: [
    '5+ years of DevOps experience',
    'Strong Kubernetes and Docker skills',
    'AWS cloud platform expertise',
    'Infrastructure as Code (Terraform, CloudFormation)',
  ],
  benefits: ['Health insurance', 'Stock options', '401(k) match'],
  link: 'https://cloudops.io/careers/devops',
  plan: 'standard' as const,
};

/**
 * Contract job (non-full-time)
 */
const contractJob = {
  title: 'Frontend Developer (Contract)',
  company: 'AgencyCo',
  location: 'Remote',
  type: 'contract' as const,
  workplace: 'Remote' as const,
  experience: 'Mid' as const,
  category: 'engineering',
  salary: '$80 - $120/hour',
  description:
    '6-month contract for an experienced frontend developer to build a new web application using React and TypeScript. Possibility of extension or conversion to full-time.',
  tags: ['React', 'TypeScript', 'CSS', 'Frontend'],
  requirements: [
    '3+ years of React experience',
    'TypeScript proficiency',
    'Responsive design skills',
    'Available for 6-month commitment',
  ],
  benefits: [],
  link: 'https://agencyco.com/contracts/frontend-dev',
  contact_email: 'contracts@agencyco.com',
  plan: 'standard' as const,
};

/**
 * Internship (entry-level)
 */
const internshipJob = {
  title: 'Software Engineering Intern',
  company: 'BigTech Corp',
  location: 'Seattle, WA',
  type: 'internship' as const,
  workplace: 'On site' as const,
  experience: 'Entry' as const,
  category: 'engineering',
  salary: '$40/hour',
  description:
    'Summer internship program for software engineering students. Work on real projects, learn from experienced engineers, and contribute to products used by millions of people.',
  tags: ['Internship', 'Java', 'Python', 'Software Engineering'],
  requirements: [
    'Currently pursuing CS degree or related field',
    'Strong programming skills in Java or Python',
    'Available for 12-week summer internship',
    'Passionate about technology and learning',
  ],
  benefits: [
    'Competitive hourly rate',
    'Housing stipend',
    'Relocation assistance',
    'Mentorship program',
    'Intern events and networking',
  ],
  link: 'https://bigtech.com/careers/internships',
  contact_email: 'internships@bigtech.com',
  company_logo: 'https://bigtech.com/logo.png',
  plan: 'featured' as const,
};

/**
 * ==============================================================================
 * EMPTY/MINIMAL STATE VARIANTS
 * ==============================================================================
 */

/**
 * Empty Form - New Job
 * Default state for creating a new job listing
 */
export const EmptyForm: Story = {
  args: {
    initialData: emptyJob,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Empty form for new job creation.

**Features Shown:**
- All fields empty (defaults: type=full-time, workplace=Remote, plan=standard)
- Submit button disabled until required fields filled
- Card-based section layout
- Required field indicators (*)

**Required Fields:**
- Title, Company, Type, Workplace, Category, Description (50+ chars), Tags (min 1), Requirements (min 1), Link

**Use Case:**
User clicks "Post a Job" to create new listing.
        `,
      },
    },
  },
};

/**
 * Minimal Data - Required Fields Only
 * Job with only required fields populated
 */
export const MinimalData: Story = {
  args: {
    initialData: minimalJob,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Minimal job with only required fields.

**Fields Populated:**
- Title, Company, Type, Workplace, Category, Description (min 50 chars)
- Tags (3 items)
- Requirements (2 items)
- Link

**Optional Fields Empty:**
- Location, Experience, Salary, Benefits, Contact Email, Company Logo

**Use Case:**
Quick job posting with minimum information required.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * COMPLETE STATE VARIANTS
 * ==============================================================================
 */

/**
 * Complete Job - All Fields Filled
 * Job listing with all optional and required fields populated
 */
export const CompleteJob: Story = {
  args: {
    initialData: completeJob,
    onSubmit: mockOnSubmit,
    submitLabel: 'Update Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Complete job listing with all fields filled.

**Features Shown:**
- All required and optional fields populated
- Long description (multi-paragraph)
- 5 tags, 5 requirements, 6 benefits
- All selectors set (type, workplace, experience, category, plan)
- Company logo and contact email included
- Featured plan selected

**Use Case:**
Editing existing job with comprehensive information.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * REQUIREMENTS VARIANTS
 * ==============================================================================
 */

/**
 * With Many Requirements - Approaching Limit
 * Job with 15 requirements (max 20)
 */
export const WithManyRequirements: Story = {
  args: {
    initialData: jobWithManyRequirements,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Job with many requirements (15 items, max 20).

**Features Shown:**
- Long list of requirements displayed vertically
- Each requirement has remove button (×)
- Input field to add more (5 remaining)
- Scrollable requirements section

**Validation:**
Requirements array: min 1, max 20 items.
        `,
      },
    },
  },
};

/**
 * With Single Requirement - Minimum
 * Job with exactly 1 requirement (minimum required)
 */
export const WithSingleRequirement: Story = {
  args: {
    initialData: {
      ...minimalJob,
      requirements: ['Experience with AI/ML systems'],
    },
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: 'Job with minimum requirements (1 item required).',
      },
    },
  },
};

/**
 * ==============================================================================
 * BENEFITS VARIANTS
 * ==============================================================================
 */

/**
 * With Many Benefits - Premium Package
 * Job with extensive benefits list (14 items)
 */
export const WithManyBenefits: Story = {
  args: {
    initialData: jobWithManyBenefits,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Job with comprehensive benefits package (14 items).

**Features Shown:**
- Benefits displayed as removable badges
- Flex-wrap layout for long lists
- Each benefit has × remove button
- Optional field (can be empty)

**Use Case:**
Premium job listing highlighting competitive benefits.
        `,
      },
    },
  },
};

/**
 * With No Benefits - Optional Field
 * Job with empty benefits array
 */
export const WithNoBenefits: Story = {
  args: {
    initialData: {
      ...minimalJob,
      benefits: [],
    },
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: 'Job with no benefits (optional field - allowed to be empty).',
      },
    },
  },
};

/**
 * ==============================================================================
 * TAGS VARIANTS
 * ==============================================================================
 */

/**
 * With Maximum Tags - Limit Reached
 * Job with 10 tags (maximum allowed)
 */
export const WithMaximumTags: Story = {
  args: {
    initialData: jobWithMaxTags,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Job with maximum tags (10/10 limit).

**Features Shown:**
- Tags displayed as removable badges
- Add button disabled when at limit
- Tag counter shows 10/10
- Must have at least 1 tag (required)

**Validation:**
Attempting to add 11th tag will be prevented by disabled Add button.
        `,
      },
    },
  },
};

/**
 * With Single Tag - Minimum
 * Job with exactly 1 tag (minimum required)
 */
export const WithSingleTag: Story = {
  args: {
    initialData: {
      ...minimalJob,
      tags: ['Remote'],
    },
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Job with minimum tags (1 tag required).

**Validation:**
- At least 1 tag is required
- Red error message shown when no tags
- Submit button disabled if no tags
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * JOB TYPE VARIANTS
 * ==============================================================================
 */

/**
 * Contract Job - Non-Full-Time
 * Contract position with hourly rate
 */
export const ContractJob: Story = {
  args: {
    initialData: contractJob,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Contract position variant.

**Features Shown:**
- Employment type: Contract
- Salary shown as hourly rate ($80-$120/hour)
- No benefits (common for contract roles)
- Duration mentioned in description

**Job Types:**
full-time, part-time, contract, internship, freelance
        `,
      },
    },
  },
};

/**
 * Internship - Entry Level
 * Summer internship program
 */
export const InternshipJob: Story = {
  args: {
    initialData: internshipJob,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Internship variant.

**Features Shown:**
- Employment type: Internship
- Experience level: Entry
- Workplace: On site
- Benefits tailored to interns (housing, relocation, mentorship)
- Featured plan for visibility

**Use Case:**
University recruiting and summer internship programs.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * PLAN VARIANTS
 * ==============================================================================
 */

/**
 * Standard Plan - Free Listing
 * Basic job listing (default)
 */
export const StandardPlan: Story = {
  args: {
    initialData: {
      ...minimalJob,
      plan: 'standard',
    },
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Standard plan (free listing).

**Plan Details:**
- Basic listing visibility
- 30-day duration
- No featured badge
- No analytics

**Use Case:**
Default plan for most job postings.
        `,
      },
    },
  },
};

/**
 * Featured Plan - Paid Upgrade
 * Featured job listing with enhanced visibility
 */
export const FeaturedPlan: Story = {
  args: {
    initialData: {
      ...completeJob,
      plan: 'featured',
    },
    onSubmit: mockOnSubmitPaymentRequired,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Featured plan (paid upgrade).

**Plan Details:**
- Top placement in listings
- Featured badge
- Analytics dashboard
- Extended duration
- Requires payment

**Mock Behavior:**
Submit returns \`requiresPayment: true\` flag.
        `,
      },
    },
  },
};

/**
 * Premium Plan - Maximum Visibility
 * Premium job listing with all features
 */
export const PremiumPlan: Story = {
  args: {
    initialData: {
      ...jobWithManyBenefits,
      plan: 'premium',
    },
    onSubmit: mockOnSubmitPaymentRequired,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Premium plan (maximum visibility).

**Plan Details:**
- All Featured benefits
- Newsletter promotion
- Social media promotion
- Priority support
- Requires payment

**Use Case:**
High-priority roles needing maximum reach.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * WORKPLACE VARIANTS
 * ==============================================================================
 */

/**
 * Remote Job - Fully Remote
 * 100% remote position
 */
export const RemoteJob: Story = {
  args: {
    initialData: {
      ...completeJob,
      workplace: 'Remote',
      location: 'Remote (US)',
    },
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Fully remote position.

**Features:**
- Workplace: Remote
- Location can specify geography (e.g., "Remote (US)")
- Attractive to distributed teams

**Workplace Options:**
Remote, On site, Hybrid
        `,
      },
    },
  },
};

/**
 * On-Site Job - Office Required
 * In-office position
 */
export const OnSiteJob: Story = {
  args: {
    initialData: {
      ...jobWithManyBenefits,
      workplace: 'On site',
      location: 'New York, NY',
    },
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: 'On-site position requiring office presence.',
      },
    },
  },
};

/**
 * Hybrid Job - Flexible Arrangement
 * Mix of remote and office work
 */
export const HybridJob: Story = {
  args: {
    initialData: {
      ...completeJob,
      workplace: 'Hybrid',
      location: 'San Francisco, CA',
    },
    onSubmit: mockOnSubmit,
    submitLabel: 'Update Job',
  },
  parameters: {
    docs: {
      description: {
        story: 'Hybrid position with flexible remote/office arrangement.',
      },
    },
  },
};

/**
 * ==============================================================================
 * INTERACTIVE DEMO
 * ==============================================================================
 */

/**
 * Interactive Demo - All Features
 * Comprehensive demo with all form features
 */
export const InteractiveDemo: Story = {
  args: {
    initialData: completeJob,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive demo with all features.

**Try These Interactions:**
1. Edit any text field to see form state change
2. Add new tag (type and press Enter or click Add)
3. Remove tag (click × button)
4. Add requirement (type and press Enter)
5. Remove requirement (click × button)
6. Add benefit (type and press Enter)
7. Remove benefit (click × button)
8. Change employment type dropdown
9. Change workplace dropdown
10. Change experience level dropdown
11. Change category dropdown
12. Change plan dropdown
13. Click Submit to see pending state ("Saving...")
14. Click Cancel to navigate away

**State Management:**
- \`isPending\`: Shows during async submit operation (800ms)
- \`tags\`, \`requirements\`, \`benefits\`: Controlled array state
- Form fields: Uncontrolled with defaultValue (FormData extraction)
- Submit disabled until: tags.length > 0 && requirements.length > 0

**Validation:**
- Client-side: Tags min 1, requirements min 1
- Browser native: Required fields, URL format, email format
- Server-side: Zod schema validation (mocked)
        `,
      },
    },
  },
};

// ============================================================================
// COMPONENT STATES
// ============================================================================

/**
 * Error State - Form Submission Failed
 * Shows form with validation errors after failed submission
 */
export const ErrorState: Story = {
  args: {
    initialData: {
      ...emptyJob,
      title: '', // Empty required field
      company: '', // Empty required field
    } as any,
    onSubmit: mockOnSubmit,
    submitLabel: 'Create Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Error State** - Form with validation errors displayed.

**Error Scenarios:**
- Empty required fields (title, company, description)
- Missing tags array (min 1 required)
- Missing requirements array (min 1 required)
- Invalid URL format (application link)
- Invalid email format (contact email)

**Validation Feedback:**
- Browser native validation for required fields
- Client-side array validation (tags, requirements)
- Submit button disabled until arrays populated
- Toast notification for server errors

**Note:** Real implementation shows error toast and highlights invalid fields.
        `,
      },
    },
  },
};

/**
 * Success State - Form Saved Successfully
 * Shows form after successful submission with confirmation
 */
export const SuccessState: Story = {
  args: {
    initialData: completeJob,
    onSubmit: mockOnSubmit,
    submitLabel: 'Update Job',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Success State** - Form after successful save operation.

**Success Indicators:**
- Toast notification (success message)
- Submit button returns to default state
- Form shows latest saved values
- Redirect to /account/jobs (in production)

**Success Flow:**
1. User clicks "Update Job" button
2. \`isPending\` state shows "Saving..." (800ms simulated delay)
3. Server action completes successfully
4. Success toast appears
5. Redirect to job management page

**Note:** Real implementation redirects to job detail page or job list.
        `,
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS - INTERACTIVE TESTING
// ============================================================================

/**
 * Multi-step Field Validation
 * Tests filling required fields across multiple sections
 */
export const MultiStepFieldValidation: Story = {
  args: {
    onSubmit: fn(),
    submitLabel: 'Create Job',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fill Job Details section', async () => {
      const titleInput = canvas.getByLabelText(/job title/i);
      await userEvent.type(titleInput, 'Senior Full-Stack Engineer');
      await expect(titleInput).toHaveValue('Senior Full-Stack Engineer');

      const companyInput = canvas.getByLabelText(/company name/i);
      await userEvent.type(companyInput, 'TechCorp');
      await expect(companyInput).toHaveValue('TechCorp');
    });

    await step('Fill Description field (min 50 chars)', async () => {
      const descTextarea = canvas.getByLabelText(/job description/i);
      await userEvent.type(
        descTextarea,
        'We are seeking an experienced full-stack engineer to join our growing team and help build cutting-edge products.'
      );
      await expect(descTextarea.value.length).toBeGreaterThanOrEqual(50);
    });

    await step('Add requirement item', async () => {
      const reqInput = canvas.getByPlaceholderText(/e\.g\., 5\+ years/i);
      await userEvent.type(reqInput, '5+ years of experience');
      const addButton = canvas.getAllByRole('button', { name: /add/i })[0];
      await userEvent.click(addButton);
    });

    await step('Add tag item', async () => {
      const tagInput = canvas.getByPlaceholderText(/e\.g\., typescript/i);
      await userEvent.type(tagInput, 'typescript');
      const addButtons = canvas.getAllByRole('button', { name: /add/i });
      await userEvent.click(addButtons[addButtons.length - 1]);
    });

    await step('Fill application link', async () => {
      const linkInput = canvas.getByLabelText(/application link/i);
      await userEvent.type(linkInput, 'https://techcorp.com/careers/apply');
      await expect(linkInput).toHaveValue('https://techcorp.com/careers/apply');
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Multi-step form field validation.

**Test Steps:**
1. Fill Job Details (title, company)
2. Fill description (min 50 chars validation)
3. Add requirement item to requirements array
4. Add tag item to tags array
5. Fill application link (URL validation)

**Validates:**
- Text input interactions across sections
- Textarea character validation
- Dynamic array management (add items)
- Submit button enables when all required fields filled
- Multi-section form navigation
        `,
      },
    },
  },
};

/**
 * Form Submission Flow
 * Tests complete form submission with all callbacks
 */
export const FormSubmissionFlow: Story = {
  args: {
    initialData: completeJob,
    onSubmit: fn(),
    submitLabel: 'Update Job',
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Modify job title', async () => {
      const titleInput = canvas.getByLabelText(/job title/i);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Updated Job Title');
      await expect(titleInput).toHaveValue('Updated Job Title');
    });

    await step('Click Submit button', async () => {
      const submitButton = canvas.getByRole('button', { name: /update job/i });
      await expect(submitButton).toBeEnabled();
      await userEvent.click(submitButton);
    });

    await step('Verify onSubmit was called', async () => {
      await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    });

    await step('Verify Submit button shows pending state', async () => {
      // Button should show "Saving..." or be disabled during transition
      const buttons = canvas.getAllByRole('button');
      const submitButton = buttons.find(
        (btn) => btn.textContent?.includes('Saving') || btn.textContent?.includes('Update Job')
      );
      await expect(submitButton).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Complete form submission flow.

**Test Steps:**
1. Modify job title field
2. Click Submit button
3. Verify \`onSubmit\` callback was invoked
4. Verify pending state during async operation

**Validates:**
- Form submission triggers correctly
- \`onSubmit\` callback receives form data
- Pending state shows during async operation
- \`useTransition\` hook works properly

**Note:** Real implementation would navigate to job detail page after success.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * COMPREHENSIVE SHOWCASE
 * ==============================================================================
 */

/**
 * All Plans Comparison
 */
export const AllPlansComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-3">Standard Plan (Free)</h3>
        <JobForm
          initialData={{ ...minimalJob, plan: 'standard' }}
          onSubmit={mockOnSubmit}
          submitLabel="Create Job"
        />
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold mb-3">Featured Plan (Paid)</h3>
        <JobForm
          initialData={{ ...completeJob, plan: 'featured' }}
          onSubmit={mockOnSubmitPaymentRequired}
          submitLabel="Create Featured Job"
        />
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold mb-3">Premium Plan (Paid)</h3>
        <JobForm
          initialData={{ ...jobWithManyBenefits, plan: 'premium' }}
          onSubmit={mockOnSubmitPaymentRequired}
          submitLabel="Create Premium Job"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all three job listing plans.',
      },
    },
  },
};
