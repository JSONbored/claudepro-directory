'use client';

/**
 * ExpertQuote - Expert opinion component with attribution
 * Used in 11+ MDX files across the codebase
 *
 * Updated: Migrated from Next.js Image to ShadCN Avatar component
 * Benefits: Better fallback handling, consistent avatar styling
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { type ExpertQuoteProps, expertQuotePropsSchema } from '@/src/lib/schemas/shared.schema';

export function ExpertQuote(props: ExpertQuoteProps) {
  const validated = expertQuotePropsSchema.parse(props);
  const { quote, author, role, company, imageUrl } = validated;
  return (
    <blockquote
      itemScope
      itemType="https://schema.org/Quotation"
      className="my-8 border-l-4 border-primary bg-muted/30 p-6 rounded-r-lg"
    >
      <p itemProp="text" className="text-lg italic leading-relaxed mb-4">
        "{quote}"
      </p>
      <footer className="flex items-center gap-4">
        {imageUrl && (
          <Avatar className="h-12 w-12">
            <AvatarImage src={imageUrl} alt={author} />
            <AvatarFallback>{author.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div itemProp="author" itemScope itemType="https://schema.org/Person">
          <cite className="not-italic">
            <span itemProp="name" className="font-semibold text-foreground">
              {author}
            </span>
            {(role || company) && (
              <span className="text-muted-foreground">
                {role && <span itemProp="jobTitle">, {role}</span>}
                {company && (
                  <span itemProp="worksFor">
                    {role ? ' at ' : ', '}
                    {company}
                  </span>
                )}
              </span>
            )}
          </cite>
        </div>
      </footer>
    </blockquote>
  );
}
