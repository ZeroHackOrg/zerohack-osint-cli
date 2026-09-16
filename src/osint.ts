/** Passive OSINT helpers: target parsing, TLD registry hints and entity
 *  extraction. Everything here is intentionally offline — no network calls,
 *  no whois lookups, deterministic output you can demo in a terminal. */

import { isIP } from "node:net";

/* ------------------------------ target parsing ------------------------- */

export type TargetKind = "url" | "domain" | "ipv4" | "ipv6" | "email" | "unknown";

export interface TargetInfo {
  kind: TargetKind;
  domain?: string;
  tld?: string;
  ip?: string;
  email?: string;
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const DOMAIN_RE =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;

export function tldOf(domain: string | undefined): string | undefined {
  if (!domain) return undefined;
  const labels = domain.split(".");
  return labels.length >= 2 ? labels[labels.length - 1] : undefined;
}

/** Classify a raw target string into a structured, deterministic shape.
 *  Order matters: IPs are tested first (node:net isIP), then URLs, then
 *  emails, then plain domains. */
export function parseTarget(raw: string): TargetInfo {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return { kind: "unknown" };

  const ip = isIP(s);
  if (ip === 4) return { kind: "ipv4", ip: s };
  if (ip === 6) return { kind: "ipv6", ip: s };

  if (SCHEME_RE.test(s)) {
    try {
      const u = new URL(s);
      if (!u.hostname) return { kind: "unknown" };
      const host = u.hostname.replace(/^\[|\]$/g, "");
      const hostIp = isIP(host);
      if (hostIp === 4) return { kind: "url", ip: host, domain: host };
      if (hostIp === 6) return { kind: "url", ip: host, domain: host };
      return { kind: "url", domain: host, tld: tldOf(host) };
    } catch {
      return { kind: "unknown" };
    }
  }

  if (EMAIL_RE.test(s)) {
    const [, domain] = s.split("@");
    return { kind: "email", email: s, domain, tld: tldOf(domain) };
  }

  if (DOMAIN_RE.test(s)) {
    return { kind: "domain", domain: s, tld: tldOf(s) };
  }

  return { kind: "unknown" };
}

/* ------------------------------ TLD registry --------------------------- */

/** ~30 real top-level domains mapped to their registry operator. Static and
 *  fully offline; useful for demos, not authoritative legal data. */
export const TLD_REGISTRY: Record<string, string> = {
  com: "VeriSign, Inc.",
  net: "VeriSign, Inc.",
  org: "Public Interest Registry (PIR)",
  info: "Identity Digital",
  biz: "Identity Digital",
  us: "Registry Services, LLC",
  io: "Internet Computer Bureau (Registry Services)",
  ai: "Government of Anguilla",
  dev: "Google LLC",
  app: "Google LLC",
  co: "CO Internet S.A.S",
  uk: "Nominet UK",
  de: "DENIC eG",
  fr: "AFNIC",
  jp: "Japan Registry Services (JPRS)",
  ru: "Coordination Center for TLD RU",
  cn: "CNNIC",
  au: "auDA",
  ca: "CIRA",
  in: "NIXI",
  me: "doMEn (Government of Montenegro)",
  sh: "Government of Saint Helena (NIC.SH)",
  gg: "Island Networks (Guernsey)",
  je: "Island Networks (Jersey)",
  to: "Government of Tonga (TONIC)",
  tv: "Tuvalu Telecommunications / GoDaddy Registry",
  cc: "VeriSign, Inc. (eNIC)",
  ly: "LYNIC (Libya)",
  ga: "GABON TELECOMS",
  ws: "Government of Samoa (Global Domains International)",
  vc: "KSregistry (Saint Vincent and the Grenadines)",
  xyz: "XYZ.com, LLC",
  tech: "Binky Moon, LLC (Donuts)",
  github: "GitHub, Inc.",
  im: "Isle of Man Registry (IOM)",
};

export const UNKNOWN_TLD_HINT =
  "Operator not in local registry — verify with the IANA root database / RDAP.";

export interface WhoisSummary {
  domain: string;
  tld: string;
  registryHint: string;
  note: string;
}

/** Passive, offline stand-in for a whois query. Resolves the TLD operator
 *  from the local registry table and explains that the lookup is local. */
export function whoisSummary(domain: string): WhoisSummary {
  const d = String(domain ?? "").trim().toLowerCase();
  const tld = tldOf(d) ?? "";
  const registryHint = tld ? (TLD_REGISTRY[tld] ?? UNKNOWN_TLD_HINT) : UNKNOWN_TLD_HINT;
  return {
    domain: d,
    tld,
    registryHint,
    note: `Passive lookup — no network contact. Run the system \`whois ${d}\` or query RDAP for authoritative registrant details.`,
  };
}

/* ------------------------------- extraction ---------------------------- */

const EMAIL_EXTRACT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL_EXTRACT_RE = /(?:https?|ftp):\/\/[^\s<>"')\]}\\]+/gi;

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

export function extractEmails(text: string): string[] {
  return dedupe(String(text ?? "").match(EMAIL_EXTRACT_RE) ?? []);
}

/** Extract URLs, stripping trailing punctuation that is not part of the URL
 *  (`.`, `,`, `;`, `:`, `!`, `?` stray closers) and de-duplicating. */
export function extractUrls(text: string): string[] {
  const raw = String(text ?? "").match(URL_EXTRACT_RE) ?? [];
  const cleaned = raw.map((u) => u.replace(/[.,;:!?]+$/, "").replace(/[)\]}>]+$/, ""));
  return dedupe(cleaned);
}