import categorySpec from "./category-spec.json" with { type: "json" };
import { normalizeDisclosure } from "./commercial.js";

export function absoluteSiteUrl(siteUrl, path = "/") {
  return new URL(path || "/", siteUrl).toString();
}

export function buildOrganizationJsonLd(params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl.replace(/\/$/, "")}/#organization`,
    name: params.name || "HeyClaude",
    url: siteUrl,
    sameAs: [params.githubUrl, params.twitterUrl, params.discordUrl].filter(Boolean),
  };
}

export function buildWebsiteJsonLd(params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl.replace(/\/$/, "")}/#website`,
    name: params.name || "HeyClaude",
    url: siteUrl,
    description: params.description || "A directory for Claude resources and tools.",
    publisher: {
      "@id": `${siteUrl.replace(/\/$/, "")}/#organization`,
    },
  };
}

export function buildBreadcrumbJsonLd(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildItemListJsonLd(items = [], params = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: params.name,
    description: params.description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name || item.title,
    })),
  };
}

export function buildEntryJsonLd(entry, params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const url = absoluteSiteUrl(siteUrl, `/${entry.category}/${entry.slug}`);
  const label = categorySpec.categories?.[entry.category]?.label || entry.category;

  return {
    "@context": "https://schema.org",
    "@type": entry.category === "guides" ? "TechArticle" : "CreativeWork",
    "@id": `${url}#entry`,
    name: entry.title,
    headline: entry.title,
    description: entry.seoDescription || entry.description,
    url,
    datePublished: entry.dateAdded,
    dateModified: entry.repoUpdatedAt || entry.dateAdded,
    keywords: [...(entry.keywords || []), ...(entry.tags || [])].filter(Boolean).join(", "),
    genre: label,
    author: entry.author
      ? {
          "@type": "Person",
          name: entry.author,
          url: entry.authorProfileUrl,
        }
      : {
          "@type": "Organization",
          name: params.siteName || "HeyClaude",
          url: siteUrl,
        },
    isPartOf: {
      "@id": `${siteUrl.replace(/\/$/, "")}/#website`,
    },
    sameAs: [entry.documentationUrl, entry.repoUrl].filter(Boolean),
  };
}

export function buildToolSoftwareApplicationJsonLd(tool, params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const url = absoluteSiteUrl(siteUrl, `/tools/${tool.slug}`);
  const disclosure = normalizeDisclosure(tool.disclosure);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${url}#software`,
    name: tool.title,
    description: tool.seoDescription || tool.description,
    url: tool.websiteUrl || url,
    applicationCategory: tool.applicationCategory || "DeveloperApplication",
    operatingSystem: tool.operatingSystem || "Web",
    offers: tool.pricingModel
      ? {
          "@type": "Offer",
          category: tool.pricingModel,
          availability: "https://schema.org/InStock",
          url: tool.websiteUrl || url,
        }
      : undefined,
    isPartOf: {
      "@id": `${siteUrl.replace(/\/$/, "")}/#website`,
    },
    sameAs: [tool.documentationUrl, tool.repoUrl].filter(Boolean),
    additionalProperty: {
      "@type": "PropertyValue",
      name: "Disclosure",
      value: disclosure,
    },
  };
}

export function buildJobPostingJsonLd(job, params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const url = absoluteSiteUrl(siteUrl, `/jobs/${job.slug}`);
  const datePosted = job.postedAt || new Date().toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${url}#job`,
    title: job.title,
    description: job.description,
    datePosted,
    validThrough: job.expiresAt,
    employmentType: job.type,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: job.companyUrl,
    },
    jobLocationType: job.isRemote ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: job.isWorldwide
      ? undefined
      : {
          "@type": "Country",
          name: job.location || "United States",
        },
    jobLocation: job.isRemote
      ? undefined
      : {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
          },
        },
    url,
    directApply: Boolean(job.applyUrl),
  };
}
