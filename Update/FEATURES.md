# 機能別の変更箇所

## 依存関係

野埼タイマーの計算モデルは独立して利用できますが、YPSへの接続はdevtools.js・content.js・manifest.jsonなどの共有ファイルにあります。戦果メモとコンパス任務同期も連携しています。ファイルを削るだけで機能を無効化せず、以下の接続をまとめて扱います。

| 機能 | 実装と入口 | 接続・条件 | 検証 |
|---|---|---|---|
| 野埼タイマー計算 | nozaki.js: Timer.formation / Timer.port / Timer.view / estimate | 通常編成成功・母港受信の前後スナップショット、燃料・補給・入渠・cond | test/nozaki-test.cjs |
| タイマー表示 | nozaki-ui.js: renderNozaki / layoutNozaki | nozakiTimerとnozakiAtPortのローカルメッセージ。content.jsのdiv/hstと配置連携 | 同テストの表示・非表示・経過維持 |
| タイマーYPS接続 | devtools.js: nozaki_snapshot / nozaki_publish、api_req_hensei/change、api_port/port | 成功応答で更新、出撃/戦闘で表示だけを隠す。定期通知でも表示状態を保持 | 編成成功/失敗・プリセット・艦隊間移動 |
| 戦果メモ | senka.js: Tracker.receive / lines / setManual | start2/getData、port/port、questlist、map/start・next、戦闘結果等 | test/senka.test.cjs |
| 戦果受信アダプタ | senka-network.js: ypsSenka.receive / snapshot / watches | Chrome取得済み本文のみ。順序維持、欠落時gap。YPSの既存func呼出を維持 | Callback/Promise形式、順序、欠落後継続 |
| 戦果手動入力 | senka-ui.js、content.js: YPS_senka_edit | yps-senka-localメッセージ、送信元・期間トークン確認、ブラウザ内補正 | test/senka.test.cjs |
| コンパス遅延起動 | compass/collector-bootstrap.js: ypsCompassStart / ypsCompassSubscribe | devtools.htmlでbootstrapをdevtools.jsより前に読込。senka-network.jsの成功母港処理後に開始 | 起動中本文の保持、元日時・順序・一回保存 |
| コンパス保存 | collector-integrated.js: receive / syncLocalQuestRecords、core.js: normalize / reduce、db.js: commit | bootstrap経由で受信、正規化後IndexedDB。待機中は本文だけ一時保持。追加リクエストなし | compass/tests/browser.html、core.test.js |
| 行動履歴 | activity.js: activityFact / activityRows / activityView、db.js: activityHistory | 出撃・進撃・結果・帰港・遠征を集約。日時・種類別連番。欠落位置は不明 | activity.test.js、map-nodes.test.js |
| ドロップ | drop-ui.js、activityFact | 全保存履歴から艦種・艦名・マス・結果を抽出。ページ50/100件 | drop-ui.test.js |
| 任務・期限管理 | quest-catalog.js、quest-manager.js、quest-progress.js、quest-ui.js、yps-quest-progress.js | Wiki定義＋受信任務一覧＋周期・前提・手動補正。未観測は未確認 | quest-manager.test.js |
| 戦果集計画面 | insights.js、score-ui.js | 提督経験値の観測差分と手動加算を分離。EO等を自動二重加算しない | insights.test.js |
| 通常海域候補 | generator.js / generator-ui.js / generator-demo.js | 出典付きゲージ別テンプレートを保有艦・装備へ置換 | generator.test.js |
| 遠征候補 | expedition-ui.js、generator.js | 必要艦種・数・装備・レベル・大成功条件の照合 | expedition.test.js |
| 元表示の保持 | original-sections.js: ypsOriginalSections、content.js | 既存一覧と戦闘表示を置換しない | test/original-sections.test.cjs |
| 戦闘欠落耐性 | devtools.js: battle_fdeck / push_battle_mvp / on_battle | 艦隊番号や艦情報不足でも例外で止めない。不明な艦隊を推測しない | test/battle-fleet.test.cjs |
| UIとローカル連携 | content.js: copy_button / render_compass_navigation、background.js、style-yps.css | コンパスを制空権シミュの右へ。ローカル状態メッセージを本文へ流さない | test/compass-toolbar.html |

## 起動性能で維持する条件

- devtools.htmlにcollector-integrated.jsの直接読込を戻さない。bootstrapだけを先行読込する。
- ypsCompassStartは成功した母港処理の後。一時保持した応答は再送しない。
- 過去の任務履歴集計を起動前や受信保存の直列待ちへ戻さない。
- dashboard.js: refreshは表示中のタブに必要な履歴だけ読む。
- db.js: activityHistoryは256件の主キー別読取。同じ時刻の記録を飛ばさず、最後にat/id順に揃える。
- コピー用データ通知で表示全体の整形・履歴保存を行わない。

## 機能単位で移植するとき

野埼のみ: 計算・UI・manifest読込・devtools接続・CSS・メッセージ除外を移植し、戦果アダプタに依存した現在の受信位置を上流の成功応答処理へ置き換える。

戦果のみ: Tracker・UI・アダプタ・送信元検査・表示/補正ボタンを移植する。コンパス起動呼出は存在確認付きなので、コンパスなしでも停止しない。

コンパス: compass全モジュール、bootstrap起動フック、開くボタン、background中継を移植する。任務同期は既存YPSの受信状態を参照するため、グローバル変数・キー・周期の意味を確認する。表示データを保存原本へ逆流させない。

この表は移植単位の説明であり、部分導入用の自動インストーラーではありません。
