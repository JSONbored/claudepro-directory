import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getRuleBySlug, getRuleFullContent, rules } from '@/generated/content';

const Rule = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fullRule, setFullRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ruleMeta = slug ? getRuleBySlug(slug) : null;

  useEffect(() => {
    if (slug) {
      getRuleFullContent(slug)
        .then((content) => {
          setFullRule(content);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [slug]);

  const relatedRules = ruleMeta
    ? rules.filter((r) => r.id !== ruleMeta.id && r.category === ruleMeta.category).slice(0, 3)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <ContentDetailPage
      item={fullRule || ruleMeta}
      type="rule"
      icon={BookOpen}
      typeName="Rule"
      relatedItems={relatedRules}
    />
  );
};

export default Rule;
