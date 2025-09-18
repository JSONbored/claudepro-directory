import { type NextRequest, NextResponse } from 'next/server';

// Use Edge Runtime for better performance
export const runtime = 'edge';

interface SubmissionData {
  type: string;
  name: string;
  description: string;
  category: string;
  author: string;
  github?: string;
  content: string;
  tags: string;
}

// GitHub API configuration
const GITHUB_OWNER = 'JSONbored';
const GITHUB_REPO = 'claudepro-directory';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional - for higher rate limits

export async function POST(request: NextRequest) {
  try {
    const data: SubmissionData = await request.json();

    // Validate required fields
    if (!data.type || !data.name || !data.description || !data.content || !data.author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format the issue body
    const issueBody = `
## New ${data.type} Submission

**Name:** ${data.name}
**Author:** ${data.author}${data.github ? ` (@${data.github})` : ''}
**Category:** ${data.category || 'Not specified'}
**Description:** ${data.description}
**Tags:** ${data.tags || 'None'}

### Configuration Content

\`\`\`json
${data.content}
\`\`\`

### Metadata

- **Submitted via:** Website form
- **Date:** ${new Date().toISOString()}
- **Type:** ${data.type}

---
*This issue was automatically created from a website submission.*
`;

    // Create GitHub issue
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`;

    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'ClaudeProDirectory-SubmissionBot',
    };

    // Add auth token if available (for higher rate limits)
    if (GITHUB_TOKEN) {
      headers.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const githubResponse = await fetch(githubApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `[${data.type}] ${data.name} - by ${data.author}`,
        body: issueBody,
        labels: [`submission`, `type:${data.type}`, 'pending-review'],
      }),
    });

    if (!githubResponse.ok) {
      const errorData = await githubResponse.text();
      console.error('GitHub API error:', errorData);

      // If GitHub submission fails, we could fallback to other methods
      // For now, return a helpful error message
      if (githubResponse.status === 403) {
        return NextResponse.json(
          {
            error:
              'Submission rate limit reached. Please try again later or submit via GitHub directly.',
            fallback: true,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create submission. Please try again or submit via GitHub.' },
        { status: 500 }
      );
    }

    const issue = await githubResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Configuration submitted successfully!',
      issueUrl: issue.html_url,
      issueNumber: issue.number,
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your submission' },
      { status: 500 }
    );
  }
}
