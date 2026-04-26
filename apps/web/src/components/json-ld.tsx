type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown> | null | undefined> | null | undefined;
};

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data.filter(Boolean) : data ? [data] : [];
  if (!items.length) return null;

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(item) }}
        />
      ))}
    </>
  );
}
