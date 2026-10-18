# Original pack research fixtures

These are byte-for-byte INI/PDB inputs from the pinned Palm Vexed 2.2 source archive.
Every file is checked against docs/compatibility/source-manifest.json.
They preserve contributor metadata and original solutions for compatibility research.
The repository is now public. These research fixtures are publicly accessible in Git; their presence does not establish permission to ship every pack in the game.
See docs/compatibility/PACK-LICENSE-REVIEW.md for the current evidence and scope.

Do not put this directory or the normalized reference catalogue in public or a
service-worker precache. The distributable runtime content is generated separately
at public/packs/classic.json under the scoped Classic layout policy.

Raw file line endings must not be normalized. .gitattributes preserves the original
bytes. There are no host executables in this fixture directory.
