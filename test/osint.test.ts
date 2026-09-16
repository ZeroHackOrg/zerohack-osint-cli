import { describe, expect, it } from "vitest";
import {
  extractEmails,
  extractUrls,
  parseTarget,
  TLD_REGISTRY,
  whoisSummary,
} from "../src/osint.ts";

describe("parseTarget", () => {
  it("classifies http(s) URLs with domain and tld", () => {
    const t = parseTarget("https://example.com/path?q=1");
    expect(t.kind).toBe("url");
    expect(t.domain).toBe("example.com");
    expect(t.tld).toBe("com");
  });

  it("classifies plain domains", () => {
    const t = parseTarget("sub.example.co.uk");
    expect(t.kind).toBe("domain");
    expect(t.domain).toBe("sub.example.co.uk");
    expect(t.tld).toBe("uk");
  });

  it("classifies IPv4", () => {
    expect(parseTarget("1.2.3.4")).toEqual({ kind: "ipv4", ip: "1.2.3.4" });
  });

  it("classifies IPv6 (compressed and full)", () => {
    expect(parseTarget("::1")).toEqual({ kind: "ipv6", ip: "::1" });
    expect(parseTarget("2001:db8::1")).toEqual({ kind: "ipv6", ip: "2001:db8::1" });
  });

  it("classifies emails with extracted domain and tld", () => {
    const t = parseTarget("alice@example.com");
    expect(t.kind).toBe("email");
    expect(t.email).toBe("alice@example.com");
    expect(t.domain).toBe("example.com");
    expect(t.tld).toBe("com");
  });

  it("treats numeric dotted strings as unknown", () => {
    expect(parseTarget("192.168.1.300").kind).toBe("unknown");
  });

  it("treats junk and empty strings as unknown", () => {
    expect(parseTarget("not a target")).toEqual({ kind: "unknown" });
    expect(parseTarget("")).toEqual({ kind: "unknown" });
  });

  it("handles bracketed IPv6 URLs and malformed URLs without throwing", () => {
    expect(parseTarget("http://[::1]/").domain).toBe("::1");
    expect(parseTarget("http://:")).toEqual({ kind: "unknown" });
    expect(parseTarget("http://")).toEqual({ kind: "unknown" });
  });
});

describe("TLD_REGISTRY / whoisSummary", () => {
  it("contains ~30 real TLDs", () => {
    expect(Object.keys(TLD_REGISTRY).length).toBeGreaterThanOrEqual(30);
    expect(TLD_REGISTRY.com).toMatch(/VeriSign/i);
    expect(TLD_REGISTRY.io).toBeTruthy();
  });

  it("resolves registry hints for known TLDs", () => {
    const summary = whoisSummary("zero.example.com");
    expect(summary.tld).toBe("com");
    expect(summary.registryHint).toMatch(/VeriSign/i);
    expect(summary.note).toContain("Passive");
  });

  it("falls back to a hint for unknown TLDs", () => {
    const summary = whoisSummary("something.zzz");
    expect(summary.tld).toBe("zzz");
    expect(summary.registryHint).toContain("IANA");
  });

  it("handles TLD-less domains", () => {
    const summary = whoisSummary("localhost");
    expect(summary.tld).toBe("");
    expect(summary.registryHint).toContain("IANA");
  });
});

describe("extraction", () => {
  it("extracts unique emails, preserving order", () => {
    const text = "mail a@b.com now, also c@d.org and again a@b.com";
    expect(extractEmails(text)).toEqual(["a@b.com", "c@d.org"]);
  });

  it("returns [] when there are no emails", () => {
    expect(extractEmails("no addresses here")).toEqual([]);
  });

  it("extracts unique URLs and strips trailing punctuation", () => {
    const text =
      "see https://example.com/a, https://example.org/b. and https://example.com/a again!";
    expect(extractUrls(text)).toEqual(["https://example.com/a", "https://example.org/b"]);
  });

  it("dedupes case-insensitively-host mixed url list", () => {
    const text = "https://EXAMPLE.com/Path";
    expect(extractUrls(text)).toEqual(["https://EXAMPLE.com/Path"]);
  });
});