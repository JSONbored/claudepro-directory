/**
 * Usage Example Factory
 *
 * Generates realistic code examples for content types.
 * Used across agents, MCPs, commands, rules, etc.
 *
 * @see src/lib/schemas/content/base-content.schema.ts
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { z } from 'zod';
import type { baseUsageExampleSchema } from '@/src/lib/schemas/content/base-content.schema';

type UsageExample = z.infer<typeof baseUsageExampleSchema>;

export const usageExampleFactory = Factory.define<UsageExample>(() => {
  const language = faker.helpers.arrayElement([
    'typescript',
    'javascript',
    'json',
    'bash',
    'python',
  ] as const);

  const codeExamples: Record<string, string> = {
    typescript: `import { ${faker.word.noun()} } from '@/lib/${faker.word.noun()}';

export async function ${faker.word.verb()}() {
  const result = await ${faker.word.verb()}Data();
  return result;
}`,
    javascript: `const ${faker.word.noun()} = require('./${faker.word.noun()}');

module.exports = {
  ${faker.word.verb()}: async () => {
    return await ${faker.word.noun()}.${faker.word.verb()}();
  }
};`,
    json: JSON.stringify(
      {
        [faker.word.noun()]: faker.word.adjective(),
        [faker.word.noun()]: faker.number.int({ min: 1, max: 100 }),
        [faker.word.noun()]: faker.datatype.boolean(),
      },
      null,
      2
    ),
    bash: `#!/bin/bash
${faker.word.verb()} --${faker.word.noun()} "${faker.word.adjective()}"
echo "Done!"`,
    python: `def ${faker.word.verb()}():
    ${faker.word.noun()} = "${faker.word.adjective()}"
    return ${faker.word.noun()}`,
  };

  return {
    title: faker.helpers.arrayElement([
      'Basic Usage',
      'Advanced Configuration',
      'Quick Start',
      'Common Example',
      'Production Setup',
      'Development Mode',
    ]),
    language,
    code: codeExamples[language] || codeExamples.typescript,
    description: faker.datatype.boolean()
      ? faker.lorem.sentence({ min: 5, max: 15 })
      : undefined,
  };
});
