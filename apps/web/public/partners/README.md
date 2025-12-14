# Partner Logos

This directory contains partner logos for the "Trusted by" marquee in the homepage hero section.

## Current Partners

- **Neon** - 1-year partnership (logo needed: `neon.svg`)

## Logo Requirements

- **Format:** SVG preferred (scalable, crisp at any size)
- **Size:** Will be displayed at max-height 48px (h-12)
- **Naming:** Use kebab-case (e.g., `neon.svg`, `company-name.svg`)
- **Styling:** Logos will be grayscale by default, color on hover

## Adding New Partner Logos

1. Add the logo file to this directory
2. Update `apps/web/src/components/features/home/hero-partners.tsx`:
   ```typescript
   const PARTNERS: Partner[] = [
     // ... existing partners
     {
       name: 'Company Name',
       logo: '/partners/company-name.svg',
       href: 'https://company.com',
       alt: 'Company Name - Description',
     },
   ];
   ```
