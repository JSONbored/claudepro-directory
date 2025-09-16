import { Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getHookBySlug, getHookFullContent, hooks } from '@/generated/content';

const Hook = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fullHook, setFullHook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const hookMeta = slug ? getHookBySlug(slug) : null;

  useEffect(() => {
    if (slug) {
      getHookFullContent(slug)
        .then((content) => {
          setFullHook(content);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [slug]);

  const relatedHooks = hookMeta
    ? hooks.filter((h) => h.id !== hookMeta.id && h.category === hookMeta.category).slice(0, 3)
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
      item={fullHook || hookMeta}
      type="hook"
      icon={Webhook}
      typeName="Hook"
      relatedItems={relatedHooks}
    />
  );
};

export default Hook;
