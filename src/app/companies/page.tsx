import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Building, ExternalLink, Plus, Star } from '@/src/lib/icons';
import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata: Metadata = {
  title: 'Companies Using Claude - ClaudePro Directory',
  description: 'Discover companies building with Claude and Cursor',
};

export const revalidate = 3600; // Revalidate every hour

export default async function CompaniesPage() {
  const supabase = await createAdminClient();

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Hero */}
      <section className={`${UI_CLASSES.CONTAINER_OVERFLOW_BORDER}`}>
        <div className={`container ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.PX_4} py-20`}>
          <div className={`text-center ${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO}`}>
            <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.MB_6}`}>
              <div className={`p-3 ${UI_CLASSES.BG_ACCENT_10} ${UI_CLASSES.ROUNDED_FULL}`}>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>Companies Directory</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Discover companies building the future with Claude and Cursor
            </p>

            <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} gap-2 ${UI_CLASSES.MB_8}`}>
              <Badge variant="secondary">
                <Building className="h-3 w-3 mr-1" />
                {companies?.length || 0} Companies
              </Badge>
              <Badge variant="outline">Verified Profiles</Badge>
            </div>

            <Button variant="outline" asChild>
              <Link href="/account/companies">
                <Plus className="h-4 w-4 mr-2" />
                Add Your Company
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        {!companies || companies.length === 0 ? (
          <Card>
            <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No companies yet</h3>
              <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center max-w-md mb-4`}>
                Be the first company to join the directory!
              </p>
              <Button asChild>
                <Link href="/account/companies">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your Company
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
            {companies.map((company) => (
              <Card key={company.id} className={UI_CLASSES.CARD_GRADIENT_HOVER}>
                {company.featured && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge className="bg-accent text-accent-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    {company.logo && (
                      <Image
                        src={company.logo}
                        alt={`${company.name} logo`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle>
                        <Link
                          href={`/companies/${company.slug}`}
                          className={UI_CLASSES.HOVER_TEXT_ACCENT}
                        >
                          {company.name}
                        </Link>
                      </CardTitle>
                      {company.industry && <CardDescription>{company.industry}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {company.description && (
                    <p
                      className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.MB_4} ${UI_CLASSES.LINE_CLAMP_2}`}
                    >
                      {company.description}
                    </p>
                  )}

                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    {company.size && (
                      <Badge variant="outline" className={UI_CLASSES.TEXT_XS}>
                        {company.size} employees
                      </Badge>
                    )}

                    {company.website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
