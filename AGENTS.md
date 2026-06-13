# AGENTS.md

## 会話と作業ルール

- 常に日本語で会話する。
- 公開ページや運用手順を変更したら、このファイルと `README.md` を更新する。
- 変更後はテストを実行し、問題なければ commit する。
- GitHub上の `RukalunPage` リポジトリが作成済みで、認証が有効な環境では `main` へ push する。
- 機密情報や twitchRaid 側の `.env` 内容は commit しない。

## プロジェクト構成

- `index.html`: るっかるん Clip検索の公開ページ本体。`clip-search-data.json` を相対パスで読み込む。
  - 2026年デザイン刷新後は `data-design-version="2026-search-first"` を持つ。
  - 検索パネル、ヒーロー統計、条件チップ、結果カード、軽量サムネイル処理を単一HTML内で管理する。
  - LCP対象のヒーロー画像は `clip-search-hero.webp` を `preload` / `fetchpriority="high"` で優先し、PNGをフォールバックにする。
  - ヒーロー画像を差し替える場合は、WebPとPNGフォールバックをペアで更新する。
  - `clip-search-data.json` は初回描画後に `requestIdleCallback` で取得し、クリティカルチェーンに乗りにくくする。
  - 初期表示は24件ずつにして、Twitchサムネイルの初回リクエスト数を抑える。
  - サムネイルは `toLightThumbnailUrl()` で `-480x272` から `-320x180` へ寄せ、`loading="lazy"` / `decoding="async"` を使う。
  - 画像未読込時は `.thumbnail-loader`、失敗時はプレースホルダーを表示する。
  - データ取得失敗時は通知と失敗状態を表示し、検索0件の空状態とは混ぜない。
- `clip-search.html`: 互換リダイレクトページ。`?q=...` を維持してトップへ移動する。
- `clip-search-data.json`: twitchRaid Bot が `scripts/export-clip-search-data.mjs` で生成する公開Clipデータ。認証情報や内部DB状態は含めない。PageSpeed向けに公開時はminify済みの1行JSONにする。
- `.gitattributes`: `clip-search-data.json` を `linguist-generated=true -diff` にして、Botの同期時刻更新や整形戻りでGitHubの差分表示が膨らまないようにする。
- `sitemap.xml`: Search Console と検索エンジン向けのサイトマップ。canonical URL `https://www.rukalun.mydns.jp/` だけを掲載し、`noindex` の互換URL `clip-search.html` は含めない。
- `sitemap.txt`: Search Console のXML取得が不安定な場合に使うテキスト形式サイトマップ。canonical URL `https://www.rukalun.mydns.jp/` だけを1行で掲載する。
- `googled9f512eea3a99dc1.html`: Google Search Console のHTMLファイル所有権確認用ファイル。認証維持のためリポジトリ直下に残す。
- Google検索結果のサイト名とfaviconは hostname単位 で扱われるため、canonical / OGP / JSON-LD / favicon はカスタムドメイン `www.rukalun.mydns.jp` の絶対URLに揃える。
- `assets/rukalun/clip-search-hero.png`: Clip検索のヒーロー背景フォールバック。
- `assets/rukalun/clip-search-hero.webp`: Clip検索のヒーロー背景の軽量WebP版。PageSpeedのLCP画像発見性と総転送量対策で優先配信する。
- `assets/rukalun/clip-search-og.jpg`: OGP/Twitter Card 用画像。AI生成した背景とタイトル文字に、元の透過キャラ素材を後乗せし、軽量なJPGとして配信する。
- `assets/rukalun/clip-search-favicon.png` / `clip-search-favicon.ico` / `clip-search-apple-touch-icon.png`: faviconとホーム画面アイコン。
- `assets/rukalun/Hi-112px.png`: ブランドマークと一部ボタン小アイコン。
- `assets/rukalun/Hi-56px.webp`: ブランドマークと一部ボタン小アイコンの配信用軽量WebP。`Hi-112px.png` は元素材互換として残す。
- `assets/rukalun/present-56px.webp`: もっと見るボタン小アイコンの配信用軽量WebP。`プレゼント-112px.png` は元素材互換として残す。
- `assets/rukalun/bikkuri-56px.webp`: おまかせボタン小アイコンの配信用軽量WebP。`bikkuri-112px.png` は元素材互換として残す。
- `rukalun/`: ユーザー配置の作業用参考画像群。公開ページで直接読む軽量アセットは `assets/rukalun/` に置き、素材フォルダ全体は原則commit対象にしない。
- `.github/workflows/pages.yml`: リポジトリ直下をGitHub Pagesへ公開するworkflow。
- `tests/page.test.mjs`: 公開URL、OGP、必須アセット、互換リダイレクトを検証するNode.js標準テスト。
  - 2026年デザイン刷新後のDOM契約、軽量サムネイル契約も検証する。
  - SEO改善後は title / description / OGP / Twitter Card / JSON-LD `@graph` / Dataset / sitemap / Search Console 運用説明も検証する。
  - PageSpeed対応後はヒーローWebP/preload/high priority、公開JSONのminify、主要ボタンの色コントラストも検証する。

## SEO運用メモ

- 旧GitHub Pages project site の `https://jinwktk.github.io/RukalunPage/robots.txt` は、ホストルート `https://jinwktk.github.io/robots.txt` として扱われない。検索エンジン向けの成果前提にしない。
- サイトマップを検索エンジンへ明示したい場合は、Google Search Console の URL プレフィックスプロパティ `https://www.rukalun.mydns.jp/` で `https://www.rukalun.mydns.jp/sitemap.xml` を送信する。XML取得が不安定な場合は、同じプロパティに `sitemap.txt` を送信する。
- Search Console へのログイン、所有権確認の実行、サイトマップ送信は外部アカウント操作なので、Codex側の通常自動作業範囲外。
- HTMLファイル方式の所有権確認は、`googled9f512eea3a99dc1.html` を公開ルートへ置いて行う。Search Console 側で確認後も削除しない。
- `sitemap.xml` の `lastmod` は公開ページを更新した日付を `YYYY-MM-DD` で書く。`sitemap.txt` は canonical URL の1行だけにする。
- 検索結果のサイト名やfaviconを確実に独自表示に寄せるため、`www.rukalun.mydns.jp` のルートで構造化データとfaviconを配信する。
- GitHub Pages の画面で `rukalun.mydns.jp is improperly configured` が出る場合でも、`www.rukalun.mydns.jp` が primary として valid なら公開URLとしては成立している。`rukalun.mydns.jp` 直下も使う場合だけ、MyDNS 側で apex の A/AAAA レコードを追加する。

## 2026-06-12 作業ログ

- twitchRaid の `docs/clip-search.html` から公開ページ本体を分離し、このリポジトリの `index.html` として配置した。
- 公開URLを `https://jinwktk.github.io/RukalunPage/` に変更し、canonical / OGP / Twitter Card / JSON-LD / SearchAction のURLを新リポジトリ用に更新した。
- twitchRaid 側の既定公開先は、隣の `RukalunPage` リポジトリとその `clip-search-data.json` になった。別パス運用時だけ `.env` の `CLIP_SEARCH_PUBLISH_REPO_DIR` / `CLIP_SEARCH_DATA_PATH` で上書きする。
- `clip-search-data.json` と必要な `assets/rukalun` 軽量画像だけを配置した。
- `clip-search.html` は新リポジトリ内の互換リダイレクトとして残した。
- GitHub Pages workflow、README、AGENTS、Node.js標準テストを追加した。
- 最新Webデザイン刷新のため、検索ファーストUI、ヒーロー統計、常時アクセス可能な検索欄、条件チップ、低解像度サムネイル変換、CSSスピナーを追加した。
- 軽さを最優先するため、ヒーロー画像のpreloadを外し、画像は lazy/async と低解像度URLで扱う方針にした。
- レビュー指摘を受け、データ取得失敗時に0件メッセージを混ぜないようにし、検索欄の常時表示と軽量サムネイル契約のテストを強化した。
- 軽量表示とレイアウト安定性のため、文字サイズはviewport幅で直接スケールさせず、固定remとブレークポイントで調整する契約をテストに追加した。
- アーキテクチャレビュー指摘を受け、データ読み込み中に検索欄を操作してもスケルトンを消さず、`clip-search-data.json` は `no-store` にせずブラウザ標準キャッシュを使えるようにした。
- ユーザー確認を受け、重複していたJSON生成表示を外し、モバイルの閉じた検索パネルではキーワード欄も含めて畳むようにした。
- ユーザー確認を受け、結果下のステータス行を削除し、件数は上部条件チップ、Clip同期はヒーロー側だけに残した。検索を閉じるボタンはクリアの横へ移動し、作成者選択肢はClip数が多い順にした。
- ユーザー確認を受け、SPでは緑の条件チップを非表示にし、検索を閉じる `×` ボタンを操作列の右端へ寄せた。
- ClipカードにTwitch URLコピー用のアイコンボタンを追加し、Clipboard APIと `execCommand("copy")` フォールバックでコピーできるようにした。
- Twitch URLコピーは文字アイコンではなく、軽量なCSSの重なった四角アイコンで表示し、コピー成功時はチェック表示と小さな吹き出しを出すようにした。
- Clipカードの操作配置は、下段に塗り/未塗りで状態を示すハートのお気に入りトグル、動画アイコンのTwitchボタン、コピーアイコンを `20% / 60% / 20%` の淡い連結セグメントとして置く構成にした。
- ユーザー確認を受け、Clipカード操作セグメントの通常色を統一し、内部区切り線と薄い影で軽く見えるように調整した。
- ユーザー確認を受け、コピーアイコンだけ縮小していた指定を外し、操作セグメント内のアイコン高さが揃うようにした。
- ユーザー確認を受け、Clipカード操作セグメントにお気に入りは暖色、Twitchは淡い紫、コピーはミント系の背景色を付けた。
- ユーザー確認を受け、コピーアイコンの疑似要素を枠線込みサイズにして、下に飛び出して見えないようにした。
- ユーザー確認を受け、Clipカードのメタ情報は作成者が短い場合でもゲーム名の次行に出るようにした。
- 検索条件にゲームselectを追加し、作成者と同じくClip数が多い順の選択肢で絞り込めるようにした。
- ユーザー確認後にパフォーマンスチェック、テスト、コードレビューを実施し、問題なければreleaseとしてcommit/pushする指示を受けた。
- ユーザー確認を受け、ヒーローコピーを「おはるっか Clip回収所」「るっかと愉快な名場面、すぐ回収。」へ変更し、OGP/JSON-LD説明文も笑い声・絶叫・言質Clipの文脈へ寄せた。
- 新しいヒーローコピーがSP幅で横に抜けないよう、見出しとリード文に折り返し指定を追加し、リード文はSPだけ行単位で分割表示するようにした。
- ユーザー確認を受け、ヒーローのリード文から通信環境の現実的な説明を外し、「ふわっと」「おもちかえり」系のゆるふわ表現に変更した。
- ユーザー確認を受け、サイト名を `るっかるん Clip検索` から `🖇るっかるんくりっぷ🖇` に変更した。
- ユーザー確認を受け、ヒーロー上部の小ラベル「おはるっか Clip回収所」を削除し、見出しから始まる構成にした。
- ユーザー確認を受け、OGP/Twitter Card画像の左側余白に `るっかるん くりっぷ` のロゴ風文字と紙クリップ装飾を追加し、軽量化のためJPGへ切り替えた。
- ユーザー提供の `rukalun/kawaii.png` を参考に、OGP/Twitter Card画像のタイトル文字をピンク塗り・濃い輪郭・白いツヤ付きに寄せ、サイト本体も外部Webフォントなしのかわいい内蔵フォント優先スタックへ変更した。
- 作業用参考素材の `rukalun/` は大容量画像群を含むため、公開アセットとは分けて `.gitignore` に追加した。
- ユーザー確認を受け、OGP/Twitter Card画像はタイトル文字も含めてAI生成し、AI生成側の女の子は使わず、右側に `rukalun/キャラ.png` の元透過キャラ素材を後乗せする構成へ変更した。
- 検索流入改善のため、SEO契約テストを先行追加し、title / description / OGP / Twitter Card / JSON-LD `@graph` / Dataset / canonical-only sitemap / Search Console 運用説明を検証対象にした。
- GitHub Pages project site 配下の `robots.txt` はホストルートの robots として扱われないため、実装対象から外し、README/AGENTS の運用制約として記録する方針にした。
- `index.html` の title / meta description / OGP / Twitter Card を、Twitch Clip検索・タイトル/作成者/ゲーム名検索が伝わる自然文へ更新した。
- JSON-LD を `@graph` 構成にし、`WebSite`、`CollectionPage`、`Dataset`、`DataDownload` を分けて記述した。`Dataset.url` は説明ページとしてトップページを指し、`clip-search-data.json` は `DataDownload.contentUrl` にだけ置く。
- `Dataset.dateModified` は、Bot更新される `clip-search-data.json` とHTML固定日付がずれるため持たせない。ページ更新日は `CollectionPage.dateModified` と `sitemap.xml` の `lastmod` で扱う。
- ユーザー確認を受け、追加の `clipSearchOverview` セクションはUI上の説明過多になるため外し、既存ヒーローコピーと head / JSON-LD / sitemap でSEO信号を保つ方針にした。
- canonical URL のみを掲載する `sitemap.xml` を追加し、`clip-search.html` は `noindex` / canonical / redirect の互換ページとしてサイトマップから除外した。
- Googleが無視する `changefreq` / `priority` は `sitemap.xml` とテスト契約から外し、`loc` と `lastmod` を中心に検証する方針にした。
- ユーザー確認を受け、折り返し表示の条件チップは見た目が重いため廃止し、デスクトップ/タブレットでは短い件数ステータスだけを1行表示する構成へ調整した。詳細条件は検索パネル側に残し、テストにも短いチップ契約を追加した。
- Google Search Console のHTMLファイル所有権確認用に `googled9f512eea3a99dc1.html` を公開ルートへ追加し、README/AGENTS/テストに認証ファイル維持の契約を追加した。
- Search Console のXMLサイトマップ取得エラー回避用に、Google対応のテキスト形式サイトマップ `sitemap.txt` を追加し、README/AGENTS/テストに運用契約を追加した。
- Google検索結果のサイト名/favicon候補を補強するため、faviconリンクを絶対URL化し、`WebSite.alternateName` を追加した。あわせてGitHub Pages project siteでは検索結果のサイト名/faviconが hostname単位 の制約を受けることをREADME/AGENTSに記録した。

## 2026-06-13 作業ログ

- PageSpeed Insights desktop の共有レポート（2026-06-13 21:54:03作成）を確認し、Performance/Best Practices/SEOは100、Accessibilityは96で、対応可能な主指摘はLCP画像発見性、ネットワーク依存ツリー、主ボタンの色コントラストと判断した。
- LCP対象のヒーロー画像から `loading="lazy"` / `fetchpriority="low"` を外し、軽量な `clip-search-hero.webp` を追加して `preload` / `fetchpriority="high"` / `picture` で優先配信するようにした。
- `clip-search-data.json` の取得を `load` 後の `requestIdleCallback` に移し、初回描画のクリティカルチェーンから外れやすくした。
- 初期表示件数を48件から24件に減らし、Twitchサムネイルの初回リクエスト量を抑えた。
- 公開JSONをminify済みの1行JSONにして、ファイルサイズを約1.57MBから約1.34MBへ削減した。
- `#randomButton` で指摘された白文字とピンク背景のコントラスト不足を避けるため、主要ピンク色を `#c2487d` に濃くした。
- PageSpeed対応の契約として、ヒーローWebP/preload/high priority、JSON minify、load後データ取得、AA相当のボタン色コントラストを `tests/page.test.mjs` に追加した。
- コードレビュー指摘を受け、README冒頭の読み込み方針を「LCPヒーローだけ優先、サムネイル/JSONは後段」に修正し、初期24件と `requestIdleCallback` / `setTimeout` の具体契約をテストに追加した。
- 追加のPageSpeedレポート（2026-06-13 22:48:28作成）で全カテゴリ100点を確認し、残診断のうちローカルで対応可能な `Hi-112px.png` の過大配信を減らすため、ヘッダー/ボタン小アイコンを56px WebPへ差し替えた。GitHub Pagesの短いCache TTLとTwitch CDNサムネイルの画像形式は、このリポジトリ単体では直接制御しない。
- `origin/main` の `Clip検索JSONを同期時刻更新` を取り込んだ際、公開JSONが整形済みに戻っていたため、最新データ内容を保ったまま再度minifyして配信ペイロードを抑える状態に戻した。
- MyDNS の `www.rukalun.mydns.jp` が GitHub Pages primary domain として有効になり、HTTP/HTTPS で公開ページを取得できることを確認した。検索結果のサイト名/faviconを独自hostname側へ寄せるため、canonical / OGP / Twitter Card / JSON-LD / sitemap.xml / sitemap.txt / 互換リダイレクトのcanonicalを `https://www.rukalun.mydns.jp/` へ切り替えた。
- GitHub Pages画面の `rukalun.mydns.jp is improperly configured` は、wwwなしapexがGitHub Pagesに向いていない警告として扱う。公開URLは `www.rukalun.mydns.jp` をprimaryとし、wwwなしも使う場合だけMyDNSにapex A/AAAAを追加する。

## 2026-06-14 作業ログ

- `Clip検索JSONを同期時刻更新` コミットで `clip-search-data.json` が整形済みに戻ると巨大差分として見えるため、履歴を書き換えずに今後のレビュー表示を軽くする掃除を行った。
- `.gitattributes` を追加し、`clip-search-data.json` を `linguist-generated=true -diff` としてGitHub上では生成物扱い・非diff対象にした。
- `tests/page.test.mjs` に、公開JSONのminify維持に加えて `.gitattributes` の生成物/非diff契約を検証するテストを追加した。
- READMEに、公開JSONの同期時刻更新や整形戻りで差分表示を肥大化させない運用を追記した。
- push前に `origin/main` の最新 `Clip検索JSONを同期時刻更新` を取り込み、`total: 2752` の最新データ内容を保ったまま `clip-search-data.json` を再度minifyした。
