# Audit Plan

## Tool 1 - ui-ux-pro-max-skill

**Source:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

### Files/URLs to fetch and examine

1. **Repository root** - fetch the GitHub repo page to confirm it exists and identify the file tree
2. **README.md** - review all setup/install instructions, disclosed behaviour, and network calls
3. **package.json / composer.json / requirements.txt** - dependency manifests; check for unpinned deps, abandoned packages, known CVEs
4. **All shell scripts** (.sh, Makefile, install scripts) - look for arbitrary command execution, curl pipes to shell, filesystem writes outside project
5. **Source code making network calls** - search for fetch, curl, axios, http, file_get_contents, XMLHttpRequest, net.request, etc.
6. **Source code with filesystem access** - search for fs.write, fs.read, path traversal, access outside project directory
7. **Any obfuscated or minified files** - flag if present without explanation

### What to look for

- Hardcoded remote endpoints not disclosed in docs
- Credential capture/logging/transmission
- Obfuscated or minified source
- Unusual filesystem permission requests
- Unpinned dependencies with CVEs or abandoned maintainers
- Discrepancies between documentation claims and actual code behaviour

---

## Tool 2 - 21st.dev Magic MCP

**Source:** https://21st.dev/magic and linked documentation

### URLs to fetch and examine

1. **https://21st.dev/magic** - landing page, feature claims, data flow description
2. **Linked documentation/docs pages** - authentication mechanism, data retention policy, third-party service dependencies
3. **Terms of service / privacy policy** - data ownership clauses, rights to process code/data
4. **Source code repository** (if open source) - review for network calls, data exfiltration, credential handling
5. **NPM package** (if published) - review package contents, dependencies, install scripts

### What to look for

- What data the MCP server sends and receives
- Authentication mechanism and credential storage/transmission
- Data retention policy
- Third-party services it depends on or calls out to
- ToS clauses about data ownership or usage rights
- Whether source is open; if closed/obfuscated, automatic NEEDS REVIEW
- Discrepancies between documentation claims and actual behaviour
