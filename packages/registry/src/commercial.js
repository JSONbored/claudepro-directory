export const LISTING_LEAD_KINDS = ["job", "tool", "claim"];
export const COMMERCIAL_TIERS = ["free", "standard", "featured", "sponsored"];
export const COMMERCIAL_PLACEMENT_TARGETS = ["job", "tool", "entry"];
export const DISCLOSURE_STATES = [
  "editorial",
  "heyclaude_pick",
  "affiliate",
  "sponsored",
  "claimed",
];
export const COMMERCIAL_STATUSES = [
  "new",
  "pending_review",
  "approved",
  "active",
  "rejected",
  "expired",
  "archived",
];
export const JOB_SOURCE_STATUSES = ["active", "stale_pending_review", "closed"];

export function normalizeCommercialTier(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return COMMERCIAL_TIERS.includes(normalized) ? normalized : "free";
}

export function normalizeLeadKind(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return LISTING_LEAD_KINDS.includes(normalized) ? normalized : "tool";
}

export function normalizeDisclosure(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (DISCLOSURE_STATES.includes(normalized)) return normalized;
  return "editorial";
}

export function isPaidOrAffiliateDisclosure(value) {
  const disclosure = normalizeDisclosure(value);
  return disclosure === "sponsored" || disclosure === "affiliate";
}

export function normalizePricingModel(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (
    [
      "free",
      "freemium",
      "paid",
      "open-source",
      "subscription",
      "usage-based",
      "contact-sales",
    ].includes(normalized)
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
  const contactEmail = String(payload.contactEmail || "")
    .trim()
    .toLowerCase();
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
  if (
    (kind === "tool" || kind === "claim") &&
    !/^https:\/\//i.test(websiteUrl)
  ) {
    errors.push(`${kind} leads require an https websiteUrl`);
  }
  if (kind === "job" && !/^https:\/\//i.test(applyUrl)) {
    errors.push("job leads require an https applyUrl");
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

export function evaluateJobSourceLifecycle(input = {}, now = new Date()) {
  const currentStatus = String(input.currentStatus || "active")
    .trim()
    .toLowerCase();
  const staleCheckCount = Math.max(
    0,
    Number.isFinite(Number(input.staleCheckCount))
      ? Math.trunc(Number(input.staleCheckCount))
      : 0,
  );
  const expiresAt = input.expiresAt || "";
  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const expiryTime = expiresAt ? new Date(expiresAt).getTime() : null;
  const expired =
    expiryTime !== null && Number.isFinite(expiryTime) && expiryTime < nowTime;
  const sourceHealthy =
    input.sourceOk === true &&
    input.titleMatched !== false &&
    input.companyMatched !== false &&
    input.closureDetected !== true &&
    input.applyDetected === true;

  if (currentStatus === "closed" || currentStatus === "archived" || expired) {
    return {
      status: "closed",
      staleCheckCount,
      indexable: false,
      reason: expired ? "expired" : currentStatus,
    };
  }

  if (sourceHealthy) {
    return {
      status: "active",
      staleCheckCount: 0,
      indexable: true,
      reason: "source_verified",
    };
  }

  if (staleCheckCount <= 0) {
    return {
      status: "stale_pending_review",
      staleCheckCount: 1,
      indexable: false,
      reason: "first_failed_source_check",
    };
  }

  return {
    status: "closed",
    staleCheckCount: staleCheckCount + 1,
    indexable: false,
    reason: "repeated_failed_source_check",
  };
}

export function normalizeCommercialStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return COMMERCIAL_STATUSES.includes(normalized) ? normalized : "new";
}

export function isPlacementActive(placement = {}, now = new Date()) {
  const status = normalizeCommercialStatus(placement.status || "active");
  if (status !== "active") return false;

  const startsAt = placement.startsAt || placement.starts_at;
  const expiresAt = placement.expiresAt || placement.expires_at;
  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const startTime = startsAt ? new Date(startsAt).getTime() : null;
  const expiryTime = expiresAt ? new Date(expiresAt).getTime() : null;

  if (startTime && Number.isFinite(startTime) && startTime > nowTime)
    return false;
  if (expiryTime && Number.isFinite(expiryTime) && expiryTime < nowTime)
    return false;
  return true;
}

export function linkRelForDisclosure(value) {
  return isPaidOrAffiliateDisclosure(value)
    ? "sponsored nofollow noreferrer"
    : "noreferrer";
}

export function toolPlacementRank(tool = {}) {
  return (
    Number(Boolean(tool.sponsored)) * 3 + Number(Boolean(tool.featured)) * 2
  );
}

export function compareToolListings(left = {}, right = {}) {
  const rankDelta = toolPlacementRank(right) - toolPlacementRank(left);
  if (rankDelta !== 0) return rankDelta;

  const dateDelta = String(right.dateAdded || "").localeCompare(
    String(left.dateAdded || ""),
  );
  if (dateDelta !== 0) return dateDelta;

  return String(left.title || left.slug || "").localeCompare(
    String(right.title || right.slug || ""),
  );
}

export function nextLeadStatus(currentStatus, action) {
  const current = normalizeCommercialStatus(currentStatus);
  const normalizedAction = String(action || "")
    .trim()
    .toLowerCase();
  const transitions = {
    new: {
      review: "pending_review",
      approve: "approved",
      reject: "rejected",
      archive: "archived",
    },
    pending_review: {
      approve: "approved",
      reject: "rejected",
      archive: "archived",
    },
    approved: {
      activate: "active",
      reject: "rejected",
      archive: "archived",
    },
    active: {
      expire: "expired",
      archive: "archived",
    },
    rejected: {
      archive: "archived",
    },
    expired: {
      archive: "archived",
    },
    archived: {},
  };

  return transitions[current]?.[normalizedAction] ?? current;
}

export function summarizePlacementExpiry(
  placements = [],
  now = new Date(),
  reminderWindowDays = 14,
) {
  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const windowMs = reminderWindowDays * 86_400_000;

  return placements
    .map((placement) => {
      const expiresAt = placement.expiresAt || placement.expires_at;
      const expiryTime = expiresAt ? new Date(expiresAt).getTime() : null;
      const daysUntilExpiry =
        expiryTime && Number.isFinite(expiryTime)
          ? Math.ceil((expiryTime - nowTime) / 86_400_000)
          : null;
      const status = normalizeCommercialStatus(placement.status || "active");

      return {
        targetKind: placement.targetKind || placement.target_kind || "",
        targetKey: placement.targetKey || placement.target_key || "",
        tier: normalizeCommercialTier(placement.tier),
        status,
        expiresAt: expiresAt || "",
        daysUntilExpiry,
        needsRenewalReminder:
          status === "active" &&
          daysUntilExpiry !== null &&
          daysUntilExpiry >= 0 &&
          daysUntilExpiry <= Math.ceil(windowMs / 86_400_000),
        expired:
          status === "active" &&
          daysUntilExpiry !== null &&
          daysUntilExpiry < 0,
      };
    })
    .sort((left, right) => {
      const leftDays = left.daysUntilExpiry ?? Number.POSITIVE_INFINITY;
      const rightDays = right.daysUntilExpiry ?? Number.POSITIVE_INFINITY;
      return (
        leftDays - rightDays || left.targetKey.localeCompare(right.targetKey)
      );
    });
}

export function buildPlacementRenewalReminder(summary) {
  if (!summary?.needsRenewalReminder) return "";
  return [
    `${summary.tier} ${summary.targetKind} placement ${summary.targetKey} expires in ${summary.daysUntilExpiry} day${summary.daysUntilExpiry === 1 ? "" : "s"}.`,
    "Review performance, confirm disclosure remains accurate, and contact the sponsor before expiry.",
  ].join(" ");
}
