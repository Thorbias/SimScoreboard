# ADR-0006: Project name SimScoreboard

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Until now the project was called SimPaddock. The check before publication
(backlog 10) showed that the name cannot be kept:

- A commercial product in the same field (software for sim racing centers) already
  runs under the same name. `.com` and `.app` are taken.
- There has been a GitHub organization since 2018 and another repository with
  the name.

A name that already belongs to a product in the same market leads to confusion and
to a trademark risk that can hardly be fixed after publication. Right now the
renaming costs little because there are no users yet.

Requirements on the new name:

- Family with SimPosture: "Sim" plus a word.
- Describes what the app does: times and results as a simple overview, later league
  and cup.
- GitHub account free, no repositories of the same name with weight, `.com`, `.app`
  and `.dev` free, no hit in sim racing.

## Decision

The project is called **SimScoreboard**. The scoreboard shows times and results and
is at the same time the image for a league or cup table. The wordmark sets "Sim" in
text color and "Scoreboard" in italics in pit orange
([ADR-0005](ADR-0005-design-tokens-and-brand-accent.md)).

63 names in the style "Sim" plus a word were checked, each on GitHub (account and
repositories), by registry query for `.com`, `.app` and `.dev` and by web search for
sim racing products. SimScoreboard was one of the few names free on all points.

## Alternatives

- **SimTimesheet:** also completely free and the second choice; stresses the times,
  the league is less tangible.
- **SimOverview, SimAnalyzer, SimLogbook, SimDossier, SimExtract:** free or with a
  restriction, but each only one side of the app (overview, analysis, logbook,
  dossier, data extract).
- **SimCup and similar words:** SimCup is already a common name for championships in
  sim racing, the GitHub account and the domain are taken. As a function ("cup
  mode") the word remains conceivable.
- **Names with a taken `.com` address:** possible, because the app runs under a
  GitHub Pages address, but a worse starting image.
- **Names close to existing analysis tools** were rejected to avoid confusion.

## Consequences

- **Local data:** The index and the settings were in the IndexedDB `simpaddock` and
  in the `localStorage` key `simpaddock.theme`. On first start they are carried over
  to the new names (aliases, favorites, folder access, index, appearance) and the old
  entries are removed. If the new database is already filled or the browser cannot
  list databases, the migration is skipped; then the library is read anew.
- **Change of origin:** Storage applies per address. Whoever opens the site later
  under another domain starts empty and has to read the data anew.
- **Still open** is the trademark check (DPMA, EUIPO, USPTO), the registration of the
  domain and the renaming of the GitHub repository (backlog 10). A script cannot
  query the registers reliably; checking the availability of account, repositories
  and domains does not prove trademark freedom.
- **History:** Earlier commits and ADRs name the old name. They are not rewritten;
  the documents in the repository now carry the new name.
- **SimPosture:** Where the documentation of the sister project mentions the old
  name, it has to be updated there.
