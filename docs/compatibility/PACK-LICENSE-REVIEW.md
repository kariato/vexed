# Additional level-pack license review

Review date: 2026-10-17. This records the evidence found and a content decision; it does not assert that missing permission means redistribution is forbidden.

## Subsequent content decision

The owner subsequently directed inclusion of all packs without an explicit reproduction restriction. [The implementation record](../development/ARCHIVED-PACKS.md) supersedes this review’s exclusion recommendations. The evidence and unresolved terms below remain unchanged.

## Result

The pinned release has 48 PDB packs and 2,878 puzzle entries (not a claim of unique puzzles). Classic accounts for 59. **Classic II adds 59 boards with explicit upstream GPL evidence. The other 46 packs contain 2,760 entries whose adaptation terms remain unresolved.** No runtime packs are added by this review.

The previous statement that only Classic had usable license evidence was incomplete. The [official release history](https://vexed.sourceforge.net/page7/page8/releasehistory.html), June 5, 2001 entry, expressly describes Steve Haynal's additional 59 levels as released under the GNU GPL. The [project history](https://vexed.sourceforge.net/page7/vexedproject.html) connects his levels to Vexed 1.4a. The pinned 2.2 readme identifies Classic II as that expansion, and its INI credits Steve Haynal. All 59 INI board strings match `vexgen/14a.txt` exactly in order. File hashes and per-pack decisions are in [pack-license-review.json](pack-license-review.json); the 14a comparison is corroboration within the same archive, not independent authentication of a 1.4a release.

**Decision:** Classic II board layouts are a supported next addition under the GPL, preserving Steve Haynal attribution and corresponding source. The web statement does not identify a GPL version; do not label the pack GPL-2.0-or-later solely on that statement. Resolve the chosen license expression against the applicable GPL text and any recovered 1.4a notice when packaging. Use numbered titles and newly derived solutions, as with Classic, because the evidence does not specifically trace later titles or encoded solutions. This review is not an implementation or deployment of that pack.

## Other packs: evidence and limits

All 46 remaining packs credit the Vexed Development Team. The original 2.2 source archive contains their PDBs; 17 also have INI inputs. None of the inspected pack-directory INI, TXT or BAT files has a copyright, license, GPL, public-domain or permission notice. All 67 fixture hashes were checked against the existing audit. These searches establish what was found in this archive, not what may exist elsewhere.

The game and Scott Ludwig's solver have GPL-2.0-or-later source headers. The readme, build scripts and official release history connect the new packs to the development team and generation tools. This is substantial contextual evidence of an open-source distribution. It does not establish that every independent data file has the same license, nor that a generator's license automatically licenses its output.

The [official FAQ](https://vexed.sourceforge.net/page3/page5/faq.html) encourages sharing the Palm program together with level packs. That supports ordinary redistribution of the original distribution, but does not expressly specify modification, conversion, or web redistribution terms. The [official pack page](https://vexed.sourceforge.net/page3/page6/levelpacks.html) is unfinished. Other ports' inclusion of these packs and project-level GPL labels are corroboration of practice, not a replacement for applicable permission.

**Decision:** keep these packs out of the runtime until an upstream statement covering the data, a historical submission policy, or confirmation from the relevant rights holders establishes scope. Do not describe them as prohibited or unlicensed as a fact. Generic attribution and newly generated solutions would not resolve permission for the board layouts themselves.

## Inventory

Counts are release PDB entries, not deduplicated puzzles. INI and PDB variants are linked with exact SHA-256 hashes in the JSON report; Classic II's known solution/par variant remains recorded in source-variants.json.

| Pack | Entries | Recorded author | Evidence status |
| --- | ---: | --- | --- |
| Children's Pack | 60 | Vexed Development Team | Terms unresolved |
| Classic II Levels | 59 | Steve Haynal | Explicit GPL evidence |
| Classic Levels | 59 | James A. McCombe | Existing scope |
| Confusion Pack | 60 | Vexed Development Team | Terms unresolved |
| Impossible Pack | 60 | Vexed Development Team | Terms unresolved |
| Panic Pack | 60 | Vexed Development Team | Terms unresolved |
| Twister Levels | 60 | Vexed Development Team | Terms unresolved |
| Variety 10 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 11 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 12 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 13 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 14 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 15 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 16 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 17 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 18 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 19 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 20 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 21 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 22 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 23 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 24 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 25 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 26 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 27 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 28 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 29 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 3 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 30 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 31 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 32 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 33 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 34 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 35 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 36 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 37 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 38 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 39 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 4 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 40 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 41 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 5 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 6 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 7 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 8 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety 9 Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety II Pack | 60 | Vexed Development Team | Terms unresolved |
| Variety Pack | 60 | Vexed Development Team | Terms unresolved |

## Follow-up needed to ship more content

1. Add Classic II through the normal conversion, engine replay, derived-solution, attribution and PWA asset pipeline; settle its GPL version expression while preparing the pack notice.
2. Recover the original 1.4a source notice for a stronger Classic II record and any explicit project-wide data/contribution terms for the remaining packs.
3. If those terms cannot be found, request confirmation through the original project's listed maintainers (SourceForge accounts `scottlu` and `ingebret`) covering the exact 46 named packs and their layouts, solutions and title lists separately. Ask which GPL version applies and whether contributors retained separate rights. No messages were sent as part of this review.
4. For a future title review, inspect the separate themed title lists rather than assuming the puzzle permission covers them. Original artwork and Palm binaries remain outside this review.

## Public research fixtures

The repository was made public at the user's request after the fixtures were committed. Those raw files and the normalized catalogue are already publicly accessible in Git; excluding them from the app and source-download archive does not make them private or resolve their distribution terms. The unresolved evidence applies to those copies too. This review neither expands permission nor removes files or rewrites repository history. Any remediation decision should account for the existing public copies, separately from enabling packs in the game.

## Verification

Verified all 67 INI/PDB fixture SHA-256 hashes against pack-audit.json, 48 PDB inventory entries totaling 2,878, and Classic II's exact 59-board comparison with the archived 14a list. Rechecked official release history, project history, FAQ and unfinished pack page. This documentation-only review does not change gameplay; engine/browser tests were not rerun.
