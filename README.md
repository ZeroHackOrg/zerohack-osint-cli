<div align="center">

```
 ____________ _____   ____  _    _          _____ _  __
|___  /  ____|  __ \ / __ \| |  | |   /\   / ____| |/ /
   / /| |__  | |__) | |  | | |__| |  /  \ | |    | ' / 
  / / |  __| |  _  /| |  | |  __  | / /\ \| |    |  <  
 / /__| |____| | \ \| |__| | |  | |/ ____ \ |____| . \ 
/_____|______|_|  \_\____/|_|  |_/_/    \_\_____|_|\_\

              Fortifying the Digital Frontier
```

# @zerohack/osint-cli · `zh-osint`

**Passive-first OSINT helpers — target classification, emails, URLs, TLD hints**

[![License](https://img.shields.io/badge/license-Apache--2.0-00B0BD?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![Zero Budget](https://img.shields.io/badge/cost-%240-00b894?style=for-the-badge)](https://zerohack.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-00B0BD?style=for-the-badge)](CONTRIBUTING.md)

**Part of the [ZeroHack](https://zerohack.org) Geek Tools ecosystem**
Category: `recon` · `osint` · `recon` · `dns` · `passive`

</div>

---

> **⚡ Zero Budget. Zero Cloud Dependencies. Pure Local Power.**

---

## What It Does

Passive-first OSINT CLI: classifies targets by type, provides offline
TLD/registrar hints, and extracts emails and URLs from text. **No network
calls** — every command is deterministic and demoable in a terminal.

---

## Quick Start

```bash
# From the monorepo root
git clone https://github.com/ZeroHackOrg/zerohack-geek-tools.git
cd zerohack-geek-tools && npm install
npm run geek:osint -- parse 203.0.113.7
```

**Standalone:**

```bash
git clone https://github.com/ZeroHackOrg/zerohack-osint-cli.git
cd zerohack-osint-cli && npm install
npx tsx src/bin.ts parse https://example.com/secret
```

### Standalone Resolution

```bash
git clone https://github.com/ZeroHackOrg/zerohack-shared.git
cd zerohack-shared && npm install && npm link
cd ../zerohack-osint-cli && npm link @zerohack/shared
```

---

## Commands

| Command | Description |
|---|---|
| `zh-osint parse <target>` | Classify as `url` / `domain` / `ipv4` / `ipv6` / `email` / `unknown` |
| `zh-osint whois <domain>` | Offline stand-in; TLD operator hint from `TLD_REGISTRY` |
| `zh-osint emails <text...>` | Unique email addresses (order-preserving) |
| `zh-osint urls <text...>` | Unique URLs (trailing punctuation stripped) |

All commands accept `-j, --json` for machine-readable output.

**Examples:**

```bash
zh-osint parse 203.0.113.7           # → ipv4
zh-osint parse https://example.com/secret  # → url
zh-osint whois example.io            # → TLD: .io → .io domain registry
zh-osint emails "contact alice@zero.example.com or bob@example.net"
zh-osint urls "grab https://zero.example.com/a now"
```

---

## Design Notes

- **Passive by construction**: `parseTarget` uses URL parsing +
  `node:net.isIP` + regex; `whoisSummary` resolves from a built-in
  `TLD_REGISTRY` (~30 real TLDs) entirely in memory. No `whois(1)`,
  no RDAP, no sockets.
- **Deterministic ordering**: emails and URLs are de-duplicated preserving
  first-seen order.
- Input is always lowercased and trimmed; IPs are checked before URLs,
  then emails, then domains.

---

## Env

None — all tools are zero-dependency, zero-config, and run offline.

---

## Tests

```bash
npm run typecheck --workspace @zerohack/osint-cli
npm run test    --workspace @zerohack/osint-cli
```

---

## Architecture

```
zerohack-osint-cli/
├── src/
│   ├── bin.ts          # CLI entrypoint (commander)
│   ├── index.ts        # Re-exports
│   └── osint.ts        # parseTarget, whoisSummary, extractEmails, extractUrls
├── test/
│   └── osint.test.ts   # Unit tests (vitest)
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE             # Apache-2.0
├── SECURITY.md
├── CONTRIBUTING.md
└── CODE_OF_CONDUCT.md
```

**Design principles:**
- Pure functions: no randomness, no network, no I/O.
- Classification is order-independent (IPs before URLs before emails before domains).
- Zero runtime dependencies beyond `@zerohack/shared`.

---

## Security

Pure offline tool. Does not contact any external services. No data leaves
your machine.

For vulnerability reports, see [SECURITY.md](SECURITY.md).

---

## Related Packages

| Package | Binary | What It Does |
|---|---|---|
| [@zerohack/shared](../zerohack-shared) | — | Types, schemas, catalog |
| [@zerohack/cli](../zerohack-cli) | `zh` | Unified CLI |
| [@zerohack/recon-bot](../zerohack-recon-bot) | `zh-recon` | Passive recon (DNS, ports, HTTP) |
| [@zerohack/supalite-api](../zerohack-supalite-api) | `zh-api` | PostgREST API |
| [@zerohack/pal](../zerohack-pal) | `zh-pal` | Local AI assistant |
| [@zerohack/ssh-hardener](../zerohack-ssh-hardener) | `zh-ssh` | SSH auditor |
| [@zerohack/secret-scanner](../zerohack-secret-scanner) | `zh-secret` | Secret scanner |
| [@zerohack/honeypot](../zerohack-honeypot) | `zh-honeypot` | Honeypot |
| [@zerohack/log-analyzer](../zerohack-log-analyzer) | `zh-log` | Log forensics |
| [@zerohack/ctf-lab](../zerohack-ctf-lab) | `zh-lab` | CTF lab runner |
| [@zerohack/ctf-automation](../zerohack-ctf-automation) | `zh-ctf` | CTF solver |

---

## Community

- **Issues:** [GitHub Issues](https://github.com/ZeroHackOrg/zerohack-osint-cli/issues)
- **PRs:** [Pull Requests](https://github.com/ZeroHackOrg/zerohack-osint-cli/pulls)
- **Security:** [SECURITY.md](SECURITY.md)
- **Platform:** [zerohack.org](https://zerohack.org)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Read our [Code of Conduct](CODE_OF_CONDUCT.md) first.

## License

[Apache-2.0](LICENSE) — Copyright 2026 ZeroHack Security
