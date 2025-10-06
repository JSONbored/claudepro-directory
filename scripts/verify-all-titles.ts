#!/usr/bin/env tsx

/**
 * Comprehensive SEO Title Verification
 * Verifies ALL page titles from generated content and guides
 */

import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";

interface TitleCheck {
  route: string;
  title: string;
  seoTitle?: string;
  finalTitle: string;
  length: number;
  status: "pass" | "warn" | "fail";
  category: string;
}

const results: TitleCheck[] = [];
const MAX_CHARS = 60;
const OPTIMAL_MIN = 55;

const SITE_SUFFIX = " - Claude Pro Directory";
const SECTION_SUFFIXES = {
  guides: " - Guides - Claude Pro Directory",
  collections: " - Collections - Claude Pro Directory",
};

async function checkTitle(
  route: string,
  title: string,
  seoTitle: string | undefined,
  category: string,
  sectionSuffix?: string,
) {
  const effectiveTitle = seoTitle || title;
  const finalTitle = effectiveTitle + (sectionSuffix || "");
  const length = finalTitle.length;

  let status: "pass" | "warn" | "fail" = "pass";
  if (length > MAX_CHARS) {
    status = "fail";
  } else if (length < OPTIMAL_MIN) {
    status = "warn";
  }

  results.push({
    route,
    title,
    seoTitle,
    finalTitle,
    length,
    status,
    category,
  });
}

async function main() {
  console.log("🔍 COMPREHENSIVE SEO TITLE VERIFICATION\n");
  console.log("=".repeat(100));

  const contentDir = path.join(process.cwd(), "public/static-api");

  // 1. Guides - check all MDX files
  console.log("\n📚 Checking Guides...");
  const guidesDir = path.join(process.cwd(), "content/guides");
  const guideCategories = await fs.readdir(guidesDir);

  let guidesCount = 0;
  for (const guideCategory of guideCategories) {
    const categoryPath = path.join(guidesDir, guideCategory);
    const stat = await fs.stat(categoryPath);

    if (stat.isDirectory()) {
      const files = await fs.readdir(categoryPath);
      for (const file of files) {
        if (file.endsWith(".mdx")) {
          const content = await fs.readFile(
            path.join(categoryPath, file),
            "utf-8",
          );
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

          if (frontmatterMatch) {
            const frontmatter: { title?: string; seoTitle?: string } = {};
            const lines = frontmatterMatch[1].split("\n");

            for (const line of lines) {
              const titleMatch = line.match(/^title:\s*["'](.+)["']/);
              const seoTitleMatch = line.match(/^seoTitle:\s*["'](.+)["']/);

              if (titleMatch) {
                frontmatter.title = titleMatch[1];
              }
              if (seoTitleMatch) {
                frontmatter.seoTitle = seoTitleMatch[1];
              }
            }

            const slug = file.replace(".mdx", "");
            await checkTitle(
              `/guides/${guideCategory}/${slug}`,
              frontmatter.title || "Unknown",
              frontmatter.seoTitle,
              "guide",
              SECTION_SUFFIXES.guides,
            );
            guidesCount++;
          }
        }
      }
    }
  }
  console.log(`✓ Checked ${guidesCount} guides`);

  // 2. Collections
  console.log("\n📦 Checking Collections...");
  const collectionsFile = path.join(contentDir, "collections.json");
  if (existsSync(collectionsFile)) {
    const collectionsData = JSON.parse(
      await fs.readFile(collectionsFile, "utf-8"),
    );
    const collections = collectionsData.collections || collectionsData;
    for (const collection of collections) {
      await checkTitle(
        `/collections/${collection.slug}`,
        collection.title,
        collection.seoTitle,
        "collection",
        SECTION_SUFFIXES.collections,
      );
    }
    console.log(`✓ Checked ${collections.length} collections`);
  }

  // 3. Content pages (agents, mcp, rules, commands, hooks, statuslines)
  console.log("\n⚙️  Checking Content Pages...");
  const categories = [
    "agents",
    "mcp",
    "rules",
    "commands",
    "hooks",
    "statuslines",
  ];
  let contentCount = 0;

  for (const category of categories) {
    const apiFile = path.join(contentDir, `${category}.json`);
    if (existsSync(apiFile)) {
      const itemsData = JSON.parse(await fs.readFile(apiFile, "utf-8"));
      const items = itemsData[category] || itemsData;

      for (const item of items) {
        const categoryDisplay =
          category.charAt(0).toUpperCase() + category.slice(1);

        await checkTitle(
          `/${category}/${item.slug}`,
          item.title || item.name || item.slug,
          item.seoTitle,
          category,
          ` - ${categoryDisplay}${SITE_SUFFIX}`,
        );
        contentCount++;
      }
    }
  }
  console.log(`✓ Checked ${contentCount} content pages`);

  // Print results
  console.log(`\n${"=".repeat(100)}`);
  console.log("\n📊 DETAILED RESULTS\n");
  console.log("=".repeat(100));

  const failures = results.filter((r) => r.status === "fail");
  const warnings = results.filter((r) => r.status === "warn");
  const passes = results.filter((r) => r.status === "pass");

  if (failures.length > 0) {
    console.log(`\n❌ FAILURES (>${MAX_CHARS} chars): ${failures.length}\n`);
    for (const result of failures) {
      console.log(`   ${result.length} chars | ${result.route}`);
      console.log(`   Title: "${result.title}"`);
      if (result.seoTitle) {
        console.log(`   SEO Title: "${result.seoTitle}"`);
      }
      console.log(`   Final: "${result.finalTitle}"`);
      console.log(`   OVER BY: ${result.length - MAX_CHARS} chars\n`);
    }
  }

  // Print all results in a single compact list
  console.log("\n📋 ALL PAGE TITLES\n");

  for (const result of results) {
    const emoji =
      result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️" : "❌";
    console.log(
      `${emoji} [${result.length}] ${result.route} → "${result.finalTitle}"`,
    );
  }

  // Summary by category
  console.log(`\n${"=".repeat(100)}`);
  console.log("\n📈 SUMMARY BY CATEGORY\n");
  console.log(`${"=".repeat(100)}\n`);

  const categories_unique = [...new Set(results.map((r) => r.category))];
  for (const category of categories_unique) {
    const catResults = results.filter((r) => r.category === category);
    const catFails = catResults.filter((r) => r.status === "fail");
    const catWarns = catResults.filter((r) => r.status === "warn");
    const catPasses = catResults.filter((r) => r.status === "pass");

    const avgLength = (
      catResults.reduce((sum, r) => sum + r.length, 0) / catResults.length
    ).toFixed(1);

    console.log(
      `${category.toUpperCase().padEnd(15)} | Total: ${catResults.length.toString().padStart(3)} | ✅ ${catPasses.length.toString().padStart(3)} | ⚠️  ${catWarns.length.toString().padStart(3)} | ❌ ${catFails.length.toString().padStart(3)} | Avg: ${avgLength} chars`,
    );
  }

  // Final summary
  console.log(`\n${"=".repeat(100)}`);
  console.log("\n🎯 FINAL RESULTS\n");
  console.log(`${"=".repeat(100)}\n`);
  console.log(`Total Pages: ${results.length}`);
  console.log(
    `✅ Optimal (${OPTIMAL_MIN}-${MAX_CHARS} chars): ${passes.length} (${((passes.length / results.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `⚠️  Underutilized (<${OPTIMAL_MIN} chars): ${warnings.length} (${((warnings.length / results.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `❌ Over Limit (>${MAX_CHARS} chars): ${failures.length} (${((failures.length / results.length) * 100).toFixed(1)}%)`,
  );

  if (failures.length === 0) {
    console.log(
      "\n✨ SUCCESS! All page titles are within SEO limits (<60 chars)\n",
    );
    process.exit(0);
  } else {
    console.log(
      "\n⚠️  FAILED: Some page titles exceed 60 characters. Review required.\n",
    );
    process.exit(1);
  }
}

main().catch(console.error);
