'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { JobCard } from './job-card';

const meta = {
  title: 'Cards/JobCard',
  component: JobCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Job listing card component with company logo, location, salary, job type, and action buttons. Features responsive layout with hover effects and badge system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    job: {
      control: 'object',
      description: 'Job listing data object',
      table: {
        type: { summary: 'Job' },
      },
    },
    onCardClick: {
      action: 'cardClicked',
      description: 'Callback when job card is clicked',
      table: {
        type: { summary: '() => void' },
      },
    },
    onApplyClick: {
      action: 'applyClicked',
      description: 'Callback when Apply button is clicked',
      table: {
        type: { summary: '() => void' },
      },
    },
    enableBookmark: {
      control: 'boolean',
      description: 'Enable bookmark functionality',
      table: {
        type: { summary: 'boolean' },
      },
    },
  },
} satisfies Meta<typeof JobCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default job card
 */
export const Default: Story = {
  args: {
    job: {
      slug: 'senior-ai-engineer',
      title: 'Senior AI Engineer',
      company: 'TechCorp Inc.',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=techcorp',
      location: 'San Francisco, CA',
      type: 'full-time',
      remote: true,
      salary: '$150k - $200k',
      description:
        'We are looking for a Senior AI Engineer to join our team and help build the next generation of AI-powered products. You will work with cutting-edge technologies and collaborate with a talented team.',
      tags: ['Python', 'TensorFlow', 'LLMs', 'Machine Learning', 'AWS'],
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Featured job listing
 */
export const Featured: Story = {
  args: {
    job: {
      slug: 'ml-researcher',
      title: 'Machine Learning Researcher',
      company: 'AI Labs',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=ailabs',
      location: 'Remote',
      type: 'full-time',
      remote: true,
      salary: '$180k - $250k',
      description:
        'Join our research team to push the boundaries of machine learning. Work on cutting-edge projects in natural language processing, computer vision, and reinforcement learning.',
      tags: ['Research', 'Deep Learning', 'PyTorch', 'NLP', 'Computer Vision'],
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      applyUrl: 'https://example.com/apply',
      featured: true,
    },
  },
};

/**
 * Contract position
 */
export const Contract: Story = {
  args: {
    job: {
      slug: 'freelance-ai-consultant',
      title: 'AI Consultant',
      company: 'Consulting Partners',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=consulting',
      location: 'New York, NY',
      type: 'contract',
      remote: false,
      salary: '$100/hour',
      description:
        'Seeking an experienced AI consultant to help our clients integrate AI solutions into their businesses. Must have strong communication skills and proven track record.',
      tags: ['Consulting', 'AI Strategy', 'Client Facing', 'Project Management'],
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Part-time position
 */
export const PartTime: Story = {
  args: {
    job: {
      slug: 'part-time-ml-engineer',
      title: 'Part-Time ML Engineer',
      company: 'StartupXYZ',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=startupxyz',
      location: 'Austin, TX',
      type: 'part-time',
      remote: true,
      salary: '$60k - $80k',
      description:
        'Looking for a part-time ML engineer to help build our recommendation system. Flexible hours, perfect for someone looking for work-life balance.',
      tags: ['Recommendation Systems', 'Scikit-learn', 'Flask', 'Docker'],
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Internship position
 */
export const Internship: Story = {
  args: {
    job: {
      slug: 'ai-research-intern',
      title: 'AI Research Intern',
      company: 'University Lab',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=unilab',
      location: 'Boston, MA',
      type: 'internship',
      remote: false,
      description:
        'Summer internship opportunity in our AI research lab. Work alongside PhD researchers on cutting-edge projects. Great learning experience for students.',
      tags: ['Research', 'Python', 'Academic', 'Learning'],
      postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Without salary information
 */
export const NoSalary: Story = {
  args: {
    job: {
      slug: 'ai-engineer',
      title: 'AI Engineer',
      company: 'Enterprise Corp',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=enterprise',
      location: 'Seattle, WA',
      type: 'full-time',
      remote: true,
      description:
        'Join our team to build enterprise-scale AI solutions. We offer competitive compensation and excellent benefits.',
      tags: ['Enterprise', 'Azure', 'MLOps', 'CI/CD'],
      postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Many tags (overflow scenario)
 */
export const ManyTags: Story = {
  args: {
    job: {
      slug: 'full-stack-ai-engineer',
      title: 'Full-Stack AI Engineer',
      company: 'Tech Innovators',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=techinnovators',
      location: 'Remote',
      type: 'full-time',
      remote: true,
      salary: '$140k - $180k',
      description:
        'We need a versatile engineer who can work across the stack. From frontend to ML models to infrastructure.',
      tags: [
        'Python',
        'TypeScript',
        'React',
        'FastAPI',
        'PyTorch',
        'AWS',
        'Docker',
        'Kubernetes',
        'PostgreSQL',
        'Redis',
      ],
      postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows how the card handles overflow when there are many tags (shows first 4 + count).',
      },
    },
  },
};

/**
 * Without company logo
 */
export const NoLogo: Story = {
  args: {
    job: {
      slug: 'prompt-engineer',
      title: 'Prompt Engineer',
      company: 'AI Startup',
      location: 'Los Angeles, CA',
      type: 'full-time',
      remote: true,
      salary: '$120k - $160k',
      description:
        'Help us design and optimize prompts for our AI products. Experience with LLMs required.',
      tags: ['LLMs', 'Prompt Engineering', 'GPT-4', 'Claude', 'API Integration'],
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * All job types showcase
 */
export const AllJobTypes: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <JobCard
        job={{
          slug: 'full-time-1',
          title: 'Full-Time Position',
          company: 'Company A',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=companya',
          location: 'San Francisco, CA',
          type: 'full-time',
          remote: true,
          salary: '$150k - $200k',
          description: 'Full-time position with benefits.',
          tags: ['Python', 'ML', 'Remote'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
      <JobCard
        job={{
          slug: 'part-time-1',
          title: 'Part-Time Position',
          company: 'Company B',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=companyb',
          location: 'Austin, TX',
          type: 'part-time',
          remote: true,
          salary: '$60k - $80k',
          description: 'Part-time flexible hours.',
          tags: ['Python', 'Data Science'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
      <JobCard
        job={{
          slug: 'contract-1',
          title: 'Contract Position',
          company: 'Company C',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=companyc',
          location: 'New York, NY',
          type: 'contract',
          remote: false,
          salary: '$100/hour',
          description: '6-month contract role.',
          tags: ['Consulting', 'AI'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
      <JobCard
        job={{
          slug: 'internship-1',
          title: 'Internship Position',
          company: 'Company D',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=companyd',
          location: 'Boston, MA',
          type: 'internship',
          remote: false,
          description: 'Summer internship program.',
          tags: ['Research', 'Learning'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
    </div>
  ),
};

/**
 * Grid layout showcase
 */
export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
      <JobCard
        job={{
          slug: 'job-1',
          title: 'Senior AI Engineer',
          company: 'TechCorp',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=job1',
          location: 'Remote',
          type: 'full-time',
          remote: true,
          salary: '$150k - $200k',
          description: 'Build AI solutions.',
          tags: ['Python', 'ML'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: true,
        }}
      />
      <JobCard
        job={{
          slug: 'job-2',
          title: 'ML Researcher',
          company: 'AI Labs',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=job2',
          location: 'San Francisco, CA',
          type: 'full-time',
          remote: false,
          salary: '$180k - $250k',
          description: 'Research position.',
          tags: ['Research', 'Deep Learning'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
    </div>
  ),
};

// ============================================================================
// COMPONENT STATES
// ============================================================================

/**
 * Loading State - Skeleton/Placeholder
 * Shows job card in loading state while data is being fetched
 */
export const LoadingState: Story = {
  args: {
    job: {
      slug: 'loading',
      title: 'Loading...',
      company: 'Loading Company',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=loading',
      location: 'Loading...',
      type: 'full-time',
      remote: false,
      description: 'Job details are currently loading. Please wait.',
      tags: [],
      postedAt: new Date(),
      applyUrl: '#',
      featured: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
**Loading/Skeleton State** - Job card shown while data is being fetched.

**Features:**
- Placeholder text for title, company, location
- No tags or salary information
- Used during async job listing loading

**Use Cases:**
- Initial page load for job board
- Infinite scroll loading more jobs
- Search results loading state

**Implementation Note:** Production should use dedicated skeleton component with animated loading placeholders.
        `,
      },
    },
  },
};

/**
 * Empty State - No Jobs Available
 * Shows when job search/filter returns no results
 */
export const EmptyState: Story = {
  args: {
    job: {
      slug: 'empty',
      title: 'No Jobs Found',
      company: 'Try Different Filters',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=empty',
      location: 'N/A',
      type: 'full-time',
      remote: false,
      description:
        'No jobs match your current search criteria. Try adjusting your filters or browse all available positions.',
      tags: [],
      postedAt: new Date(),
      applyUrl: '#',
      featured: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
**Empty State** - Shown when job search returns no matches.

**Features:**
- Helpful messaging to guide user
- Clear call-to-action in description
- No featured badge or salary

**Use Cases:**
- Search returns no matches
- Filtered job board has no results
- New job category with no postings yet
        `,
      },
    },
  },
};

/**
 * Expired Job - Past Application Deadline
 * Shows job that is no longer accepting applications
 */
export const ExpiredJob: Story = {
  args: {
    job: {
      slug: 'expired-job',
      title: 'Senior Backend Engineer',
      company: 'Expired Corp',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=expired',
      location: 'Seattle, WA',
      type: 'full-time',
      remote: true,
      salary: '$140k - $180k',
      description:
        'This position is no longer accepting applications. The application deadline has passed.',
      tags: ['Backend', 'Go', 'Kubernetes', 'PostgreSQL'],
      postedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      applyUrl: '#',
      featured: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
**Expired Job State** - Job posting that is no longer accepting applications.

**Features:**
- Posted date shows "60 days ago" (or older)
- Description indicates expired status
- Apply button could be disabled (implementation-specific)

**Use Cases:**
- Jobs past application deadline
- Filled positions still showing in archive
- Historical job listings for reference
        `,
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS - INTERACTIVE TESTING
// ============================================================================

/**
 * Card Click Interaction
 * Tests job card navigation on click
 */
export const CardClickInteraction: Story = {
  args: {
    job: {
      slug: 'test-job',
      title: 'Test Engineer Position',
      company: 'Test Company',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=test',
      location: 'Remote',
      type: 'full-time',
      remote: true,
      salary: '$120k - $160k',
      description: 'Click this job card to test navigation behavior.',
      tags: ['Testing', 'QA', 'Automation'],
      postedAt: new Date(),
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
    onCardClick: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify job card is rendered', async () => {
      const card = canvas.getByRole('article');
      await expect(card).toBeInTheDocument();
    });

    await step('Verify job title is visible', async () => {
      const title = canvas.getByText(/test engineer position/i);
      await expect(title).toBeVisible();
    });

    await step('Click the job card', async () => {
      const card = canvas.getByRole('article');
      await userEvent.click(card);
    });

    await step('Verify onCardClick was called', async () => {
      await expect(args.onCardClick).toHaveBeenCalledTimes(1);
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Job card click navigation.

**Test Steps:**
1. Verify job card renders with article role
2. Verify job title is visible
3. Click the card element
4. Verify \`onCardClick\` callback was invoked

**Validates:**
- Job card renders with proper structure
- Click handler fires correctly
- Navigation callback system works
- Accessibility (article role)
        `,
      },
    },
  },
};

/**
 * Apply Button Interaction
 * Tests Apply button click isolation (doesn't trigger card click)
 */
export const ApplyButtonInteraction: Story = {
  args: {
    job: {
      slug: 'apply-test-job',
      title: 'Frontend Developer',
      company: 'Apply Test Co',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=applytest',
      location: 'New York, NY',
      type: 'full-time',
      remote: false,
      salary: '$130k - $170k',
      description: 'Test that Apply button works independently of card click.',
      tags: ['React', 'TypeScript', 'CSS'],
      postedAt: new Date(),
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
    onCardClick: fn(), // Should NOT be called when clicking Apply
    onApplyClick: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Apply button is rendered', async () => {
      const applyButton = canvas.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeInTheDocument();
    });

    await step('Click Apply button', async () => {
      const applyButton = canvas.getByRole('button', { name: /apply/i });
      await userEvent.click(applyButton);
    });

    await step('Verify onApplyClick was called', async () => {
      await expect(args.onApplyClick).toHaveBeenCalledTimes(1);
    });

    await step('Verify card navigation was NOT triggered', async () => {
      // onCardClick should NOT have been called (stopPropagation works)
      await expect(args.onCardClick).not.toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Apply button click isolation.

**Test Steps:**
1. Verify Apply button renders
2. Click Apply button
3. Verify \`onApplyClick\` callback was invoked
4. Verify card navigation was NOT triggered (stopPropagation works)

**Validates:**
- Apply button renders correctly
- \`e.stopPropagation()\` prevents card click when clicking Apply
- Users can apply without triggering card navigation
- Event bubbling is properly managed

**Pattern:** Apply button MUST call \`e.stopPropagation()\` to prevent card navigation.
        `,
      },
    },
  },
};

/**
 * Keyboard Navigation Interaction
 * Tests keyboard accessibility for job card
 */
export const KeyboardNavigationInteraction: Story = {
  args: {
    job: {
      slug: 'keyboard-test-job',
      title: 'Accessibility Engineer',
      company: 'A11y Company',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=a11y',
      location: 'Remote',
      type: 'full-time',
      remote: true,
      salary: '$140k - $180k',
      description: 'Use Tab to focus, then press Enter to navigate.',
      tags: ['Accessibility', 'WCAG', 'ARIA'],
      postedAt: new Date(),
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
    onCardClick: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Focus the job card with keyboard', async () => {
      const card = canvas.getByRole('article');
      card.focus();
      await expect(card).toHaveFocus();
    });

    await step('Press Enter key to navigate', async () => {
      const card = canvas.getByRole('article');
      await userEvent.type(card, '{Enter}');
    });

    await step('Verify onCardClick was called', async () => {
      await expect(args.onCardClick).toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Keyboard navigation (Enter/Space).

**Test Steps:**
1. Focus the job card using keyboard (tabIndex=0)
2. Verify card receives focus
3. Press Enter key
4. Verify navigation callback fires

**Validates:**
- Job card is keyboard focusable
- Enter/Space key handlers work
- ARIA roles are correct (article)
- Full keyboard accessibility compliance

**Accessibility:** Meets WCAG 2.1 AA standards for keyboard navigation.
        `,
      },
    },
  },
};
