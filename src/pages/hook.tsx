import { useParams } from 'react-router-dom';
import { Webhook } from 'lucide-react';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getHookBySlug, hooks } from '@/generated/content';

const Hook = () => {
  const { slug } = useParams<{ slug: string }>();
  const hook = slug ? getHookBySlug(slug) : null;
  
  const relatedHooks = hook ? hooks
    .filter(h => h.id !== hook.id && h.category === hook.category)
    .slice(0, 3) : [];

  return (
    <ContentDetailPage
      item={hook}
      type="hook"
      icon={Webhook}
      typeName="Hook"
      relatedItems={relatedHooks}
    />
  );
};

export default Hook;