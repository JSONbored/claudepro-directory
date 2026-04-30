import * as React from "react";
import prettier from "prettier";
import { render } from "react-email";

import {
  emailTemplateDefinitions,
  type EmailTemplateDefinition,
} from "./templates";

export type RenderedEmailTemplate = {
  name: string;
  subject: string;
  html: string;
  text: string;
};

export async function renderEmailTemplate(
  definition: EmailTemplateDefinition,
): Promise<RenderedEmailTemplate> {
  const renderedHtml = await render(React.createElement(definition.component), {
    pretty: true,
  });
  const html = await prettier.format(renderedHtml, { parser: "html" });
  return {
    name: definition.name,
    subject: definition.subject,
    html: html.endsWith("\n") ? html : `${html}\n`,
    text: definition.text.endsWith("\n")
      ? definition.text
      : `${definition.text}\n`,
  };
}

export async function renderAllEmailTemplates() {
  return Promise.all(emailTemplateDefinitions.map(renderEmailTemplate));
}
