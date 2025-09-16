import { useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getRuleBySlug, rules } from '@/generated/content';

const Rule = () => {
  const { slug } = useParams<{ slug: string }>();
  const rule = slug ? getRuleBySlug(slug) : null;
  
  const relatedRules = rule ? rules
    .filter(r => r.id !== rule.id && r.category === rule.category)
    .slice(0, 3) : [];

  return (
    <ContentDetailPage
      item={rule}
      type="rule"
      icon={BookOpen}
      typeName="Rule"
      relatedItems={relatedRules}
    />
  );
};

export default Rule;