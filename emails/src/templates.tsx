import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

const colors = {
  background: "#f7f5f1",
  card: "#fffefa",
  border: "#ded8cc",
  text: "#171717",
  muted: "#6f6a60",
  body: "#4f4a42",
};

const main = {
  margin: "0 auto",
  maxWidth: "640px",
  padding: "32px 20px",
};

const eyebrow = {
  margin: "0 0 16px",
  fontSize: "12px",
  letterSpacing: ".16em",
  textTransform: "uppercase" as const,
  color: colors.muted,
};

const card = {
  border: `1px solid ${colors.border}`,
  background: colors.card,
  borderRadius: "20px",
  padding: "28px",
};

const heading = {
  margin: "0",
  fontSize: "28px",
  lineHeight: "1.2",
  letterSpacing: "-.02em",
  color: colors.text,
};

const bodyText = {
  margin: "14px 0 0",
  fontSize: "15px",
  lineHeight: "1.7",
  color: colors.body,
};

const inset = {
  marginTop: "24px",
  padding: "18px",
  border: `1px solid ${colors.border}`,
  borderRadius: "16px",
  background: colors.background,
};

const insetFirst = {
  margin: "24px 0",
  padding: "18px",
  border: `1px solid ${colors.border}`,
  borderRadius: "16px",
  background: colors.background,
};

const label = {
  margin: "0 0 8px",
  fontSize: "11px",
  letterSpacing: ".14em",
  textTransform: "uppercase" as const,
  color: colors.muted,
};

const button = {
  display: "inline-block",
  marginTop: "14px",
  borderRadius: "12px",
  background: colors.text,
  color: colors.card,
  padding: "11px 16px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "700",
};

const footer = {
  margin: "18px 0 0",
  fontSize: "12px",
  lineHeight: "1.6",
  color: colors.muted,
};

function Shell({
  preview,
  eyebrowText,
  children,
}: {
  preview: string;
  eyebrowText: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: "0",
          background: colors.background,
          color: colors.text,
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <Container style={main}>
          <Text style={eyebrow}>{eyebrowText}</Text>
          <Section style={card}>{children}</Section>
          <Text style={footer}>
            You are receiving this because you subscribed to HeyClaude.{" "}
            {"{{RESEND_UNSUBSCRIBE}}"}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function CuratedDropDigestEmail() {
  return (
    <Shell
      preview="New HeyClaude picks for focused Claude workflows."
      eyebrowText="HeyClaude curated drop"
    >
      <Heading as="h1" style={heading}>
        {"{{TOPIC}}"}
      </Heading>
      <Text style={bodyText}>{"{{INTRO}}"}</Text>
      <Section style={insetFirst}>
        <Text style={{ ...label, marginBottom: "6px" }}>Featured</Text>
        <Heading
          as="h2"
          style={{ margin: "0", fontSize: "18px", lineHeight: "1.35" }}
        >
          {"{{FEATURED_TITLE}}"}
        </Heading>
        <Text
          style={{
            margin: "8px 0 0",
            fontSize: "14px",
            lineHeight: "1.65",
            color: colors.body,
          }}
        >
          {"{{FEATURED_DESCRIPTION}}"}
        </Text>
        <Button href="{{FEATURED_URL}}" style={button}>
          Open entry
        </Button>
      </Section>
      <Text
        style={{
          margin: "0",
          fontSize: "14px",
          lineHeight: "1.8",
          color: colors.text,
        }}
      >
        {"{{COMPACT_LINKS}}"}
      </Text>
      <Text
        style={{
          margin: "24px 0 0",
          fontSize: "14px",
          lineHeight: "1.7",
          color: colors.body,
        }}
      >
        {"{{MAINTAINER_NOTE}}"}
      </Text>
    </Shell>
  );
}

function ReleaseNotesEmail() {
  return (
    <Shell
      preview="HeyClaude registry and API updates."
      eyebrowText="HeyClaude release notes"
    >
      <Heading as="h1" style={heading}>
        Registry update: {"{{VERSION_OR_DATE}}"}
      </Heading>
      <Text style={bodyText}>{"{{SUMMARY}}"}</Text>
      <Text
        style={{
          marginTop: "24px",
          fontSize: "14px",
          lineHeight: "1.8",
          color: colors.text,
        }}
      >
        {"{{CHANGE_LIST}}"}
      </Text>
      <Section style={inset}>
        <Text style={label}>Distribution</Text>
        <Text
          style={{
            margin: "0",
            fontSize: "14px",
            lineHeight: "1.7",
            color: colors.body,
          }}
        >
          {"{{API_FEED_NOTE}}"}
        </Text>
        <Button href="{{CHANGELOG_URL}}" style={button}>
          Open changelog
        </Button>
      </Section>
    </Shell>
  );
}

function RelaunchBriefEmail() {
  return (
    <Shell
      preview="HeyClaude has new registry categories, feeds, jobs, and submission paths."
      eyebrowText="HeyClaude relaunch brief"
    >
      <Heading as="h1" style={heading}>
        {"{{HEADLINE}}"}
      </Heading>
      <Text style={bodyText}>{"{{INTRO}}"}</Text>
      <Section style={insetFirst}>
        <Text style={label}>What changed</Text>
        <Text
          style={{
            margin: "0",
            fontSize: "14px",
            lineHeight: "1.8",
            color: colors.text,
          }}
        >
          {"{{RELAUNCH_POINTS}}"}
        </Text>
      </Section>
      <Section style={inset}>
        <Text style={label}>Jobs board</Text>
        <Text
          style={{
            margin: "0",
            fontSize: "14px",
            lineHeight: "1.7",
            color: colors.body,
          }}
        >
          {"{{JOBS_NOTE}}"}
        </Text>
        <Button href="{{JOBS_URL}}" style={button}>
          Open jobs board
        </Button>
      </Section>
      <Text
        style={{
          margin: "24px 0 0",
          fontSize: "14px",
          lineHeight: "1.7",
          color: colors.body,
        }}
      >
        {"{{COMMUNITY_CTA}}"}
      </Text>
    </Shell>
  );
}

function MaintainerCallEmail() {
  return (
    <Shell
      preview="Help review new HeyClaude submissions."
      eyebrowText="HeyClaude maintainer call"
    >
      <Heading as="h1" style={heading}>
        {"{{QUEUE_THEME}}"}
      </Heading>
      <Text style={bodyText}>{"{{REVIEW_ASK}}"}</Text>
      <Section style={inset}>
        <Text style={label}>Queue</Text>
        <Text
          style={{
            margin: "0",
            fontSize: "14px",
            lineHeight: "1.7",
            color: colors.body,
          }}
        >
          {"{{QUEUE_SUMMARY}}"}
        </Text>
        <Button href="{{QUEUE_URL}}" style={button}>
          Open review queue
        </Button>
      </Section>
      <Text
        style={{
          margin: "24px 0 0",
          fontSize: "14px",
          lineHeight: "1.7",
          color: colors.body,
        }}
      >
        {"{{REVIEW_NOTES}}"}
      </Text>
    </Shell>
  );
}

export type EmailTemplateDefinition = {
  name: string;
  subject: string;
  component: React.ComponentType;
  text: string;
};

export const emailTemplateDefinitions: EmailTemplateDefinition[] = [
  {
    name: "curated-drop-digest",
    subject: "New HeyClaude picks: {{TOPIC}}",
    component: CuratedDropDigestEmail,
    text: `HeyClaude curated drop: {{TOPIC}}

{{INTRO}}

Featured: {{FEATURED_TITLE}}
{{FEATURED_DESCRIPTION}}
{{FEATURED_URL}}

{{COMPACT_LINKS}}

{{MAINTAINER_NOTE}}

You are receiving this because you subscribed to HeyClaude.
{{RESEND_UNSUBSCRIBE}}
`,
  },
  {
    name: "release-notes",
    subject: "HeyClaude registry update: {{VERSION_OR_DATE}}",
    component: ReleaseNotesEmail,
    text: `HeyClaude registry update: {{VERSION_OR_DATE}}

{{SUMMARY}}

{{CHANGE_LIST}}

{{API_FEED_NOTE}}
{{CHANGELOG_URL}}

You are receiving this because you subscribed to HeyClaude.
{{RESEND_UNSUBSCRIBE}}
`,
  },
  {
    name: "relaunch-brief",
    subject: "{{HEADLINE}}",
    component: RelaunchBriefEmail,
    text: `HeyClaude relaunch brief

{{INTRO}}

{{RELAUNCH_POINTS}}

Jobs board:
{{JOBS_NOTE}}
{{JOBS_URL}}

{{COMMUNITY_CTA}}

You are receiving this because you subscribed to HeyClaude.
{{RESEND_UNSUBSCRIBE}}
`,
  },
  {
    name: "maintainer-call",
    subject: "Help review new HeyClaude submissions",
    component: MaintainerCallEmail,
    text: `HeyClaude maintainer call: {{QUEUE_THEME}}

{{REVIEW_ASK}}

{{QUEUE_SUMMARY}}
{{QUEUE_URL}}

{{REVIEW_NOTES}}

You are receiving this because you subscribed to HeyClaude.
{{RESEND_UNSUBSCRIBE}}
`,
  },
];
