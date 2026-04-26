export const LISTING_LEAD_KINDS = ["job", "tool"];
export const COMMERCIAL_TIERS = ["free", "standard", "featured", "sponsored"];
export const COMMERCIAL_PLACEMENT_TARGETS = ["job", "tool", "entry"];
export const COMMERCIAL_STATUSES = [
  "new",
  "pending_review",
  "approved",
  "active",
  "rejected",
  "expired",
  "archived",
];

export function normalizeCommercialTier(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return COMMERCIAL_TIERS.includes(normalized) ? normalized : "free";
}

export function normalizeLeadKind(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return LISTING_LEAD_KINDS.includes(normalized) ? normalized : "tool";
}

export function normalizeDisclosure(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "sponsored" || normalized === "affiliate" || normalized === "editorial") {
    return normalized;
  }
  return "editorial";
}

export function isPaidOrAffiliateDisclosure(value) {
  const disclosure = normalizeDisclosure(value);
  return disclosure === "sponsored" || disclosure === "affiliate";
}

export function normalizePricingModel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    ["free", "freemium", "paid", "open-source", "subscription", "usage-based", "contact-sales"].includes(
      normalized,
    )
  ) {
    return normalized;
  }
  return "";
}

export function validateListingLeadPayload(payload = {}) {
  const errors = [];
  const kind = normalizeLeadKind(payload.kind);
  const tierInterest = normalizeCommercialTier(payload.tierInterest);
  const contactName = String(payload.contactName || "").trim();
  const contactEmail = String(payload.contactEmail || "").trim().toLowerCase();
  const companyName = String(payload.companyName || "").trim();
  const listingTitle = String(payload.listingTitle || "").trim();
  const websiteUrl = String(payload.websiteUrl || "").trim();
  const applyUrl = String(payload.applyUrl || "").trim();
  const message = String(payload.message || "").trim();

  if (!contactName) errors.push("contactName is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    errors.push("valid contactEmail is required");
  }
  if (!companyName) errors.push("companyName is required");
  if (!listingTitle) errors.push("listingTitle is required");
  if (kind === "tool" && !/^https:\/\//i.test(websiteUrl)) {
    errors.push("tool leads require an https websiteUrl");
  }
  if (kind === "job" && applyUrl && !/^https:\/\//i.test(applyUrl)) {
    errors.push("job applyUrl must use https when provided");
  }

  return {
    ok: errors.length === 0,
    errors,
    data: {
      kind,
      tierInterest,
      contactName,
      contactEmail,
      companyName,
      listingTitle,
      websiteUrl,
      applyUrl,
      message,
    },
  };
}
