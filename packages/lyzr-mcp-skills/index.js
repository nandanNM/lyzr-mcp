#!/usr/bin/env node
/**
 * `npx lyzr-mcp-skills` — Supabase-CLI-style interactive installer.
 *
 * Standalone package (not a sub-command of lyzr-mcp) so bare `npx lyzr-mcp-skills`
 * works, matching `npx skills add supabase/agent-skills`-style ergonomics.
 * Lists the Claude skills bundled here (one per Lyzr capability) and lets the
 * user pick which ones to drop into their project's `.claude/skills/` directory.
 * Non-interactive: pass skill names (or `all`) as argv.
 */
import { readdirSync, readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const skillsRoot = join(dirname(fileURLToPath(import.meta.url)), "skills");

/** Minimal frontmatter reader — this project's SKILL.md files only ever use flat `key: value` lines. */
const readFrontmatter = (path) => {
  const text = readFileSync(path, "utf8");
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  const out = {};
  if (!match) return out;
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
};

const discoverSkills = () =>
  readdirSync(skillsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dir = join(skillsRoot, e.name);
      const fm = readFrontmatter(join(dir, "SKILL.md"));
      return { id: fm.name || e.name, description: fm.description || "", dir };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

const install = (skill, targetRoot) => {
  const dest = join(targetRoot, ".claude", "skills", skill.id);
  mkdirSync(dest, { recursive: true });
  copyFileSync(join(skill.dir, "SKILL.md"), join(dest, "SKILL.md"));
};

const promptSelection = (skills) =>
  new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(
      "\nEnter numbers to install (comma-separated), or 'all', or blank to cancel: ",
      (answer) => {
        rl.close();
        const trimmed = answer.trim().toLowerCase();
        if (!trimmed) return resolve([]);
        if (trimmed === "all") return resolve(skills.map((_, i) => i));
        resolve(
          trimmed
            .split(",")
            .map((s) => Number.parseInt(s.trim(), 10) - 1)
            .filter((i) => i >= 0 && i < skills.length),
        );
      },
    );
  });

const main = async () => {
  const skills = discoverSkills();
  const targetRoot = process.cwd();
  const args = process.argv.slice(2).map((a) => a.toLowerCase());

  console.log("Lyzr MCP — Claude skill installer\n");
  skills.forEach((s, i) => {
    console.log(
      `  ${i + 1}. ${s.id}${s.description ? ` — ${s.description}` : ""}`,
    );
  });

  let chosen;
  if (args.length > 0) {
    chosen = args.includes("all")
      ? skills
      : skills.filter((s) => args.includes(s.id.toLowerCase()));
    if (chosen.length === 0) {
      console.error(
        `\nNo matching skill for: ${args.join(", ")}. Available: ${skills.map((s) => s.id).join(", ")}`,
      );
      process.exitCode = 1;
      return;
    }
  } else if (!process.stdin.isTTY) {
    console.error(
      "\nNon-interactive shell with no skill names given — pass names or 'all', e.g.:",
    );
    console.error("  npx lyzr-mcp-skills all");
    console.error(`  npx lyzr-mcp-skills ${skills[0]?.id ?? "lyzr-agents"}`);
    process.exitCode = 1;
    return;
  } else {
    const indexes = await promptSelection(skills);
    if (indexes.length === 0) {
      console.log("\nNo skills selected — nothing installed.");
      return;
    }
    chosen = indexes.map((i) => skills[i]);
  }

  for (const skill of chosen) {
    install(skill, targetRoot);
    console.log(
      `  ✔ installed ${skill.id} → .claude/skills/${skill.id}/SKILL.md`,
    );
  }
  console.log(
    `\nDone. ${chosen.length} skill(s) installed into ${join(targetRoot, ".claude", "skills")}`,
  );
};

main();
