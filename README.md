# RukalunPage

るっかるんの公開ページ用リポジトリです。現時点では Twitch Clip 検索ページを GitHub Pages で公開します。

Clip検索ページは、軽量な静的HTML/CSS/JSだけで動作します。検索しやすい2026年寄りのデザインへ更新しつつ、通信環境が悪い場合でも先に操作UIを表示できるよう、画像の優先読み込みを抑えています。

## 構成

- `index.html`: Clip検索ページ本体。`clip-search-data.json` を読み込み、ブラウザ内で検索・並び替え・お気に入り表示を行います。
- `clip-search.html`: 旧形式URL互換のリダイレクトページ。クエリ文字列を維持して `index.html` へ移動します。
- `clip-search-data.json`: twitchRaid Bot が生成・pushする公開Clipデータです。
- `sitemap.xml`: 検索エンジンと Search Console 向けに、canonical な公開URLだけを掲載するサイトマップです。
- `sitemap.txt`: Search Console で XML サイトマップ取得が不安定な場合に使うテキスト形式サイトマップです。canonical な公開URLだけを1行で掲載します。
- `googled9f512eea3a99dc1.html`: Google Search Console のHTMLファイル所有権確認用ファイルです。Search Console の認証維持に使うため削除しません。
- `assets/rukalun/`: Clip検索ページで使う軽量化済み画像、favicon、ボタン小アイコンです。
- `.github/workflows/pages.yml`: GitHub Pages へこのリポジトリ直下を公開します。
- `tests/page.test.mjs`: Node.js 標準テストランナーで公開HTMLと必須ファイルを検証します。

## ページ仕様

- ファーストビューに総Clip数、表示件数、Clip同期日時を表示します。
- サイト名は `🖇るっかるんくりっぷ🖇` とし、検索機能を保ちつつ柔らかい印象にします。
- ページ全体のフォントは外部Webフォントを読み込まず、OS内蔵の丸み・手書き寄りフォントを優先して軽く表示します。
- OGP/Twitter Card画像は、AI生成した背景とタイトル文字に、元の透過キャラ素材を後乗せして作成し、軽量なJPGで配信します。
- ヒーローコピーは「るっかと愉快な名場面、すぐ回収。」として、ふわっと探しておもちかえりできる配信Clipの空気に寄せます。
- モバイルでは検索パネル全体を折りたたみ、開いた時にキーワード、作成者、並び替え、操作ボタンを表示します。条件チップは出さず、閉じる `×` ボタンはクリアの横の右端に配置します。
- デスクトップ/タブレットの条件チップは、条件文を詰め込まず `2,750 clips` や `123 / 2,750 clips / 条件あり` の短い件数ステータスだけを表示します。詳細条件は検索パネル側に残します。
- 作成者とゲームの選択肢は、Clip数が多い順に表示します。
- Clipカードのメタ情報は、ゲーム名の次行に作成者名を表示してカード内の高さを揃えます。
- 各Clipカードでは、下段に塗り/未塗りで状態を示すハートのお気に入りトグル、動画アイコンのTwitchボタン、Twitch URLコピーアイコンを `20% / 60% / 20%` の淡い連結セグメントとして表示します。各ボタンは役割別に淡く色分けし、操作アイコンは高さを揃え、コピー後はチェック表示と小さな吹き出しで知らせます。
- Clipサムネイルは `-480x272` 形式のURLを可能な範囲で `-320x180` に変換し、`loading="lazy"` と `decoding="async"` で読み込みます。
- データや画像の読み込み中は軽量なCSSスピナー/プレースホルダーを表示します。
- データ読み込み中に検索欄を操作しても、結果エリアは読み込み状態を維持します。
- `clip-search-data.json` はブラウザ標準のキャッシュ動作に任せ、再訪問時の余分な再取得を避けます。
- 画像読み込みに失敗した場合は、Clipタイトル付きの代替表示へ切り替えます。
- データ取得に失敗した場合は、0件検索とは別の失敗状態として通知します。
- 検索エンジン向けに、title / meta description / OGP / Twitter Card / JSON-LD をページ内容と揃えます。
- JSON-LD は `WebSite`、`CollectionPage`、`Dataset` を `@graph` で表現し、公開JSONデータの `DataDownload` 情報も含めます。
- `Dataset.url` はデータセットの説明ページとしてトップページを指し、JSON配布URLは `DataDownload.contentUrl` にだけ置きます。
- `Dataset` の `dateModified` は固定値で持たせません。`clip-search-data.json` はBotで別サイクル更新されるため、HTML側の固定日付とずれないようにします。
- `sitemap.xml` には `https://jinwktk.github.io/RukalunPage/` のみを掲載し、`noindex` の互換リダイレクト `clip-search.html` は含めません。
- `sitemap.txt` にも canonical URL のみを掲載し、Search Console の回避用テキストサイトマップとして使えるようにします。
- Google検索結果のサイト名とfaviconは hostname単位 で扱われるため、`jinwktk.github.io/RukalunPage/` のようなGitHub Pages project siteでは、`github.io` 側の表示に引っ張られる場合があります。リポジトリ側では `WebSite.alternateName` と絶対URLのfavicon指定で候補情報を補強します。
- GitHub Pages project site では `https://jinwktk.github.io/RukalunPage/robots.txt` がホストルートの `robots.txt` として扱われないため、このリポジトリでは `robots.txt` をSEO成果の前提にしません。

## 検索エンジン向け運用

公開後は、Google Search Console で `https://jinwktk.github.io/RukalunPage/sitemap.xml` を送信すると、サイトマップを明示できます。Search Console 側で XML の取得が不安定な場合は、同じプロパティに `sitemap.txt` を送信します。Search Console へのログインや所有権確認は外部アカウント操作になるため、このリポジトリの自動作業範囲には含めません。

Search Console のHTMLファイル認証は、`googled9f512eea3a99dc1.html` を GitHub Pages の公開ルートで配信して行います。認証後も所有権確認が継続できるよう、このファイルはリポジトリ直下に残します。

検索結果のサイト名やfaviconを確実に独自表示にしたい場合は、独自ドメインを設定し、そのhostnameのルートで `WebSite` 構造化データとfaviconを配信する運用に切り替えます。

`sitemap.xml` の `lastmod` は公開ページを更新した日付（`YYYY-MM-DD`）に合わせます。`sitemap.txt` は canonical URL の1行だけにします。`clip-search.html` は互換用の即時リダイレクトで `noindex,follow` のまま維持します。

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
