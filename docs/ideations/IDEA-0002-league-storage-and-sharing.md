# IDEA-0002 — League: storage location and sharing

> **Status:** rough. Idea of the developer (2026-11-01), belongs to the custom league
> ([IDEA-0001](IDEA-0001-custom-league.md)). The critical remarks below are material
> for discussion, not a decision.

## Idea

- **The site lives on GitHub Pages**, reachable for all users. The **league data does
  not lie there**, but at a storage location the league chooses. The default is
  **local**.
- **The repository is cloneable and self-hostable.** Whoever wants can run
  SimScoreboard on a server of their own, and the league data can lie there as well.
- **Sharing through cloud storage.** Google Drive, OneDrive and other providers can be
  connected as the storage location of the league data so that all players can access
  the same data.

## Storage locations (sketch)

The app talks to the storage through an exchangeable interface ("storage provider").
The league logic knows only this interface.

| Storage location | Thought |
|---|---|
| Local in the browser | default, nothing leaves the computer |
| Folder on the disk (File System Access API) | also a folder that a cloud client synchronizes |
| Own server | self-hosted, e.g. through WebDAV or a small data service |
| Cloud storage (Drive, OneDrive, others) | direct connection through sign-in in the browser |

## Critical remarks

1. **The privacy commitment and the CSP.** Today `connect-src 'self'` enforces
   (NF-001, [ADR-0005](../decisions/ADR-0005-design-tokens-and-brand-accent.md) names
   the technique) that the page sends no data to foreign addresses. A cloud connection
   breaks that for the provider's addresses. To clarify is how the commitment is kept:
   game files are never uploaded, only league data. One approach would be a **separate
   entry for the league mode** with its own, widened CSP; the rest of the app keeps
   `'self'`. The CSP applies per page, so that would be feasible.
2. **Sign-in without a backend.** Drive and OneDrive can be addressed in the browser
   through OAuth (with PKCE). For that the project needs a **registered client ID**
   per provider (public, without a secret), together with redirect addresses and,
   depending on the permission, a review by the provider. Whoever self-hosts enters
   their own client IDs. With narrowly drawn permissions (only own app files) the
   review stays easier.
3. **Several writers.** A shared overall file that everybody changes creates overwrite
   conflicts, and without a server there is no lock. More robust: **every person
   writes only their own files** (one result file per race, corrections as entries of
   their own), and the table is calculated on loading. Even simpler: **only the
   organizer writes**, the players read.
4. **Reading without an account.** Reading is often enough for players. Share links of
   Drive and OneDrive cannot, however, simply be read by `fetch` from a foreign page
   (CORS). That is to be checked before the decision; otherwise players would need a
   sign-in as well.
5. **The simplest first step.** The league data lies in a **folder on the disk** that a
   cloud client (Drive, OneDrive, Dropbox) synchronizes anyway. That covers all
   providers, needs no sign-in in the app and leaves the CSP untouched. Downsides:
   Chromium only, and every player needs the client and access to the folder. A direct
   connection would then be a comfort extension.
6. **Self-hosting and "no backend".** The app itself is static and can be hosted
   anywhere. A server that stores league data is, however, a backend and contradicts
   [PRODUCT.md](../PRODUCT.md) §5 (which applies to the first stage). One possibility
   is to use **WebDAV** as an existing, standardized interface (NAS, Nextcloud)
   instead of inventing one. The server must then allow CORS for the app.
7. **Personal data.** League data contains names of other drivers. When shared they
   end up in foreign clouds. A notice about who sees what is needed, and the
   possibility to remove data.
8. **The storage depends on the origin of the page.** Local data applies only to the
   address where it was created (GitHub Pages, own server, `localhost` are separate
   worlds). Whoever changes the site needs export and import.

## To clarify

- **Roles:** Organizer writes, players read? Or may everybody enter results?
- **Order:** First folder storage (remark 5), then WebDAV and cloud providers? Which
  providers first?
- **Format of the league data:** versioned, human-readable JSON so that self-hosters
  and tools can read it.
- **CSP in league mode** (remark 1) and what the commitment then promises exactly.
- **Document self-hosting:** static directory, optional data service, configuration of
  the client IDs.
- **Driver identity:** the assignment of names to persons from IDEA-0001 applies here
  as well.
