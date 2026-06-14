# RukalunPage

るっかるんの公開ページ用リポジトリです。現時点では Twitch Clip 検索ページを GitHub Pages のカスタムドメイン `https://www.rukalun.mydns.jp/` で公開します。

Clip検索ページは、軽量な静的HTML/CSS/JSだけで動作します。検索しやすい2026年寄りのデザインへ更新しつつ、LCP対象のヒーロー画像だけを優先し、サムネイルやClip JSON取得は後段に寄せて先に操作UIを表示します。

## 構成

- `index.html`: Clip検索ページ本体。`clip-search-data.json` を読み込み、ブラウザ内で検索・並び替え・お気に入り表示を行います。
- `clip-search.html`: 旧形式URL互換のリダイレクトページ。クエリ文字列を維持して `index.html` へ移動します。
- `clip-search-data.json`: twitchRaid Bot が生成・pushする公開Clipデータです。
- `sitemap.xml`: 検索エンジンと Search Console 向けに、canonical な公開URLだけを掲載するサイトマップです。
- `sitemap.txt`: Search Console で XML サイトマップ取得が不安定な場合に使うテキスト形式サイトマップです。canonical な公開URLだけを1行で掲載します。
- `googled9f512eea3a99dc1.html`: Google Search Console のHTMLファイル所有権確認用ファイルです。Search Console の認証維持に使うため削除しません。
- `assets/rukalun/`: Clip検索ページで使う軽量化済み画像、favicon、ボタン小アイコンです。検索結果向けfaviconは小さい表示枠でも絵柄が見えるよう、少しズームした版を使います。ページ上の小アイコンは56px WebPを使い、112px PNGは元素材互換として残します。
- `.gitattributes`: `clip-search-data.json` を生成物扱いにし、同期時刻更新や整形差分でGitHubの差分表示が膨らまないようにします。
- `.github/workflows/pages.yml`: GitHub Pages へこのリポジトリ直下を公開します。
- `tests/page.test.mjs`: Node.js 標準テストランナーで公開HTMLと必須ファイルを検証します。

## ページ仕様

- ファーストビューに総Clip数、表示件数、Clip同期日時を表示します。
- 表示上のサイト名は `🖇るっかるんくりっぷ🖇` とし、検索機能を保ちつつ柔らかい印象にします。
- ページ全体のフォントは外部Webフォントを読み込まず、OS内蔵の丸み・手書き寄りフォントを優先して軽く表示します。
- OGP/Twitter Card画像は、AI生成した背景とタイトル文字に、元の透過キャラ素材を後乗せして作成し、軽量なJPGで配信します。
- ヒーローコピーは「るっかと愉快な名場面、すぐ回収。」として、ふわっと探しておもちかえりできる配信Clipの空気に寄せます。
- モバイルでは検索パネル全体を折りたたみ、開いた時にキーワード、作成者、並び替え、操作ボタンを表示します。条件チップは出さず、閉じる `×` ボタンはクリアの横の右端に配置します。
- デスクトップ/タブレットの条件チップは、条件文を詰め込まず `2,750 clips` や `123 / 2,750 clips / 条件あり` の短い件数ステータスだけを表示します。詳細条件は検索パネル側に残します。
- 作成者とゲームの選択肢は、Clip数が多い順に表示します。
- Clipカードのメタ情報は、ゲーム名の次行に作成者名を表示してカード内の高さを揃えます。
- 各Clipカードでは、下段に塗り/未塗りで状態を示すハートのお気に入りトグル、動画アイコンのTwitchボタン、Twitch URLコピーアイコンを `20% / 60% / 20%` の淡い連結セグメントとして表示します。各ボタンは役割別に淡く色分けし、操作アイコンは高さを揃え、コピー後はチェック表示と小さな吹き出しで知らせます。
- Clipサムネイルは `-480x272` 形式のURLを可能な範囲で `-320x180` に変換し、`loading="lazy"` と `decoding="async"` で読み込みます。
- LCP対象になるヒーロー画像は WebP を優先配信し、`preload` と `fetchpriority="high"` で初期HTMLから発見できるようにします。PNGはフォールバックとして残します。
- ヒーロー画像を差し替える場合は、WebPとPNGフォールバックをペアで更新します。
- ヘッダーやボタンの小アイコンは56px WebP版を配信し、112px PNGを直接読まないようにします。
- データや画像の読み込み中は軽量なCSSスピナー/プレースホルダーを表示します。
- データ読み込み中に検索欄を操作しても、結果エリアは読み込み状態を維持します。
- `clip-search-data.json` はブラウザ標準のキャッシュ動作に任せ、再訪問時の余分な再取得を避けます。
- 初回描画のクリティカルチェーンを短くするため、`clip-search-data.json` は `load` 後に `requestIdleCallback` で取得します。公開JSONはネットワーク重量を抑えるためminify済みの1行JSONにします。
- 初期表示のClipカードは24件ずつ表示し、Twitchサムネイルの初回リクエスト数を抑えます。
- 画像読み込みに失敗した場合は、Clipタイトル付きの代替表示へ切り替えます。
- データ取得に失敗した場合は、0件検索とは別の失敗状態として通知します。
- 検索エンジン向けに、title / meta description / OGP / Twitter Card / JSON-LD をページ内容と揃えます。
- Google検索結果のサイト名候補は自動判定されるため、`WebSite.name` と `og:site_name` は絵文字なしの `るっかるんくりっぷ` にし、`alternateName` に `Rukalun Clip`、`るっかるん Clip検索`、`www.rukalun.mydns.jp` を入れます。表示上の装飾絵文字は title やページ本文側に残します。
- JSON-LD は `WebSite`、`CollectionPage`、`Dataset` を `@graph` で表現し、公開JSONデータの `DataDownload` 情報も含めます。
- `Dataset.url` はデータセットの説明ページとしてトップページを指し、JSON配布URLは `DataDownload.contentUrl` にだけ置きます。
- `Dataset` の `dateModified` は固定値で持たせません。`clip-search-data.json` はBotで別サイクル更新されるため、HTML側の固定日付とずれないようにします。
- `sitemap.xml` には `https://www.rukalun.mydns.jp/` のみを掲載し、`noindex` の互換リダイレクト `clip-search.html` は含めません。
- `sitemap.txt` にも canonical URL のみを掲載し、Search Console の回避用テキストサイトマップとして使えるようにします。
- Google検索結果のサイト名とfaviconは hostname単位 で扱われるため、canonical / OGP / JSON-LD / favicon はカスタムドメイン `www.rukalun.mydns.jp` の絶対URLに揃えます。
- 旧GitHub Pages project site の `https://jinwktk.github.io/RukalunPage/robots.txt` はホストルートの `robots.txt` として扱われないため、このリポジトリでは `robots.txt` をSEO成果の前提にしません。

## 検索エンジン向け運用

公開後は、Google Search Console に URL プレフィックスプロパティ `https://www.rukalun.mydns.jp/` を追加し、`https://www.rukalun.mydns.jp/sitemap.xml` を送信します。Search Console 側で XML の取得が不安定な場合は、同じプロパティに `sitemap.txt` を送信します。Search Console へのログインや所有権確認は外部アカウント操作になるため、このリポジトリの自動作業範囲には含めません。

Search Console のHTMLファイル認証は、`googled9f512eea3a99dc1.html` を GitHub Pages の公開ルートで配信して行います。認証後も所有権確認が継続できるよう、このファイルはリポジトリ直下に残します。

検索結果のサイト名やfaviconを独自表示に寄せるため、`www.rukalun.mydns.jp` のルートで `WebSite` 構造化データとfaviconを配信します。ただし、Google検索結果のサイト名とfaviconはGoogle側の再クロール/再処理後に自動選択されるため、指定が即時・必ず反映されるわけではありません。GitHub Pages の画面で `rukalun.mydns.jp is improperly configured` が出る場合でも、`www.rukalun.mydns.jp` が primary として valid なら公開URLとしては成立しています。`rukalun.mydns.jp` 直下も使う場合だけ、MyDNS 側で apex の A/AAAA レコードを追加します。

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

Bot の直近Clip同期完了後、`clip-search-data.json` に差分があればこのリポジトリの `main` へ commit/push します。PageSpeed向けに、公開前のJSONはminify済みの1行形式を維持します。`clip-search-data.json` は `.gitattributes` で生成物かつ非diff対象にしているため、同期時刻だけの更新や整形戻りでGitHub上の差分表示を肥大化させない運用にします。履歴整理を行う場合は、件名が `Clip検索JSONを同期時刻更新` のコミットだけを対象にし、公開ページの開発コミットは残します。

## 検証

```powershell
npm test
```

テストでは、PageSpeed Insightsで指摘されやすいLCP画像の優先読み込み、公開JSONのminify、主要ボタンの色コントラストも検証します。

GitHub Pages の公開URLは `https://www.rukalun.mydns.jp/` です。
