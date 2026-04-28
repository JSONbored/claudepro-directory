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
    sameAs: [params.githubUrl, params.twitterUrl, params.discordUrl].filter(
      Boolean,
    ),
  };
}

export function buildWebsiteJsonLd(params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${normalizedSiteUrl}/#website`,
    name: params.name || "HeyClaude",
    url: siteUrl,
    description:
      params.description || "A directory for Claude resources and tools.",
    publisher: {
      "@id": `${normalizedSiteUrl}/#organization`,
    },
    potentialAction: buildSearchActionJsonLd({ siteUrl: normalizedSiteUrl }),
  };
}

export function buildSearchActionJsonLd(params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  return {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${normalizedSiteUrl}/browse?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  };
}

export function buildWebPageJsonLd(params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const url = absoluteSiteUrl(siteUrl, params.path || "/");
  return {
    "@context": "https://schema.org",
    "@type": params.type || "WebPage",
    "@id": `${url}#webpage`,
    name: params.name,
    description: params.description,
    url,
    isPartOf: {
      "@id": `${siteUrl.replace(/\/$/, "")}/#website`,
    },
    breadcrumb: params.breadcrumbId
      ? {
          "@id": params.breadcrumbId,
        }
      : undefined,
  };
}

export function buildCollectionPageJsonLd(params = {}) {
  return buildWebPageJsonLd({
    ...params,
    type: "CollectionPage",
  });
}

export function buildBreadcrumbJsonLd(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": items.at(-1)?.url ? `${items.at(-1).url}#breadcrumb` : undefined,
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
  const label =
    categorySpec.categories?.[entry.category]?.label || entry.category;
  const codeLikeCategories = new Set([
    "commands",
    "hooks",
    "mcp",
    "statuslines",
  ]);
  const entryType =
    entry.category === "guides"
      ? "TechArticle"
      : codeLikeCategories.has(entry.category)
        ? "SoftwareSourceCode"
        : "CreativeWork";
  const sourceUrls = [
    entry.documentationUrl,
    entry.repoUrl,
    entry.githubUrl,
    entry.websiteUrl,
  ].filter(Boolean);
  const additionalProperty = [
    entry.downloadSha256
      ? {
          "@type": "PropertyValue",
          name: "Package SHA256",
          value: entry.downloadSha256,
        }
      : null,
    entry.platformCompatibility?.length
      ? {
          "@type": "PropertyValue",
          name: "Platform compatibility",
          value: entry.platformCompatibility
            .map((item) => `${item.platform}: ${item.supportLevel}`)
            .join(", "),
        }
      : null,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": entryType,
    "@id": `${url}#entry`,
    name: entry.title,
    headline: entry.title,
    description: entry.seoDescription || entry.description,
    url,
    datePublished: entry.dateAdded,
    dateModified:
      entry.contentUpdatedAt ||
      entry.repoUpdatedAt ||
      entry.verifiedAt ||
      entry.dateAdded,
    keywords: [...(entry.keywords || []), ...(entry.tags || [])]
      .filter(Boolean)
      .join(", "),
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
    isBasedOn: sourceUrls.length ? sourceUrls : undefined,
    codeRepository:
      entryType === "SoftwareSourceCode" ? entry.repoUrl : undefined,
    programmingLanguage:
      entryType === "SoftwareSourceCode" ? entry.scriptLanguage : undefined,
    runtimePlatform:
      entryType === "SoftwareSourceCode" ? "Claude Code" : undefined,
    additionalProperty: additionalProperty.length
      ? additionalProperty
      : undefined,
  };
}

export function buildToolSoftwareApplicationJsonLd(tool, params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const url = absoluteSiteUrl(siteUrl, `/tools/${tool.slug}`);
  const disclosure = normalizeDisclosure(tool.disclosure);
  const pricingModel = String(tool.pricingModel || "")
    .trim()
    .toLowerCase();
  const hasRequiredVisibleFields = Boolean(
    tool.title &&
    tool.description &&
    tool.websiteUrl &&
    tool.applicationCategory &&
    tool.operatingSystem &&
    pricingModel,
  );

  if (!hasRequiredVisibleFields) {
    return null;
  }

  const freeLike = pricingModel === "free" || pricingModel === "open-source";

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${url}#software`,
    name: tool.title,
    description: tool.seoDescription || tool.description,
    url: tool.websiteUrl || url,
    applicationCategory: tool.applicationCategory || "DeveloperApplication",
    operatingSystem: tool.operatingSystem || "Web",
    offers: {
      "@type": "Offer",
      price: freeLike ? "0" : undefined,
      priceCurrency: freeLike ? "USD" : undefined,
      category: pricingModel,
      availability: "https://schema.org/InStock",
      url: tool.websiteUrl || url,
    },
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
  if (
    !job?.slug ||
    !job?.title ||
    !job?.company ||
    !job?.description ||
    !job?.postedAt ||
    !job?.expiresAt ||
    !job?.applyUrl
  ) {
    return null;
  }

  const siteUrl = params.siteUrl || "https://heyclau.de";
  const url = absoluteSiteUrl(siteUrl, `/jobs/${job.slug}`);
  const baseSalary = parseJobCompensation(job.compensation);
  const jobBenefits = Array.isArray(job.benefits)
    ? job.benefits.filter(Boolean).join("; ")
    : undefined;
  const description = buildJobPostingDescription(job);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${url}#job`,
    title: job.title,
    description,
    datePosted: job.postedAt,
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
    baseSalary,
    jobBenefits: jobBenefits || undefined,
    url,
    directApply: false,
  };
}

function buildJobPostingDescription(job) {
  const parts = [];
  const summary = cleanJobDescriptionText(job.description);
  const details = cleanJobDescriptionText(job.descriptionMd);

  if (summary) parts.push(summary);
  if (details && details !== summary) parts.push(details);
  if (Array.isArray(job.responsibilities) && job.responsibilities.length) {
    parts.push(
      `Responsibilities: ${job.responsibilities
        .map(cleanJobDescriptionText)
        .filter(Boolean)
        .join(" ")}`,
    );
  }
  if (Array.isArray(job.requirements) && job.requirements.length) {
    parts.push(
      `Requirements: ${job.requirements
        .map(cleanJobDescriptionText)
        .filter(Boolean)
        .join(" ")}`,
    );
  }
  if (job.compensation)
    parts.push(`Salary: ${cleanJobDescriptionText(job.compensation)}.`);
  if (job.equity) parts.push(`Equity: ${cleanJobDescriptionText(job.equity)}.`);
  if (job.bonus) parts.push(`Bonus: ${cleanJobDescriptionText(job.bonus)}.`);
  if (jobBenefitsFromJob(job)) {
    parts.push(`Benefits: ${jobBenefitsFromJob(job)}.`);
  }

  return parts.filter(Boolean).join("\n\n").trim();
}

function cleanJobDescriptionText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function jobBenefitsFromJob(job) {
  return Array.isArray(job.benefits)
    ? job.benefits.map(cleanJobDescriptionText).filter(Boolean).join("; ")
    : "";
}

function parseJobCompensation(value) {
  const text = String(value || "").trim();
  if (!text) return undefined;
  const match = text.match(
    /([$€£])\s*([\d,.]+)\s*([kK])?\s*[–-]\s*(?:[$€£]\s*)?([\d,.]+)\s*([kK])?/,
  );
  if (!match) return undefined;

  const currencyBySymbol = {
    $: "USD",
    "€": "EUR",
    "£": "GBP",
  };
  const currency = currencyBySymbol[match[1]];
  if (!currency) return undefined;

  const parseAmount = (amount, suffix) => {
    const numeric = Number(String(amount).replace(/,/g, ""));
    if (!Number.isFinite(numeric)) return null;
    return Math.round(numeric * (suffix?.toLowerCase() === "k" ? 1000 : 1));
  };

  const minValue = parseAmount(match[2], match[3]);
  const maxValue = parseAmount(match[4], match[5] || match[3]);
  if (!minValue || !maxValue) return undefined;

  return {
    "@type": "MonetaryAmount",
    currency,
    value: {
      "@type": "QuantitativeValue",
      minValue,
      maxValue,
      unitText: "YEAR",
    },
  };
}

export function buildEntryJsonLdSnapshot(entry, params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const label =
    categorySpec.categories?.[entry.category]?.label || entry.category;
  const url = absoluteSiteUrl(siteUrl, `/${entry.category}/${entry.slug}`);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: label, url: absoluteSiteUrl(siteUrl, `/${entry.category}`) },
    { name: entry.title, url },
  ]);

  return {
    key: `${entry.category}:${entry.slug}`,
    category: entry.category,
    slug: entry.slug,
    url,
    documents: [
      breadcrumb,
      buildWebPageJsonLd({
        siteUrl,
        path: `/${entry.category}/${entry.slug}`,
        name: entry.title,
        description: entry.seoDescription || entry.description,
        breadcrumbId: `${url}#breadcrumb`,
      }),
      buildEntryJsonLd(entry, params),
    ],
  };
}
