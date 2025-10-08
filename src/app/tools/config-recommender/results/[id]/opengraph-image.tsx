/**
 * Recommender Results OpenGraph Image
 * Dynamically generates OG images for personalized recommendation results
 *
 * Features:
 * - Decodes base64 ID to extract quiz answers
 * - Displays use case, experience level, and match stats
 * - Branded gradient design
 * - Optimized for social sharing
 */

import { ImageResponse } from 'next/og';
import { logger } from '@/src/lib/logger';
import { decodeQuizAnswers, type QuizAnswers } from '@/src/lib/schemas/recommender.schema';

// Route segment configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

// OG image metadata
export const alt = 'Your Personalized Claude Configuration Recommendations';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Recommender gradient (purple theme)
const RECOMMENDER_GRADIENT = {
  start: '#8b5cf6',
  end: '#6366f1',
};

// Use case display names
const USE_CASE_LABELS: Record<string, string> = {
  'code-review': 'Code Review',
  'api-development': 'API Development',
  'frontend-development': 'Frontend Development',
  'data-science': 'Data Science',
  'content-creation': 'Content Creation',
  'devops-infrastructure': 'DevOps & Infrastructure',
  'general-development': 'General Development',
  'testing-qa': 'Testing & QA',
  'security-audit': 'Security Audit',
};

// Experience level labels
const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default async function Image({
  params: _params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}) {
  try {
    const resolvedSearchParams = await searchParams;

    // Decode quiz answers from URL search params
    let answers: QuizAnswers;
    try {
      if (!resolvedSearchParams.answers) {
        throw new Error('No answers provided');
      }
      answers = decodeQuizAnswers(resolvedSearchParams.answers);
    } catch {
      // Invalid answers - show fallback
      return new ImageResponse(
        <div
          style={{
            background: `linear-gradient(135deg, ${RECOMMENDER_GRADIENT.start} 0%, ${RECOMMENDER_GRADIENT.end} 100%)`,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
          }}
        >
          Invalid Result ID
        </div>,
        { ...size }
      );
    }

    const useCaseLabel = USE_CASE_LABELS[answers.useCase] || answers.useCase;
    const experienceLabel = EXPERIENCE_LABELS[answers.experienceLevel] || answers.experienceLevel;

    return new ImageResponse(
      <div
        style={{
          background: `linear-gradient(135deg, ${RECOMMENDER_GRADIENT.start} 0%, ${RECOMMENDER_GRADIENT.end} 100%)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'white',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 24,
              fontWeight: 600,
              color: RECOMMENDER_GRADIENT.end,
            }}
          >
            ✨ Recommendations
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 28,
              color: 'white',
              opacity: 0.9,
            }}
          >
            Claude Pro Directory
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 56,
              fontWeight: 700,
              color: 'white',
              marginBottom: 24,
              lineHeight: 1.1,
            }}
          >
            Your Personalized Results
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 40,
              lineHeight: 1.3,
            }}
          >
            Claude configurations for {useCaseLabel.toLowerCase()}
          </div>

          {/* Info Badges */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: 24,
                padding: '12px 28px',
                fontSize: 22,
                color: 'white',
                fontWeight: 600,
              }}
            >
              🎯 {useCaseLabel}
            </div>
            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: 24,
                padding: '12px 28px',
                fontSize: 22,
                color: 'white',
                fontWeight: 600,
              }}
            >
              📊 {experienceLabel}
            </div>
            {answers.toolPreferences && answers.toolPreferences.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: 24,
                  padding: '12px 28px',
                  fontSize: 22,
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                🔧 {answers.toolPreferences.length} tool
                {answers.toolPreferences.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          Find the perfect Claude configuration in seconds
        </div>
      </div>,
      { ...size }
    );
  } catch (error) {
    logger.error(
      'OpenGraph image generation error for recommender results',
      error instanceof Error ? error : new Error(String(error))
    );

    return new ImageResponse(
      <div
        style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          fontWeight: 700,
          color: 'white',
        }}
      >
        Error Generating Image
      </div>,
      { ...size }
    );
  }
}
