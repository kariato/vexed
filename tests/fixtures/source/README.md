# Original pack research fixtures

These are byte-for-byte INI/PDB inputs from the pinned Palm Vexed 2.2 source archive.
Every file is checked against docs/compatibility/source-manifest.json.
They preserve contributor metadata and original solutions for compatibility research.
The repository is now public. These research fixtures are publicly accessible in Git; their presence does not establish permission to ship every pack in the game.
See docs/compatibility/PACK-LICENSE-REVIEW.md for the current evidence and scope.

Do not put this directory or the normalized reference catalogue in public or a
service-worker precache. Runtime JSON and solutions are generated separately under public/packs/.
The owner-directed archive inclusion and unresolved terms are recorded in
docs/development/ARCHIVED-PACKS.md and public/PACK_NOTICES.txt.

Raw file line endings must not be normalized. .gitattributes preserves the original
bytes. There are no host executables in this fixture directory.
