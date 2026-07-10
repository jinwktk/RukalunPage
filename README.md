# RukalunPage

るっかるんの公開ページ用リポジトリです。現時点では Twitch Clip・配信切り抜き検索ページを GitHub Pages のカスタムドメイン `https://www.rukalun.mydns.jp/` で公開します。

Clip検索ページは、軽量な静的HTML/CSS/JSだけで動作します。検索しやすい2026年寄りのデザインへ更新しつつ、LCP対象のヒーロー画像だけを優先し、サムネイルやClip JSON取得は後段に寄せて先に操作UIを表示します。

## 構成

- `index.html`: Clip検索ページ本体。`clip-search-data.json` を読み込み、ブラウザ内で検索・並び替え・お気に入り表示を行います。SEOキーワード拡張用の短い `keywordGuide`、Google Analytics 4 のGoogle tag、外部scriptを読み込まないKo-fi支援リンクもここで扱います。
- `shorts/index.html`: RukaShorts（るかしょーつ）の別ページです。TikTok / YouTube Shorts / Reels のように、PC/SPとも画面いっぱいのランダム縦送りClip視聴ページとして、activeな1件だけTwitch iframeを生成します。Topのファーストビューには `検索する / るかしょーつ / Twitchへ` の導線を置き、`るかしょーつ` は通常リンクで `./shorts/へ移動` します。`るかしょーつ` は赤ボタンに `bikkuri-56px.webp` スタンプ、`Twitchへ` は紫ボタンに `Hi-56px.webp` スタンプを添えます。検索パネルやClipカードからの導線は置かないため、カード操作は従来通り検索・Twitch・コピー中心です。初回表示時は `shorts-swipe-hint.png` の全画面案内を重ね、閉じたらlocalStorageに記録して同じブラウザでは次回以降は表示しません。全Clipから `crypto.getRandomValues()` でFisher-Yates shuffleし、同期順や先頭付近へ寄りにくいランダム順にします。初回案内を閉じるまではTwitch iframeを生成せず、閉じた後にactiveな1件だけ `autoplay=true` / `muted=false` で生成します。音付き自動再生はブラウザの自動再生ポリシーで止まる場合がありますが、ページ側では強制ミュートしません。Twitchプレイヤーはクリック可能にし、ミュート解除、音量変更、再生位置などのプレイヤー操作ができます。スクロール / スワイプ、Twitchの終了通知、終端付近の再生位置通知、または60秒フォールバックで次のClipへ自動スワイプします。プレイヤー操作で一時停止している間は60秒フォールバックを止めます。動画上に常時キューは置きません。検索SEO用のページではないため `noindex,follow` とし、サイトマップには含めません。
- `ruka-shorts.html`: 旧RukaShorts URL互換のリダイレクトページです。`noindex,follow` とし、クエリとハッシュを保ったまま `./shorts/` へ移動します。
- `clip-search.html`: 旧形式URL互換のリダイレクトページ。クエリ文字列を維持して `index.html` へ移動します。
- `jinnymeia/index.html`: GA4で確認した `/jinnymeia` への誤流入を、Ko-fi支援ページ `https://ko-fi.com/jinnymeia` へ逃がす互換リダイレクトです。検索用ページではないため `noindex,follow` とし、サイトマップには含めません。
- `clip-search-data.json`: twitchRaid Bot が生成・pushする公開Clipデータです。
- `sitemap.xml`: 検索エンジンと Search Console 向けに、canonical な公開URLだけを掲載するサイトマップです。
- `sitemap.txt`: Search Console で XML サイトマップ取得が不安定な場合に使うテキスト形式サイトマップです。canonical な公開URLだけを1行で掲載します。
- `googled9f512eea3a99dc1.html`: Google Search Console のHTMLファイル所有権確認用ファイルです。Search Console の認証維持に使うため削除しません。
- `assets/rukalun/`: Clip検索ページで使う軽量化済み画像、favicon、ボタン小アイコンです。検索結果向けfaviconは小さい表示枠でも絵柄が見えるよう、少しズームした版を使います。ページ上の小アイコンは56px WebPを使い、112px PNGは元素材互換として残します。`shorts-swipe-hint.png` はRukaShorts初回表示のスワイプ案内画像です。
- `.gitattributes`: `clip-search-data.json` を生成物扱いにし、同期時刻更新や整形差分でGitHubの差分表示が膨らまないようにします。
- `.github/workflows/pages.yml`: GitHub Pages へこのリポジトリ直下を公開します。
- `tests/page.test.mjs`: Node.js 標準テストランナーで公開HTML、RukaShorts、必須ファイルを検証します。

## ページ仕様

- ファーストビューに総Clip数、表示件数、Clip同期日時を表示します。
- 表示上のサイト名は `🖇るっかるんくりっぷ🖇` とし、検索機能を保ちつつ柔らかい印象にします。
- ページ全体のフォントは外部Webフォントを読み込まず、OS内蔵の丸み・手書き寄りフォントを優先して軽く表示します。
- OGP/Twitter Card画像は、AI生成した背景とタイトル文字に、元の透過キャラ素材を後乗せして作成し、軽量なJPGで配信します。
- ヒーローコピーは「るっかと愉快な名場面、すぐ回収。」として、ふわっと探しておもちかえりできる配信Clipの空気に寄せます。
- モバイルではヒーロー内の導線を検索1段・RukaShorts/Twitch 2列にしてファーストビューを短くし、検索パネル全体を折りたたみます。開いた時にキーワード、作成者、並び替え、操作ボタンを表示し、条件チップは出さず、閉じる `×` ボタンはクリアの横の右端に配置します。
- デスクトップ/タブレットの条件チップは、条件文を詰め込まず `2,750 clips` や `123 / 2,750 clips / 条件あり` の短い件数ステータスだけを表示します。詳細条件は検索パネル側に残します。
- 作成者とゲームの選択肢は、Clip数が多い順に表示します。特に候補数が多い作成者候補は操作時に初めて生成し、初回描画のDOM構築を軽くします。
- Clipカード内のゲーム名や作成者名をクリックすると、上部検索パネルのゲーム/作成者フィルタへ反映して絞り込めます。クリック時はキーワード、もう片方のフィルタ、並び替え条件を保持し、検索パネルを開いて現在条件を確認できるようにします。
- おまかせボタンは、手入力検索ではその条件内から抽選し、ランダムが自動入力したClipタイトルは次回クリック時の抽選条件として再利用しません。作成者・ゲーム・並び替え条件を変更してもランダム由来の出自は保持し、候補が複数ある場合は直前Clipをできるだけ避けます。連打できるよう、抽選後に結果エリアへ自動スクロールしません。
- RukaShorts（るかしょーつ）は `shorts/index.html` の別ページとして提供します。Topのファーストビューに `検索する / るかしょーつ / Twitchへ` の3ボタンを置き、`るかしょーつ` は通常リンクで `./shorts/へ移動` します。Top内iframeは使わず、検索パネルやClipカードからの導線も置かないため、Clipカードからの導線は置かない状態を保ちます。Top導線では、`るかしょーつ` は赤ボタンに `bikkuri-56px.webp`、`Twitchへ` は紫ボタンに `Hi-56px.webp` を横添えします。旧 `ruka-shorts.html` は互換リダイレクトとして残します。RukaShorts本体は全Clipを `crypto.getRandomValues()` ベースでFisher-Yates shuffleした視聴プールにします。PC/SPとも画面いっぱいで表示し、初期12件だけDOM生成して、スクロールが進んだら8件ずつ追加します。ページを開いた直後は `assets/rukalun/shorts-swipe-hint.png` の全画面案内を表示し、画面クリックで閉じます。閉じた後はlocalStorageに記録し、同じブラウザでは次回以降は表示しません。Twitchのautoplay visibility要件に触れないよう、初回案内を閉じるまではiframeを生成せず、閉じた後にactiveなClipだけTwitch iframeを生成し、`autoplay=true` / `muted=false` / `parent` を付けます。音付き自動再生はブラウザの自動再生ポリシーで止まる場合がありますが、ページ側では強制ミュートしません。Twitchプレイヤーはクリック可能にし、ミュート解除、音量変更、再生位置などのプレイヤー操作ができます。前のClipへ移る時はiframeを破棄し、スクロール / スワイプで次のClipへ進みます。動画上に常時キューは置きません。Twitch側から終了通知、または `currentTime` / `duration` などで終端付近と判断できる通知が来た場合は次へ自動スワイプします。Clip iframeは公式JavaScript Player API非対応のため、手動シーク終端時などにTwitch側から通知がまったく来ない場合は即時検知できず、Clip最大長に合わせた60秒フォールバックで次へ自動スワイプします。ただしプレイヤー操作で一時停止している間は、フォールバックを止めて勝手にスクロールしないようにします。
- Clipカードのメタ情報は、ゲーム名の次行に作成者名を表示してカード内の高さを揃えます。
- 各Clipカードでは、下段に塗り/未塗りで状態を示すハートのお気に入りトグル、動画アイコンのTwitchボタン、Twitch URLコピーアイコンを `20% / 60% / 20%` の淡い連結セグメントとして表示します。各ボタンは役割別に淡く色分けし、操作アイコンは高さを揃え、コピー後はチェック表示と小さな吹き出しで知らせます。
- PC版ではClipカードからモーダルウィンドウを開き、Twitch Clipをページ内で確認できます。SP版ではTwitchリンクとして開き、画面サイズと外部埋め込み負荷を避けます。中央操作とサムネイル画像は通常のリンクとして維持し、SP幅・修飾キー付きクリック・embed不可URLではブラウザ標準のリンク動作へ戻します。モーダル内のiframeはクリック時にだけ生成し、`autoplay=true` を指定します。ブラウザの自動再生ポリシーで音付き再生が止まる場合はあります。閉じるとiframeを破棄して再生と通信を止めます。モーダルはタイトルバーを持たず、グレーアウトした右上に大きな閉じるボタンを表示します。
- Clipサムネイルは `-480x272` 形式のURLを可能な範囲で `-320x180` に変換し、表示範囲へ近づいた時だけ実URLを設定します。`IntersectionObserver` 非対応時は即時読み込みへ戻し、`loading="lazy"`、`decoding="async"`、`width` / `height` も指定します。
- LCP対象になるヒーロー画像は WebP を優先配信し、`preload` と `fetchpriority="high"` で初期HTMLから発見できるようにします。PNGはフォールバックとして残します。
- ヒーロー画像を差し替える場合は、WebPとPNGフォールバックをペアで更新します。
- ヘッダーやボタンの小アイコンは56px WebP版を配信し、112px PNGを直接読まないようにします。
- データや画像の読み込み中は軽量なCSSスピナー/プレースホルダーを表示します。
- データ読み込み中に検索欄を操作しても、結果エリアは読み込み状態を維持します。
- `clip-search-data.json` はブラウザ標準のキャッシュ動作に任せ、再訪問時の余分な再取得を避けます。
- 初回描画のクリティカルチェーンを短くするため、`clip-search-data.json` は `load` 後に `requestIdleCallback` で取得します。公開JSONはネットワーク重量を抑えるためminify済みの1行JSONにします。
- 初期表示のClipカードは24件ずつ表示し、Twitchサムネイルの初回リクエスト数を抑えます。`もっと見る` も24件ずつ追加し、既存カードを再生成せず新しいカードだけを追記します。ページ下端までスクロールした場合はボタンを押した時と同じ追加表示処理を自動実行します。
- 画像読み込みに失敗した場合は、Clipタイトル付きの代替表示へ切り替えます。
- データ取得に失敗した場合は、0件検索とは別の失敗状態として通知します。
- 検索エンジン向けに、title / meta description / OGP / Twitter Card / JSON-LD をページ内容と揃えます。2026-06-21以降は `Twitch（ツイッチ）`、`Clip・クリップ`、`配信切り抜き`、ゲーム名、名場面系の語彙を、検索意図に合う短い導線で補強します。
- Google検索結果のサイト名候補は自動判定されるため、`WebSite.name` と `og:site_name` は絵文字なしの `るっかるんくりっぷ` にし、`alternateName` に `Rukalun Clip`、`るっかるん Clip検索`、`るっかるん Twitchクリップ`、`るっかるん 配信切り抜き`、`www.rukalun.mydns.jp` を入れます。表示上の装飾絵文字は title やページ本文側に残します。
- JSON-LD は `WebSite`、`CollectionPage`、`Dataset` を `@graph` で表現し、公開JSONデータの `DataDownload` 情報と実在する `creator` を含めます。配布ライセンスが宣言されていないため `license` は推測で追加しません。
- SEOキーワード拡張では、検索結果前の短い `keywordGuide` に説明文を置かず、検索結果が返る語彙だけを人気検索リンクとして置きます。デスクトップでは結果カードがファーストビューに入りやすいよう、虫眼鏡風アクセント付き見出しとチップ風リンクを2カラムのコンパクト表示にします。
- `keywordGuide` の人気検索リンクは `?q=` で検索パネルへ移動する補助導線です。サイトマップには追加せず、現行 `clip-search-data.json` で1件以上ヒットするクエリだけを置きます。`FFXIV` は表示ラベルとし、実検索クエリは `FINAL FANTASY XIV ONLINE` にします。`とぅいっち` や `顔アイコン` のようにGSCで見えた語彙でも、現行検索で0件のものは本文化せず、検索結果が返る語彙へ寄せます。
- `Dataset.url` はデータセットの説明ページとしてトップページを指し、JSON配布URLは `DataDownload.contentUrl` にだけ置きます。
- `Dataset` の `dateModified` は固定値で持たせません。`clip-search-data.json` はBotで別サイクル更新されるため、HTML側の固定日付とずれないようにします。
- `sitemap.xml` には `https://www.rukalun.mydns.jp/` のみを掲載し、`noindex` の互換リダイレクト `clip-search.html` / `ruka-shorts.html` / `/jinnymeia/` と `noindex,follow` の `shorts/index.html` は含めません。
- `sitemap.txt` にも canonical URL のみを掲載し、Search Console の回避用テキストサイトマップとして使えるようにします。
- Google検索結果のサイト名とfaviconは hostname単位 で扱われるため、canonical / OGP / JSON-LD / favicon はカスタムドメイン `www.rukalun.mydns.jp` の絶対URLに揃えます。
- 旧GitHub Pages project site の `https://jinwktk.github.io/RukalunPage/robots.txt` はホストルートの `robots.txt` として扱われないため、このリポジトリでは `robots.txt` をSEO成果の前提にしません。
- Google Analytics 4 は Measurement ID `G-TTVJN1V2LJ` のGoogle tagを `head` で非同期読み込みします。LCP対象のヒーロー画像preloadを先に発見できるよう、GAタグはヒーローpreloadより後、JSON-LDより前に置きます。検索条件の組み合わせは `clip_search`、Clip・主要導線・Ko-fiの選択は推奨イベント `select_content`、追加表示は `clip_load_more` で計測します。検索語そのものは送信しないため、イベントパラメータは検索有無、絞り込み種別、件数帯、操作元など低カーディナリティ値だけにします。
- Ko-fi支援導線は `jinnymeia` への通常リンクとローカルWebPだけで構成し、外部scriptを読み込まない文字なしの小型追尾表示にします。PC/SPとも右下に抑え、検索やClip操作を覆いにくくします。

## 検索エンジン向け運用

公開後は、Google Search Console に URL プレフィックスプロパティ `https://www.rukalun.mydns.jp/` を追加し、`https://www.rukalun.mydns.jp/sitemap.xml` を送信します。Search Console 側で XML の取得が不安定な場合は、同じプロパティに `sitemap.txt` を送信します。Search Console へのログインや所有権確認は外部アカウント操作になるため、このリポジトリの自動作業範囲には含めません。

Search Console のHTMLファイル認証は、`googled9f512eea3a99dc1.html` を GitHub Pages の公開ルートで配信して行います。認証後も所有権確認が継続できるよう、このファイルはリポジトリ直下に残します。

検索結果のサイト名やfaviconを独自表示に寄せるため、`www.rukalun.mydns.jp` のルートで `WebSite` 構造化データとfaviconを配信します。ただし、Google検索結果のサイト名とfaviconはGoogle側の再クロール/再処理後に自動選択されるため、指定が即時・必ず反映されるわけではありません。GitHub Pages の画面で `rukalun.mydns.jp is improperly configured` が出る場合でも、`www.rukalun.mydns.jp` が primary として valid なら公開URLとしては成立しています。`rukalun.mydns.jp` 直下も使う場合だけ、MyDNS 側で apex の A/AAAA レコードを追加します。

`sitemap.xml` の `lastmod` は公開ページを更新した日付（`YYYY-MM-DD`）に合わせます。`sitemap.txt` は canonical URL の1行だけにします。`clip-search.html` は互換用の即時リダイレクトで `noindex,follow` のまま維持します。

SEOキーワード拡張は、Googleが使わない `meta keywords` ではなく、ユーザーにも見える人気検索リンク、JSON-LD `keywords` / `about` の整合で管理します。検索順位はGoogle側の再クロール・再処理と外部要因に依存するため保証しません。公開後は Search Console の検索パフォーマンスで、表示回数が増えた語彙を確認して次回の追加候補にします。

人気検索リンクは `?q=` を使うため、Search Console のページ一覧やインデックス状況で `?q= URL` が大量に検出されていないかを確認します。増えすぎる場合は、人気検索リンク数を減らすか、検索導線をクロールされにくい形へ戻すことを検討します。`sitemap.xml` と `sitemap.txt` は引き続き canonical URL だけを掲載します。

GSC/GA4の確認では、GSCプロパティ `sc-domain:rukalun.mydns.jp` と GA4 property `541705085` を使います。2026-07-10のMCP再確認では、直近30日相当のトップページはデスクトップ42セッション・平均エンゲージメント約335秒に対し、モバイル16セッション・約31秒でした。GSCの2026-06-08〜07-07はトップページ7クリック・158表示・平均掲載順位6.47で、主なクエリ `るっかるん` は4クリック・42表示でした。現行検索で0件の語彙は説明文として足さず、検索結果が返る語彙のリンク、モバイルのファーストビュー、検索操作の計測を優先します。`/jinnymeia/` は引き続きKo-fiへの `noindex,follow` リダイレクトとして受け止めます。

## アクセス解析運用

Google Analytics 4 の Measurement ID `G-TTVJN1V2LJ` は公開HTMLに含める公開識別子として扱います。自動 `page_view` は無効にし、クエリとハッシュを除いた `origin + pathname` を `page_location` に使う手動 `page_view` を送ります。`page_referrer` も同じ規則で匿名化し、GA4の拡張計測が `?q=` を `search_term` として収集する経路を避けます。ページ側では `clip_search`、`select_content`、`clip_load_more` を失敗してもUIを止めない形で送り、検索語そのものは送信しません。タイトル、作成者名、入力値などの高カーディナリティ値や個人情報になり得る文字列をイベントパラメータへ入れず、検索データの読み込み中はイベントを保留して、読込完了後の件数帯で送ります。検索語・選択中の作成者・ゲームは、別条件を同じイベントとして落とさないためのブラウザ内重複判定にだけ使い、GA4へ渡しません。`filter_type`、`result_bucket`、`source` などをGA4レポートで直接使う場合は、管理画面側で同名のイベントスコープのカスタムディメンション登録が必要です。GA管理画面での登録、権限管理、リアルタイム計測確認は外部アカウント操作のため、このリポジトリの自動作業範囲には含めません。

## 支援導線運用

Ko-fi の小型リンクはアカウント `jinnymeia` へ誘導する公開支援導線です。Ko-fi側のプロフィール、決済、表示名、入金確認などの外部アカウント操作は、このリポジトリの自動作業範囲には含めません。ページ側では公式overlayを使わず、ローカルの `present-56px.webp` を使う通常リンクにして外部scriptを読み込まないため、第三者JavaScript・iframe・外部フォントを初期表示へ追加しません。PC/SPとも文字なしの `56px x 56px` 追尾表示とし、クリックは `select_content` の低カーディナリティ値で計測します。`https://www.rukalun.mydns.jp/jinnymeia/` はKo-fi直行の互換リダイレクトとして残し、GA4で見える誤流入を404にしません。

## 2026-07-10 改善結果

- AnalyticsMCP、Search Console MCP、公式PageSpeed Insights、公開ページのPC/SP実画面を基準に改善しました。PageSpeedの改善前基準はモバイル Performance 87 / LCP 3.7秒、デスクトップ Performance 91 / LCP 0.7秒です。
- モバイルは主要CTAを1+2列にして、390 x 844の確認画面で検索トグルと人気キーワードまで初期viewportへ入りやすくしました。既存の配色・画像・文言は維持し、カードと状態パネルの角丸階層だけを整理しています。
- ローカル実画面では初期24カードのうちサムネイル実URL設定は3件、残り21件は表示範囲待ちでした。作成者selectは初期1 optionから操作時765 optionsへ展開し、`もっと見る` は24件から48件へ既存カードを全再生成せず追記しました。
- Ko-fiの外部JavaScript・iframeは0件になり、ブラウザconsoleのerror / warningは0件でした。GAタグが追跡防止などで使えない場合も、検索・絞り込み・追加表示は継続します。
- 公開後の[PageSpeed Insights](https://pagespeed.web.dev/analysis/https-www-rukalun-mydns-jp/4kohyh7muv)は、モバイル Performance 88 / Accessibility 100 / Best Practices 100 / SEO 100（FCP 0.9秒、LCP 3.7秒、TBT 140ms、CLS 0）、デスクトップ 99 / 100 / 100 / 100（FCP 0.3秒、LCP 0.7秒、TBT 80ms、CLS 0）でした。改善前比はモバイルPerformance +1、デスクトップ +8で、デスクトップTBTは240msから80msへ減りました。
- 公開HTML、1行JSON、PC/SP検索、自動追加表示、consoleを実URLで再確認しました。Search ConsoleのURL検査はindex / canonical / mobile crawlともPASSです。HTTPSサイトマップのMCP送信は所有者表示の接続でも `403 Insufficient Permission` となったため、既存HTTPサイトマップを残し、書き込み権限のあるSearch Console接続での再送信を運用課題とします。

## 更新方法

twitchRaid 側は未指定時でも、隣の `RukalunPage` リポジトリを公開先として扱います。別パスで運用する場合は `.env` で次のように明示します。

```env
CLIP_SEARCH_AUTO_PUBLISH_ENABLED=true
CLIP_SEARCH_PUBLISH_REPO_DIR=C:\Users\mlove\Documents\GitHub\RukalunPage
CLIP_SEARCH_DATA_PATH=C:\Users\mlove\Documents\GitHub\RukalunPage\clip-search-data.json
CLIP_SEARCH_PUBLISH_REMOTE=origin
CLIP_SEARCH_PUBLISH_BRANCH=main
```

Bot の直近Clip同期完了後、`clip-search-data.json` に差分があればこのリポジトリの `main` へ commit/push します。Botが読みやすい複数行JSONをcommitしても、GitHub Pagesはartifact作成前に `npm run minify:data` で最新データを1行化し、その状態で `npm test` を通してから公開します。これにより、Botの同期形式と公開時のネットワーク重量を分離します。`clip-search-data.json` は `.gitattributes` で生成物かつ非diff対象にしているため、同期時刻だけの更新や整形戻りでGitHub上の差分表示を肥大化させない運用にします。履歴整理を行う場合は、件名が `Clip検索JSONを同期時刻更新` のコミットだけを対象にし、公開ページの開発コミットは残します。

手元で公開artifact相当の状態を確認する場合は、`npm run minify:data` の後に `npm test` を実行します。`npm run minify:data -- <JSONパス>` の代わりに、スクリプトへ任意パスを直接渡して一時ファイルの正規化も検証できます。通常運用では既定の `clip-search-data.json` だけを対象にします。

## 検証

```powershell
npm run minify:data
npm test
```

テストでは、PageSpeed Insightsで指摘されやすいLCP画像の優先読み込み、公開JSONのminify、主要ボタンの色コントラスト、Google Analytics 4 タグと低カーディナリティイベント、静的Ko-fiリンク、Dataset `creator`、作成者候補の操作時生成、サムネイルの表示範囲連動読み込み、既存カードを再生成しない追加表示、SEOキーワード拡張の人気検索リンク・JSON-LD語彙、Clip検索のページ下端スクロールによる自動 `もっと見る`、PC版Clipモーダルの遅延iframe生成とSP版Twitchリンク維持、RukaShorts（るかしょーつ）のTopファーストビュー導線、`./shorts/へ移動` する通常リンク、`ruka-shorts.html` の互換リダイレクト、検索パネル/Clipカード導線なし、PC/SPとも画面いっぱい、初回スワイプ案内、初回案内中のiframe生成保留、初期12件の段階描画、縦スクロール、常時キューなし、`muted=false`付き遅延iframe生成、音付き自動再生のブラウザポリシー注記、Twitchプレイヤーの音量変更を含むプレイヤー操作、Twitch終了通知、`currentTime` / `duration` による終端付近通知、60秒フォールバック、一時停止中のフォールバック停止も検証します。

GitHub Pages の公開URLは `https://www.rukalun.mydns.jp/` です。

`AGENTS.md` はローカル運用メモとしてGitIgnoreを維持します。公開CIでは追跡済みの `README.md` をドキュメント契約として検証し、ローカルでは `AGENTS.md` が存在する場合に同じ契約も確認します。
