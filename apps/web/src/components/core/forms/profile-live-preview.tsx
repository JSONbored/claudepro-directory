'use client';

/**
 * Profile Live Preview Component
 * Shows a preview of how the profile will look
 */

import { Card, CardContent, CardHeader } from '@heyclaude/web-runtime/ui';
import { ExternalLink } from '@heyclaude/web-runtime/icons';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@heyclaude/web-runtime/ui';

interface ProfileLivePreviewProps {
  profile: {
    name?: string;
    username?: string;
    bio?: string;
    work?: string;
    website?: string;
    social_x_link?: string;
    interests?: string[];
    avatarUrl?: string | null;
    heroUrl?: string | null;
  };
  slug?: string | null;
}

export function ProfileLivePreview({ profile, slug }: ProfileLivePreviewProps) {
  const displayName = profile.name || 'Your Name';
  const username = profile.username || 'your-username';
  const bio = profile.bio || 'Your bio will appear here...';
  const work = profile.work || 'Your work title';
  const website = profile.website;
  const socialXLink = profile.social_x_link;
  const interests = profile.interests || [];
  const avatarUrl = profile.avatarUrl;
  const heroUrl = profile.heroUrl;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <p className="text-sm font-medium">Live Preview</p>
        <p className="text-muted-foreground text-xs">How your profile will appear to others</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Hero Image */}
          {heroUrl ? (
            <div className="relative h-24 w-full overflow-hidden rounded-lg sm:h-32">
              <Image src={heroUrl} alt="Hero preview" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="bg-muted h-24 w-full rounded-lg sm:h-32" />
          )}

          {/* Profile Header */}
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:gap-4">
            {/* Avatar */}
            {avatarUrl ? (
              <div className="ring-background relative -mt-8 h-16 w-16 shrink-0 overflow-hidden rounded-full ring-4 sm:-mt-10 sm:h-20 sm:w-20">
                <Image
                  src={avatarUrl}
                  alt={`${displayName}'s avatar`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="bg-muted ring-background -mt-8 flex h-16 w-16 shrink-0 items-center justify-center rounded-full ring-4 sm:-mt-10 sm:h-20 sm:w-20">
                <span className="text-muted-foreground text-xl font-semibold sm:text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Profile Info */}
            <div className="min-w-0 flex-1 pt-0 sm:pt-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <h3 className="truncate text-base font-semibold sm:text-lg">{displayName}</h3>
                {slug && (
                  <Link
                    href={`/u/${slug}`}
                    className="text-muted-foreground hover:text-accent truncate text-xs transition-colors sm:text-sm"
                  >
                    @{username}
                  </Link>
                )}
              </div>
              {work && <p className="text-muted-foreground truncate text-xs sm:text-sm">{work}</p>}
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="text-sm leading-relaxed">{bio}</p>
          </div>

          {/* Links */}
          {(website || socialXLink) && (
            <div className="flex flex-wrap gap-3">
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent inline-flex items-center gap-1 text-sm hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              )}
              {socialXLink && (
                <a
                  href={socialXLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent inline-flex items-center gap-1 text-sm hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />X / Twitter
                </a>
              )}
            </div>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">Interests</p>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-accent/10 text-accent rounded-full px-2 py-1 text-xs"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
