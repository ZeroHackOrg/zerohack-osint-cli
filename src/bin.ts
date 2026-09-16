#!/usr/bin/env node
/** zh-osint — passive-first OSINT CLI: target classification, offline TLD
 *  hints, and email/URL extraction. Never touches the network. */

import { Command } from "commander";
import { table, truncate } from "@zerohack/shared";
import { extractEmails, extractUrls, parseTarget, whoisSummary } from "./osint.ts";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const program = new Command();
program
  .name("zh-osint")
  .description("Passive OSINT CLI: classify targets, offline TLD/registrar hints, email and URL extraction.")
  .version("0.1.0", "-v, --version")
  .showHelpAfterError();

program
  .command("parse <target>")
  .description("Classify a target as url, domain, ipv4, ipv6 or email.")
  .option("-j, --json", "emit raw JSON")
  .action((target: string, opts: { json?: boolean }) => {
    const info = parseTarget(target);
    if (opts.json) return console.log(JSON.stringify(info, null, 2));
    console.log(table({
      headers: ["KIND", "DOMAIN", "TLD", "IP", "EMAIL"],
      rows: [[info.kind, info.domain ?? "—", info.tld ?? "—", info.ip ?? "—", info.email ?? "—"]],
    }));
  });

program
  .command("whois <domain>")
  .description("Offline whois stand-in: TLD operator hint from the local registry.")
  .option("-j, --json", "emit raw JSON")
  .action((domain: string, opts: { json?: boolean }) => {
    const summary = whoisSummary(domain);
    if (opts.json) return console.log(JSON.stringify(summary, null, 2));
    console.log(table({
      headers: ["DOMAIN", "TLD", "REGISTRY HINT"],
      rows: [[summary.domain, summary.tld || "—", summary.registryHint]],
    }));
    console.log(`  ${truncate(summary.note, 120)}`);
  });

program
  .command("emails <text...>")
  .description("Extract unique email addresses from the given text.")
  .option("-j, --json", "emit raw JSON")
  .action((text: string[], opts: { json?: boolean }) => {
    const emails = extractEmails(text.join(" "));
    if (opts.json) return console.log(JSON.stringify(emails, null, 2));
    if (emails.length === 0) return console.log("No email addresses found.");
    emails.forEach((e) => console.log(e));
    console.log(`${emails.length} unique address(es).`);
  });

program
  .command("urls <text...>")
  .description("Extract unique URLs from the given text.")
  .option("-j, --json", "emit raw JSON")
  .action((text: string[], opts: { json?: boolean }) => {
    const urls = extractUrls(text.join(" "));
    if (opts.json) return console.log(JSON.stringify(urls, null, 2));
    if (urls.length === 0) return console.log("No URLs found.");
    urls.forEach((u) => console.log(u));
    console.log(`${urls.length} unique URL(s).`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(`zh-osint: ${errorMessage(err)}`);
  process.exit(1);
});