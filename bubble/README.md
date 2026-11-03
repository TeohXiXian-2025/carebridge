# Bubble build scripts

Helpers used to build the Bubble.io version of CareBridge from the same spec (`docs/SPEC.md`).
Each `p_*.js` file describes one Bubble page (elements + workflows) as Bubble editor clipboard data,
which is pasted into the Bubble editor. `dsl.js` holds the builders, `common.js` shared pieces.
