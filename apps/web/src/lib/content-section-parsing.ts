import { htmlToPlainText } from "@/lib/detail-assembly";

export type SectionSubitem = {
  id: string;
  title: string;
  html: string;
};

const SECTION_TYPE_MARKER = "section type:";
const SECTION_TYPE_COMMENT_START = "<!--";
const SECTION_TYPE_COMMENT_END = "-->";
const MAX_SECTION_TYPE_LENGTH = 64;
const H3_CLOSE_TAG = "</h3>";

function stripTags(value: string) {
  return htmlToPlainText(value);
}

function readSectionTypeCommentRange(html: string) {
  const lowerHtml = html.toLowerCase();
  const markerIndex = lowerHtml.indexOf(SECTION_TYPE_MARKER);
  if (markerIndex < 0) return null;

  const commentStart = html.lastIndexOf(
    SECTION_TYPE_COMMENT_START,
    markerIndex,
  );
  const commentEnd = html.indexOf(SECTION_TYPE_COMMENT_END, markerIndex);
  if (commentStart < 0 || commentEnd < markerIndex) return null;

  const previousCommentEnd = html.lastIndexOf(
    SECTION_TYPE_COMMENT_END,
    markerIndex,
  );
  if (previousCommentEnd > commentStart) return null;

  return {
    markerIndex,
    start: commentStart,
    end: commentEnd + SECTION_TYPE_COMMENT_END.length,
  };
}

export function getEmbeddedSectionType(html: string) {
  const range = readSectionTypeCommentRange(html);
  if (!range) return null;

  const valueStart = range.markerIndex + SECTION_TYPE_MARKER.length;
  const rawValue = html.slice(valueStart, range.end).trim();
  let sectionType = "";

  for (const char of rawValue.slice(0, MAX_SECTION_TYPE_LENGTH)) {
    const code = char.charCodeAt(0);
    const isAsciiLetter =
      (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    if (isAsciiLetter || char === "_") {
      sectionType += char.toLowerCase();
      continue;
    }
    break;
  }

  return sectionType || null;
}

export function stripSectionTypeComments(html: string) {
  const range = readSectionTypeCommentRange(html);
  if (!range) return html.trim();

  return `${html.slice(0, range.start)}${html.slice(range.end)}`.trim();
}

function isTagBoundary(char: string) {
  return (
    char === "" ||
    char === ">" ||
    char === " " ||
    char === "\n" ||
    char === "\r" ||
    char === "\t"
  );
}

export function findNextH3Start(html: string, from = 0) {
  const lowerHtml = html.toLowerCase();
  let index = lowerHtml.indexOf("<h3", from);

  while (index >= 0) {
    if (isTagBoundary(html.charAt(index + 3))) return index;
    index = lowerHtml.indexOf("<h3", index + 3);
  }

  return -1;
}

export function htmlBeforeFirstH3(html: string) {
  const h3Start = findNextH3Start(html);
  return (h3Start >= 0 ? html.slice(0, h3Start) : html).trim();
}

function extractHeadingInnerHtml(headingHtml: string) {
  const openEnd = headingHtml.indexOf(">");
  const closeStart = headingHtml.toLowerCase().lastIndexOf(H3_CLOSE_TAG);
  if (openEnd < 0) return headingHtml;
  return headingHtml.slice(
    openEnd + 1,
    closeStart > openEnd ? closeStart : undefined,
  );
}

function isAttributeBoundary(char: string) {
  return (
    char === "" ||
    char === "<" ||
    char === " " ||
    char === "\n" ||
    char === "\r" ||
    char === "\t"
  );
}

function readQuotedAttribute(html: string, attributeName: string) {
  const lowerHtml = html.toLowerCase();
  const tagEnd = html.indexOf(">");
  const limit = tagEnd >= 0 ? tagEnd : html.length;

  for (const quote of ['"', "'"]) {
    const token = `${attributeName.toLowerCase()}=${quote}`;
    let index = lowerHtml.indexOf(token);
    while (index >= 0 && index < limit) {
      if (isAttributeBoundary(lowerHtml.charAt(index - 1))) {
        const valueStart = index + token.length;
        const valueEnd = html.indexOf(quote, valueStart);
        if (valueEnd > valueStart && valueEnd <= limit) {
          return html.slice(valueStart, valueEnd);
        }
      }
      index = lowerHtml.indexOf(token, index + token.length);
    }
  }

  return null;
}

export function extractSectionSubitems(
  html: string,
  sectionId: string,
): SectionSubitem[] {
  const items: SectionSubitem[] = [];
  let h3Start = findNextH3Start(html);

  while (h3Start >= 0) {
    const lowerHtml = html.toLowerCase();
    const headingCloseStart = lowerHtml.indexOf(H3_CLOSE_TAG, h3Start);
    if (headingCloseStart < 0) break;

    const headingCloseEnd = headingCloseStart + H3_CLOSE_TAG.length;
    const nextH3Start = findNextH3Start(html, headingCloseEnd);
    const itemEnd = nextH3Start >= 0 ? nextH3Start : html.length;
    const headingHtml = html.slice(h3Start, headingCloseEnd);
    const bodyHtml = html.slice(headingCloseEnd, itemEnd).trim();
    const headingTitle = stripTags(extractHeadingInnerHtml(headingHtml));
    const fallbackTitle = stripTags(bodyHtml).split("\n")[0];

    items.push({
      id:
        readQuotedAttribute(headingHtml, "id") ||
        `${sectionId}-${items.length + 1}`,
      title: headingTitle || fallbackTitle || "Troubleshooting item",
      html: bodyHtml,
    });

    h3Start = nextH3Start;
  }

  return items.filter((item) => item.html.length > 0);
}
