JLPT audio assets
=================

Kana audio files in `kana/` are used before Web Speech for fixed single-kana pronunciation.

Source:
- Wikimedia Commons, category `Audio files of hiragana (set by Hakatanoshio117117)`
- Example file: https://commons.wikimedia.org/wiki/File:Japanese_he.ogg

License:
- Public domain / PD-self as declared on the individual Wikimedia Commons file pages.

Notes:
- Hiragana and katakana share the same mora pronunciation, so files are keyed by romaji.
- `kana/manifest.json` lists the audio keys that are actually bundled in the app.
- The app does not fetch Wikimedia audio at runtime. If a requested `kana/{key}.ogg` file is not listed in the manifest, it falls back to the hardened Japanese Web Speech path exactly once.
