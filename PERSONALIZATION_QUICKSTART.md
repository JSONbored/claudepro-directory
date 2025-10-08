# Personalization Engine - Quick Start Guide

Get the Personalization Engine up and running in 15 minutes.

## 🚀 Deployment Steps

### Step 1: Run Database Migration (2 minutes)

1. Open Supabase SQL Editor
2. Copy contents of `/supabase/migrations/20250108000000_personalization_engine.sql`
3. Execute the query
4. Verify tables created: `user_interactions`, `user_affinities`, `user_similarities`, `content_similarities`

### Step 2: Set Environment Variables (1 minute)

Add to Vercel or `.env.local`:

```bash
CRON_SECRET=generate-a-secure-random-string-here
```

Generate secret:
```bash
openssl rand -base64 32
```

### Step 3: Configure Cron Jobs (5 minutes)

**In Vercel:**
1. Go to Project Settings → Cron Jobs
2. Add two cron jobs:

**Affinity Calculation:**
```
Path: /api/cron/calculate-affinities
Schedule: 0 2 * * * (Daily at 2 AM)
```

**Similarity Calculation:**
```
Path: /api/cron/calculate-similarities  
Schedule: 0 3 * * * (Daily at 3 AM)
```

Add custom header to both:
```
Authorization: Bearer YOUR_CRON_SECRET
```

### Step 4: Add Navigation Link (2 minutes)

In your navigation component (e.g., `/src/components/layout/navigation.tsx`):

```tsx
<Link href="/for-you">
  For You
</Link>
```

### Step 5: Add Similar Configs to Detail Pages (5 minutes)

In `/src/app/[category]/[slug]/page.tsx`, add at the end:

```tsx
import { SimilarConfigsSection } from '@/src/components/personalization/similar-configs-section';

// In your component JSX, after main content:
<SimilarConfigsSection 
  contentType={params.category} 
  contentSlug={params.slug} 
/>
```

### Step 6: Deploy & Test (5 minutes)

1. Commit changes: `git add . && git commit -m "Add personalization engine"`
2. Push to deploy: `git push`
3. Wait for deployment
4. Test:
   - Visit `/for-you` (requires login)
   - View some content items
   - Bookmark 2-3 items
   - Trigger affinity calculation (or wait for cron)
   - Revisit `/for-you` to see personalized recommendations

---

## 🧪 Quick Test

```bash
# Test cron jobs locally (in development)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/calculate-affinities

curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/calculate-similarities
```

---

## 📊 Verify in Umami

Go to Umami dashboard and filter events by:
- `personalization_for_you_viewed`
- `personalization_recommendation_clicked`
- `personalization_similar_config_clicked`

---

## ✅ You're Done!

The Personalization Engine is now live. Users will start seeing:
- Personalized "For You" feed at `/for-you`
- Similar configs on detail pages
- Recommendations based on their activity

Affinities and similarities will be calculated automatically each night.

---

## 🆘 Need Help?

See `PERSONALIZATION_ENGINE_IMPLEMENTATION.md` for:
- Detailed documentation
- Troubleshooting guide
- Architecture details
- Customization options
