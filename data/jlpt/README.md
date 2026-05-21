# JLPT vocabulary data

This directory contains JLPT N5/N4 vocabulary candidate data used by the app.

## Sources

- Vocabulary source: [`elzup/jlpt-word-list`](https://github.com/elzup/jlpt-word-list), MIT License.
- That project notes its source chain as `chyyran/jlpt-anki-decks`, based on JLPT decks from tanos.co.uk and forked from `jamsinclair/open-anki-jlpt-decks`.
- Korean meanings are machine-translated from the English glosses during local data generation and lightly normalized by the app schema.

## Notes

- JLPT does not publish official vocabulary lists. These files should be treated as open-license JLPT candidate study data, not an official exam list.
- `romaji` values are generated from kana readings and stored in lowercase.
- `wordTtsText` and `exampleTtsText` intentionally contain Japanese reading text only.
- Vocabulary example sentences are generated locally from level-bounded study patterns and validated with `scripts/validate-jlpt-examples.mjs`.
- N5 examples use the app's N5 vocabulary plus basic particles, inflections, and grammar helpers. N4 examples may also use N5 vocabulary.
