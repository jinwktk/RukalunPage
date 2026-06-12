# RukalunPage

るっかるんの公開ページ用リポジトリです。現時点では Twitch Clip 検索ページを GitHub Pages で公開します。

## 構成

- `index.html`: Clip検索ページ本体。`clip-search-data.json` を読み込み、ブラウザ内で検索・並び替え・お気に入り表示を行います。
- `clip-search.html`: 旧形式URL互換のリダイレクトページ。クエリ文字列を維持して `index.html` へ移動します。
- `clip-search-data.json`: twitchRaid Bot が生成・pushする公開Clipデータです。
- `assets/rukalun/`: Clip検索ページで使う軽量化済み画像、favicon、ボタン小アイコンです。
- `.github/workflows/pages.yml`: GitHub Pages へこのリポジトリ直下を公開します。
- `tests/page.test.mjs`: Node.js 標準テストランナーで公開HTMLと必須ファイルを検証します。

## 更新方法

twitchRaid 側は未指定時でも、隣の `RukalunPage` リポジトリを公開先として扱います。別パスで運用する場合は `.env` で次のように明示します。

```env
CLIP_SEARCH_AUTO_PUBLISH_ENABLED=true
CLIP_SEARCH_PUBLISH_REPO_DIR=C:\Users\mlove\Documents\GitHub\RukalunPage
CLIP_SEARCH_DATA_PATH=C:\Users\mlove\Documents\GitHub\RukalunPage\clip-search-data.json
CLIP_SEARCH_PUBLISH_REMOTE=origin
CLIP_SEARCH_PUBLISH_BRANCH=main
```

Bot の直近Clip同期完了後、`clip-search-data.json` に差分があればこのリポジトリの `main` へ commit/push します。

## 検証

```powershell
npm test
```

GitHub Pages の公開URLは `https://jinwktk.github.io/RukalunPage/` です。
