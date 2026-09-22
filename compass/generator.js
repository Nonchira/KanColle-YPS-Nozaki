// Local candidate search; scores are preferences, never combat power or win rates.
export const POLICIES=['通常','対空優先','対潜優先','通常＋対空＋対潜'];
export const MAP_PROFILES=[
  {id:'1-5',area:'1',name:'1-5 鎮守府近海',templates:[{name:'軽量：駆逐4',slots:[[2],[2],[2],[2]]},{name:'軽量：軽巡1・駆逐3',slots:[[3],[2],[2],[2]]},{name:'軽量：海防4',slots:[[1],[1],[1],[1]]}],threat:'対潜',source:'https://zekamashi.net/kancolle-kouryaku/1-5/',retrieved_at:'2026-09-07',valid_until:'2026-12-07',confidence:.9,requirements:'4隻。先制対潜を優先し、ソナー・爆雷系を準備。旗艦Lv・索敵の厳密値は編成と改装で変わるため未判定。',note:'掲載編成例を艦種条件に使用。先制対潜条件は保有艦の対潜値を確認。'},
  {id:'2-1',area:'2',name:'2-1 南西諸島哨戒',templates:[{name:'軽量：高速・軽巡1水母1駆逐4',slots:[[3],[16],[2],[2],[2],[2]],fast:true},{name:'重量：高速・空母系2＋自由4',slots:[[7,11,18],[7,11,18],[2,3,5,6,7,8,9,10,11,16,18],[2,3,5,6,7,8,9,10,11,16,18],[2,3,5,6,7,8,9,10,11,16,18],[2,3,5,6,7,8,9,10,11,16,18]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/2-1/',retrieved_at:'2026-09-07',valid_until:'2026-12-07',confidence:.85,requirements:'軽量編成は高速6隻・軽巡1・水母1・駆逐4。重量編成は高速・空母系2を軸に自由4。旗艦Lv・必要装備は固定せず、制空・索敵を保有装備で確認。',note:'軽量編成と重量候補を比較。ルート・制空・任務適合は候補生成時に別途確認。'},
  {id:'6-1',area:'6',name:'6-1 中部海域哨戒線',templates:[{name:'潜水母艦ルート：軽巡1・潜水4・潜水母艦1',slots:[[3],[13],[13],[13],[13],[20]]},{name:'空母ルート：空母1・雷巡1・軽巡1・潜水3',slots:[[7,11,18],[4],[3],[13],[13],[13]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/6-1/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'ボス固定例は軽巡1・潜水4・潜水母艦1、または駆逐2・潜水3・潜水母艦1。潜水母艦は潜水空母と別艦種。索敵・制空・潜水艦用魚雷は保有装備で確認。',note:'ぜかましの6-1ルート固定例を艦種条件へ反映。手持ちの同じ艦種へ置き換えて候補を生成します。'},
  {id:'6-1',area:'6',name:'6-1 中部海域哨戒線',templates:[{name:'潜水母艦ルート：軽巡1・潜水4・潜水母艦1',slots:[[3],[13],[13],[13],[13],[20]]},{name:'空母ルート：空母1・雷巡1・軽巡1・潜水3',slots:[[7,11,18],[4],[3],[13],[13],[13]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/6-1/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'ボス固定例は軽巡1・潜水4・潜水母艦1、または駆逐2・潜水3・潜水母艦1。潜水母艦は潜水空母と別艦種。索敵・制空・潜水艦用魚雷は保有装備で確認。',note:'ぜかましの6-1ルート固定例を艦種条件へ反映。手持ちの同じ艦種へ置き換えて候補を生成します。'},
  {id:'1-1',area:'1',name:'1-1 鎮守府正面海域',templates:[{name:'基本：駆逐4',slots:[[2],[2],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/1-1/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'駆逐4を基本とする初期海域。ボス到達率は編成隻数で変動。制空装備は原則不要。',note:'ぜかましの初攻略例を反映。'} ,
  {id:'2-2',area:'2',name:'2-2 バシー海峡',templates:[{name:'道中1戦：空母2・水母1・軽巡1・海防2',slots:[[7,11,18],[7,11,18],[16],[3],[1],[1]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/2-2/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'空母2・水母1・軽巡1・海防2の例。制空値は優勢以上を目安に調整。',note:'水母を含む道中1戦の編成例を反映。'} ,
  {id:'3-2',area:'3',name:'3-2 キス島撤退作戦',templates:[{name:'高速＋：軽巡1・駆逐5',slots:[[3],[2],[2],[2],[2],[2]],fast:true},{name:'駆逐のみ：駆逐6',slots:[[2],[2],[2],[2],[2],[2]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/3-2/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'軽巡1・駆逐5または駆逐6。高速＋以上と電探1個以上を推奨。',note:'ぜかましの初攻略例を反映。缶・タービンの有無は装備提案で確認。'} ,
  {id:'3-5',area:'3',name:'3-5 北方AL海域',templates:[{name:'重量：戦艦2・空母系1・重巡系3',slots:[[9],[9],[7,11,18],[5,6,8,9,10,11,18],[5,6,8,9,10,11,18],[5,6,8,9,10,11,18]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/3-5/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.75,requirements:'戦艦＋空母系3隻以下の重量編成例。制空・索敵は手持ち装備で確認。',note:'ぜかまし掲載の重量編成を反映。軽量編成は追加確認中。'} ,
  {id:'4-4',area:'4',name:'4-4 カスガダマ島',templates:[{name:'軽量：軽空母3・軽巡1・駆逐2',slots:[[7],[7],[7],[3],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/touhoutyuusuu/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.75,requirements:'軽空母3・軽巡1・駆逐2のルート固定例。制空・対潜装備を調整。',note:'ぜかましの4-4軽量編成例を反映。重量編成は追加確認中。'} ,
  {id:'5-1',area:'5',name:'5-1 南方海域前面',templates:[{name:'水上打撃：戦艦2・軽巡1・駆逐2・重巡系1',slots:[[9],[9],[3],[2],[2],[5,6]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/seieimu-daiitisentai/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.75,requirements:'戦艦2・軽巡1・駆逐2・重巡系1の例。水戦などで制空115前後を目安に調整。',note:'ぜかまし掲載の5-1編成例を反映。任務指定艦は別途固定してください。'},
  {id:'1-2',area:'1',name:'1-2 南西諸島沖',templates:[{name:'最短：軽巡1・駆逐4',slots:[[3],[2],[2],[2],[2]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/1-2/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'5隻・軽巡1・駆逐4。高速統一を条件にボスルートを狙う。',note:'ぜかましの初攻略例を反映。'},
  {id:'1-4',area:'1',name:'1-4 南1号作戦',templates:[{name:'周回：空母2・駆逐3・潜水母艦1',slots:[[7,11,18],[7,11,18],[2],[2],[2],[20]]},{name:'初攻略：軽空1・重巡1・軽巡2・駆逐2',slots:[[7],[5,6],[3],[3],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/1-4/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'空母2・駆逐3・潜水母艦1の周回例、または軽空1・重巡1・軽巡2・駆逐2。制空を確保できる艦載機を優先。',note:'ぜかまし掲載の周回・初攻略例を反映。'},
  {id:'2-3',area:'2',name:'2-3 オリョール哨戒',templates:[{name:'安定寄り：軽空母2・水母1・軽巡1・駆逐2',slots:[[7,11,18],[7,11,18],[16],[3],[2],[2]]},{name:'潜水艦：潜水6',slots:[[13],[13],[13],[13],[13],[13]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/2-3/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.8,requirements:'ボス固定は不可。水母1・駆逐2で一部ルートを固定し、軽空母2・軽巡1を組み合わせる例。制空値162以上を目安。',note:'ぜかましのボス到達例を反映。ルートは完全固定ではありません。'},
  {id:'2-4',area:'2',name:'2-4 沖ノ島海域',templates:[{name:'初攻略：戦艦1・正規空母1・軽空母1・重巡2・軽巡1',slots:[[9],[11,18],[7],[5,6],[5,6],[3]]},{name:'軽量：航巡1・軽巡1・駆逐4',slots:[[5,6],[3],[2],[2],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/2-4/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'初攻略は戦艦1・正規空母1・軽空母1・重巡2・軽巡1。軽量例は航巡1・軽巡1・駆逐4だが難易度が上がる。',note:'ぜかましの初攻略例と軽量例を反映。ルートは完全固定ではありません。'},
  {id:'2-5',area:'2',name:'2-5 沖ノ島沖戦闘哨戒',templates:[{name:'下ルート：駆逐1（旗艦）・重巡1・軽巡1・駆逐3',slots:[[2],[5],[3],[2],[2],[2]],fast:true},{name:'上ルート：軽巡1・正規空母1・軽空母1・駆逐3',slots:[[3],[11,18],[7],[2],[2],[2]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/2-5/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'下ルートは駆逐1（旗艦）・重巡1・軽巡1・駆逐3。高速統一・索敵が必要。上ルートは軽巡1・正規空母1・軽空母1・駆逐3の例。',note:'ぜかましの2-5編成例を反映。索敵スコアは保有装備で確認。'},
  {id:'3-1',area:'3',name:'3-1 モーレイ海',templates:[{name:'水上：航巡1・雷巡1・軽巡2・駆逐2',slots:[[6],[4],[3],[3],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/nitieibei-batubyou/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.75,requirements:'航巡1・雷巡1・軽巡2・駆逐2の例。制空値45前後を目安。',note:'ぜかまし掲載例を反映。任務指定艦は別途固定してください。'},
  {id:'3-3',area:'3',name:'3-3 アルフォンシーノ方面',templates:[{name:'標準：正規空母1・戦艦/軽空母1・駆逐2・巡洋艦2',slots:[[11,18],[7,9,10,11,18],[2],[2],[3,4,5,6],[3,4,5,6]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/hoppou-quest/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.8,requirements:'正規空母1・戦艦または軽空母1・駆逐2・巡洋艦系2。渦潮対策に電探を推奨。制空156以上を目安。',note:'ぜかましの北方クエスト編成例を反映。'},
  {id:'3-4',area:'3',name:'3-4 北方海域艦隊決戦',templates:[{name:'初攻略：戦艦1・正規空母2・軽空母1・軽巡1・水母1',slots:[[9],[11,18],[11,18],[7],[3],[16]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/3-4/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'戦艦1・正規空母2・軽空母1・軽巡1・水母1。制空175前後を目安。',note:'ぜかましの初攻略例を反映。'},
  {id:'4-1',area:'4',name:'4-1 ジャム島攻略作戦',templates:[{name:'初攻略：正規空母1・重巡2・軽巡1・駆逐2',slots:[[11,18],[5,6],[5,6],[3],[2],[2]]},{name:'別ルート：戦艦/空母2・駆逐1・自由3',slots:[[9,10,11,18],[9,10,11,18],[2],[3,5,6,16],[3,5,6,16],[3,5,6,16]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/4-1/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'初攻略は正規空母1・重巡2・軽巡1・駆逐2。潜水艦対策に対潜装備を準備。',note:'ぜかましの4-1初攻略例を反映。'},
  {id:'4-2',area:'4',name:'4-2 カレー洋制圧戦',templates:[{name:'初攻略：正規空母2・軽巡1・駆逐3',slots:[[11,18],[11,18],[3],[2],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/4-2/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'正規空母2・軽巡1・駆逐3。軽巡1＋駆逐3以上でルート制御。制空90前後を目安。',note:'ぜかましの4-2初攻略例を反映。'},
  {id:'4-5',area:'4',name:'4-5 深海東洋艦隊漸減作戦',templates:[{name:'高速＋：空母系4・雷巡1・航巡1',slots:[[7,11,18],[7,11,18],[7,11,18],[7,11,18],[4],[6]],fast:true},{name:'軽量：軽巡1・駆逐3・自由2',slots:[[3],[2],[2],[2],[5,6],[5,6]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/4-5/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.8,requirements:'高速＋統一の空母系4・雷巡1・航巡1、または軽巡1・駆逐3・自由2。ボスは陸上型のため三式弾・対地装備を確認。',note:'ぜかましの4-5高速＋・軽量ルート例を反映。'},
  {id:'5-2',area:'5',name:'5-2 珊瑚諸島沖海戦',templates:[{name:'初攻略：空母2・戦艦2・航巡1・重巡1',slots:[[11,18],[11,18],[9,10],[9,10],[6],[5,6]]},{name:'史実ルート：翔鶴・瑞鶴・駆逐2・自由2',slots:[[11,18],[11,18],[2],[2],[5,6,9,10,16],[5,6,9,10,16]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/5-2/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'空母2以下・戦艦2以下。索敵スコア係数2で70以上を目安。制空252前後（優勢）を目安。',note:'ぜかましの5-2初攻略例と史実艦ルート例を反映。'},
  {id:'4-3',area:'4',name:'4-3 リランカ島空襲',templates:[{name:'初攻略：正規空母2・重巡2・駆逐2',slots:[[11,18],[11,18],[5,6],[5,6],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/4-3/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'正規空母2・重巡2・駆逐2。陸上型ボスのため三式弾・対地装備を準備。制空165前後を目安。',note:'ぜかましの初攻略例を反映。'},
  {id:'5-3',area:'5',name:'5-3 第一次サーモン沖海戦',templates:[{name:'初攻略：重巡級5・軽巡1',slots:[[5,6],[5,6],[5,6],[5,6],[5,6],[3]]},{name:'低速戦艦ルート：戦艦1・重巡1・雷巡1・軽巡1・駆逐2',slots:[[9],[5,6],[4],[3],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/5-3/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'重巡級5・軽巡1、または戦艦1・重巡1・雷巡1・軽巡1・駆逐2。夜戦対策と水戦を確認。',note:'ぜかましの初攻略例を反映。'},
  {id:'5-4',area:'5',name:'5-4 サーモン海域',templates:[{name:'初攻略：高速戦艦2・航巡2・駆逐2',slots:[[8],[8],[6],[6],[2],[2]]},{name:'中央：戦艦1・航巡1・軽巡1・駆逐3',slots:[[8,9],[6],[3],[2],[2],[2]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/5-4/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'高速戦艦2・航巡2・駆逐2の初攻略例。索敵係数2で45以上を目安。',note:'ぜかましの5-4初攻略例を反映。'},
  {id:'5-5',area:'5',name:'5-5 第二次サーモン海戦',templates:[{name:'下ルート：戦艦2・駆逐4',slots:[[9],[9],[2],[2],[2],[2]]},{name:'高速機動：正規空母4・戦艦2',slots:[[11,18],[11,18],[11,18],[11,18],[9],[9]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/5-5/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.8,requirements:'戦艦2・駆逐4は索敵係数2で66以上。高速機動は高速統一・正規空母2以上。',note:'ぜかましの5-5ルート例を反映。高難度のため制空・索敵・支援艦隊を別途確認。'},
  {id:'6-2',area:'6',name:'6-2 MS諸島沖',templates:[{name:'下ルート：戦艦1・空母1・駆逐2・自由2',slots:[[9,10],[11,18],[2],[2],[3,4,5,6],[3,4,5,6]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/6-2-uranami/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.75,requirements:'戦艦1以下・空母1以下・駆逐2以上。索敵と制空153前後を目安。',note:'ぜかましの6-2下ルート条件を反映。'},
  {id:'6-3',area:'6',name:'6-3 K作戦',templates:[{name:'3戦：軽巡1・水母1・駆逐4',slots:[[3],[16],[2],[2],[2],[2]]},{name:'4戦：軽巡3・水母1・駆逐2',slots:[[3],[3],[3],[16],[2],[2]]}],threat:'対潜',source:'https://zekamashi.net/kancolle-kouryaku/6-3/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'軽巡1・水母1・駆逐4、または軽巡3・水母1・駆逐2。索敵係数3で38以上を目安。',note:'ぜかましの6-3初攻略例を反映。航空偵察のため水上機を確認。'},
  {id:'6-4',area:'6',name:'6-4 離島再攻略作戦',templates:[{name:'右スタート：軽巡1（旗艦）・高速戦艦1・航巡1・駆逐3',slots:[[3],[8,9],[6],[2],[2],[2]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/6-4/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'軽巡旗艦1・戦艦1以下・駆逐3以上・高速統一。対地装備（三式弾・大発系・WG系）と基地航空隊が重要。',note:'ぜかましの初攻略例を反映。'},
  {id:'6-5',area:'6',name:'6-5 KW環礁沖海域',templates:[{name:'上ルート：航空戦艦1・正規空母2・航巡1・雷巡1・自由1',slots:[[10],[11,18],[11,18],[6],[4],[3,5,6,9]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/isekaini-6-5/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.75,requirements:'航空戦艦（伊勢改二等）で制空を補助し、空母2・航巡等で制空396以上を目安。基地航空隊をボスへ集中。',note:'ぜかましの6-5編成例を反映。'},
  {id:'1-3',area:'1',name:'1-3 海上護衛作戦',templates:[{name:'初攻略：軽巡2・駆逐4',slots:[[3],[3],[2],[2],[2],[2]]}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/1-3/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'低戦0・正規空母0・駆逐4以上。軽巡2・駆逐4の初攻略例。',note:'ぜかましの1-3初攻略例を反映。'},
  {id:'1-6',area:'1',name:'1-6 鎮守府近海航路',templates:[{name:'下ルート：軽巡1・駆逐5',slots:[[3],[2],[2],[2],[2],[2]]}],threat:'対潜',source:'https://zekamashi.net/kancolle-kouryaku/1-6/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'軽巡1・駆逐または海防5。対潜装備と対空カットインを準備。',note:'ぜかましの1-6初攻略例を反映。'},
  {id:'7-1',area:'7',name:'7-1 ブルネイ泊地沖',templates:[{name:'対潜周回：軽巡1・駆逐4',slots:[[3],[2],[2],[2],[2]]}],threat:'対潜',source:'https://zekamashi.net/kancolle-kouryaku/senka-7-1/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'軽巡1・駆逐4の5隻編成。対潜先制爆雷攻撃を優先。',note:'ぜかましの7-1周回例を反映。'},
  {id:'7-2-1',area:'7',name:'7-2-1 タウイタウイ泊地沖（第一ゲージ）',templates:[{name:'第一ゲージ：軽巡1・駆逐3',slots:[[3],[2],[2],[2]]}],threat:'対潜',source:'https://zekamashi.net/kancolle-kouryaku/7-2/',retrieved_at:'2026-09-15',valid_until:'2026-12-15',confidence:.9,requirements:'CEG。4隻・戦艦/正規空母なし。対潜装備を準備。ボスS勝利は水上随伴艦への対策も必要。',note:'ぜかましの第一ゲージ初攻略例。'},
  {id:'7-2-2',area:'7',name:'7-2-2 タウイタウイ泊地沖（第二ゲージ）',templates:[{name:'第二ゲージ：戦艦1・正規空母1・軽空母1・雷巡1・駆逐2',slots:[[8,9,10],[11,18],[7],[4],[2],[2]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/7-2/',retrieved_at:'2026-09-15',valid_until:'2026-12-15',confidence:.9,requirements:'BCDIM・高速統一。索敵33式係数4で69以上（司令部Lv120基準）。制空は拮抗170程度、優勢370程度が目安。艦戦・偵察機を準備し、先制対潜・対空CIも検討。低速艦の装備による高速化は自動提案しません。制空・索敵の成立は未判定。',note:'ぜかましの第二ゲージ初攻略例。第一ゲージとは分けて生成します。'},
  {id:'7-3',area:'7',name:'7-3 ペナン島沖',templates:[{name:'第一ゲージ：羽黒1・駆逐3',slots:[[5],[2],[2],[2]]},{name:'第二ゲージ：羽黒1・足柄1・航巡1・駆逐3',slots:[[5],[5],[6],[2],[2],[2]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/7-3/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'第一ゲージは羽黒1・駆逐3。第二ゲージは羽黒1・足柄1・重巡級1・駆逐3の高速統一例。',note:'ぜかましの7-3各ゲージ初攻略例を反映。史実艦の有無でルートが変わります。'},
  {id:'7-4',area:'7',name:'7-4 ヒ船団海上護衛作戦',templates:[{name:'初攻略：航戦1・重巡1・雷巡1・駆逐2・海防1',slots:[[10],[5,6],[4],[2],[2],[1]]}],threat:'対潜',source:'https://zekamashi.net/kancolle-kouryaku/7-4/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.9,requirements:'航戦1・重巡級1・軽巡級1・駆逐/海防3。索敵係数4で37以上、先制対潜3隻を目安。',note:'ぜかましの7-4初攻略例を反映。基地航空隊はボス集中を推奨。'},
  {id:'7-5',area:'7',name:'7-5 スラバヤ沖海戦・バタビア沖海戦',templates:[{name:'第一ゲージ：航巡1・雷巡1・軽巡1・駆逐2・水母1',slots:[[6],[4],[3],[2],[2],[16]]},{name:'ギミックM：航巡1・雷巡1・軽巡1・駆逐2・水母1',slots:[[6],[4],[3],[2],[2],[16]]},{name:'第二ゲージ：戦艦1・航巡1・軽巡1・駆逐3',slots:[[9,10],[6],[3],[2],[2],[2]]},{name:'第三ゲージ：軽空母1・航巡1・軽巡1・駆逐2・水母1',slots:[[7],[6],[3],[2],[2],[16]],fast:true}],threat:'通常',source:'https://zekamashi.net/kancolle-kouryaku/7-5/',retrieved_at:'2026-09-12',valid_until:'2026-12-12',confidence:.85,requirements:'3ゲージ＋MマスギミックのExtra Operation。第一/K・Mは航巡1・雷巡1・軽巡1・駆逐2・水母1（Mは索敵係数4で58以上）。第二/Qは戦艦1・航巡1・軽巡1・駆逐3。第三/Tは軽空母1・航巡1・軽巡1・駆逐2・水母1の高速統一、索敵係数4で63以上。',note:'ぜかましの7-5各ゲージ・ギミック編成例を反映。'}
];
const surface=[1,2,3,4,5,6,7,8,9,10,11,16,18,21];
export function profileFor(state,id,now=Date.now()){
  if(id==='7-2')id='7-2-1'; // Legacy callers default to the explicitly named first gauge.
  const known=MAP_PROFILES.find(p=>p.id===id);
  if(known&&now<=Date.parse(known.valid_until+'T23:59:59+09:00'))return known;
  const received=Object.values(state.mapMaster||{}).find(p=>`${p.area}-${p.map}`===id);
  if(!known&&!received&&id!=='custom')throw Error('海域を選択してください');
  return {id,area:received?.area||'custom',name:known?.name||received?.name||'任意海域',templates:[],threat:'通常',source:null,confidence:null,registered:false,note:known?'編成参考の有効期限切れです。攻略条件を確認してから再生成してください。':'この海域の分岐条件は未登録です。自動候補は作成せず、遠征条件は「遠征」欄で確認してください。'};
}
export function availableMaps(state){return [...MAP_PROFILES.map(p=>({id:p.id,area:p.area,name:p.name})),...Object.values(state.mapMaster||{}).filter(p=>p.area!=null&&p.map!=null&&!MAP_PROFILES.some(x=>x.id===`${p.area}-${p.map}`||x.id.startsWith(`${p.area}-${p.map}-`))).map(p=>({id:`${p.area}-${p.map}`,area:String(p.area),name:`${p.area}-${p.map} ${p.name||''}`})),{id:'custom',area:'custom',name:'任意海域 / 条件未登録'}];}
const type=(state,ship)=>state.shipMaster[ship.masterId]?.type;
function blocked(state,ship){if(!ship)return '保有未確認';if(!(ship.maxHp>0)||ship.hp==null)return '耐久未取得';if(ship.hp/ship.maxHp<=.25)return '大破';if((state.docks||[]).some(d=>d.shipId===ship.id))return '入渠中';if((state.fleets||[]).some(f=>f.shipIds.includes(ship.id)&&f.mission[0]===1))return '遠征中';return null;}
function scoreShip(state,s,policy,threat){const t=type(state,s);return (s.level??0)*.45+(s.cond??0)*.15+(s.hp/s.maxHp)*12+((policy.includes('対潜')||threat==='対潜')&&[1,2,3,4,21].includes(t)?45:0)+(policy.includes('対空')&&[2,7,11,18].includes(t)?30:0)+(policy.includes('通常')&&[5,6,8,9,10,11,18].includes(t)?24:0);}
function matchFixed(state,ships,slots,fast){
  if(!ships.length)return slots;const [ship,...rest]=ships;
  if(fast&&!(state.shipMaster[ship.masterId]?.speed>=10))return null;
  for(let i=0;i<slots.length;i++)if(slots[i].includes(type(state,ship))){const result=matchFixed(state,rest,slots.filter((_,j)=>j!==i),fast);if(result)return result;}return null;
}
export function canEquip(state,ship,item,slot){
  if(ship.slots?.[slot]===item.id)return {allowed:true,basis:'現在の同一スロットで観測'};
  const category=state.equipmentMaster[item.masterId]?.category;if(!category)return {allowed:false,basis:'装備種別未取得'};
  const rule=state.shipEquipRules?.[ship.masterId];
  if(rule&&Object.hasOwn(rule,category))return {allowed:rule[category]===null||rule[category].includes(item.masterId),basis:'艦別装備マスター'};
  return {allowed:state.shipTypes?.[type(state,ship)]?.equipTypes?.[category]===1,basis:'艦種別装備マスター（個別例外は要確認）'};
}
const groups={gun:[1,2,3],torpedo:[5],fighter:[6,45,48],attack:[7,8,57,58],scout:[10,11],radar:[12,13],sonar:[14,40],depth:[15,44],aa:[21]};
function equipmentWeight(state,item,role,policy){const m=state.equipmentMaster[item.masterId];if(!m)return -Infinity;let w=(item.stars??0)*.3+(item.proficiency??0)*.4+(m.firepower??0)+(m.torpedo??0)*.6+(m.bomb??0)*.6;
  if(policy.includes('対空'))w+=(m.aa??0)*4;if(policy.includes('対潜'))w+=(m.asw??0)*5;
  if(role==='sonar'||role==='depth')w+=(m.asw??0)*5;if(role==='fighter'||role==='aa')w+=(m.aa??0)*5;
  return w+(groups[role]?.includes(m.category)?100:0);
}
function rolesFor(state,ship,policy,threat){const t=type(state,ship),antiSub=policy.includes('対潜')||threat==='対潜';
  if([7,11,18].includes(t))return policy==='対空優先'?['attack','fighter','fighter','fighter']:['attack','fighter','attack','fighter'];
  if(antiSub&&[1,2,3,4,21].includes(t))return policy==='通常＋対空＋対潜'&&threat!=='対潜'?['sonar','gun','radar','depth']:['sonar','depth','sonar','depth'];
  if(policy.includes('対空'))return ['gun','gun','radar','aa'];return [5,6,8,9,10].includes(t)?['gun','gun','scout','radar']:['gun','gun','torpedo','radar'];
}
function allocateEquipment(state,ships,policy,profile,allowTransfers){
  const ids=new Set(ships.map(s=>s.id)),used=new Set(),owners=new Map();
  for(const s of Object.values(state.ships||{}))for(const id of [...s.slots,s.extraSlot].filter(x=>x>0))owners.set(id,s);
  const items=Object.values(state.equipment||{}).filter(item=>{const owner=owners.get(item.id);return !owner||ids.has(owner.id)||(allowTransfers&&!blocked(state,owner));});
  const rows=ships.map(ship=>({shipId:ship.id,items:[],gaps:[],roles:rolesFor(state,ship,policy,profile.threat)}));
  // Retain expansion equipment exactly; never guess special expansion eligibility.
  for(const [i,s] of ships.entries())if(s.extraSlot>0){const item=state.equipment?.[s.extraSlot];used.add(s.extraSlot);if(item)rows[i].items.push({...item,slot:'ix',name:state.equipmentMaster[item.masterId]?.name||`装備 #${item.masterId}`,basis:'現在の増設枠で観測',from:s.id,role:'保持'});else rows[i].gaps.push('増設装備が未取得');}
  for(let slot=0;slot<5;slot++)for(const [i,s] of ships.entries()){
    const count=state.shipMaster[s.masterId]?.slotCount;
    if(slot>=s.slots.length||(Number.isInteger(count)&&slot>=count))continue;const row=rows[i],role=row.roles[slot%row.roles.length];
    if(!Number.isInteger(count)&&!(s.slots[slot]>0)){row.gaps.push(`枠${slot+1}: 通常枠数が未取得`);continue;}
    const sorted=items.filter(x=>!used.has(x.id)&&canEquip(state,s,x,slot).allowed).map(x=>({item:x,score:equipmentWeight(state,x,role,policy)})).sort((a,b)=>b.score-a.score||a.item.id-b.item.id);
    const pick=sorted.find(x=>groups[role]?.includes(state.equipmentMaster[x.item.masterId]?.category))||sorted.find(x=>x.item.id===s.slots[slot]);
    if(!pick){row.gaps.push(`枠${slot+1}: ${role}候補なし`);continue;}
    const x=pick.item;used.add(x.id);row.items.push({...x,slot:`i${slot+1}`,name:state.equipmentMaster[x.masterId]?.name||`装備 #${x.masterId}`,basis:canEquip(state,s,x,slot).basis,from:owners.get(x.id)?.id??null,role});
    if(!groups[role]?.includes(state.equipmentMaster[x.masterId]?.category))row.gaps.push(`枠${slot+1}: ${role}不足のため現装備を保持`);
  }
  return rows;
}
export function equipmentPlanFor(state,ships,{policy='通常',threat='通常',allowTransfers=false}={}){
  const profile={threat};
  return allocateEquipment(state,ships||[],policy,profile,allowTransfers);
}
export function generateFleet(state,{mapId='1-5',mode='auto',policy='通常',selectedIds=[],allowTransfers=false,now=Date.now()}={}){
  if(!POLICIES.includes(policy)||!['auto','manual','hybrid'].includes(mode))throw Error('モードと優先方針を選択してください');
  const profile=profileFor(state,mapId,now),fixed=mode==='auto'?[]:selectedIds.map(Number);
  if(profile.registered===false&&mode!=='manual')return {profile,policy,mode,observedAt:state.updatedAt,generatedAt:new Date(now).toISOString(),warnings:[profile.note,'攻略条件未登録のため、艦種を推測した候補は表示しません。'],candidates:[],limitations:['この海域のルート分岐・必要艦種が未登録です','遠征の必要艦種は「遠征」欄の受信済み条件を参照してください','候補生成は登録済みの通常海域プロファイルに限ります']};
  if(new Set(fixed).size!==fixed.length||fixed.some(x=>!Number.isInteger(x)))throw Error('固定艦に重複または不正なIDがあります');
  if(mode!=='auto'&&!fixed.length)throw Error('固定する艦娘を1隻以上選択してください');if(fixed.length>6)throw Error('固定艦は6隻以内で選択してください');
  for(const id of fixed){const problem=blocked(state,state.ships?.[id]);if(problem)throw Error(`固定艦 #${id}: ${problem}のため候補生成を停止しました`);}
  const pool=Object.values(state.ships||{}).filter(s=>!blocked(state,s)&&type(state,s)!=null).sort((a,b)=>scoreShip(state,b,policy,profile.threat)-scoreShip(state,a,policy,profile.threat)||a.id-b.id);
  const fixedShips=fixed.map(id=>state.ships[id]),results=[],warnings=[];
  if(!profile.source)warnings.push(profile.note);if(!Object.keys(state.shipTypes||{}).length)warnings.push('装備可否マスターが未取得です。観測済みの同一スロット装備だけを保持します。');
  const templates=mode==='manual'&&!profile.templates.some(t=>matchFixed(state,fixedShips,t.slots,t.fast))?[{name:'手動固定（海域の編成例に不適合）',slots:fixedShips.map(s=>[type(state,s)])}]:profile.templates;
  if(templates!==profile.templates)warnings.push('固定した編成は登録済み海域条件に適合しません。艦娘を入れ替えず装備案だけを提示します。');
  for(const template of templates){
    const remaining=matchFixed(state,fixedShips,template.slots,template.fast);if(!remaining)continue;
    let beam=[{ships:fixedShips,score:0}];
    if(mode==='manual'){if(remaining.length)warnings.push(`${template.name}は${template.slots.length}隻の例です。固定した${fixed.length}隻だけで生成します。`);}
    else for(const allowed of remaining){const next=[];for(const b of beam){const options=pool.filter(s=>!b.ships.some(x=>x.id===s.id)&&allowed.includes(type(state,s))&&(!template.fast||state.shipMaster[s.masterId]?.speed>=10)).slice(0,10);for(const s of options)next.push({ships:[...b.ships,s],score:b.score+scoreShip(state,s,policy,profile.threat)});}
      const unique=new Map();for(const b of next.sort((a,b)=>b.score-a.score)){const key=b.ships.map(s=>s.id).sort((a,b)=>a-b).join(',');if(!unique.has(key))unique.set(key,b);}
      beam=[...unique.values()].slice(0,18);if(!beam.length)break;
    }
    for(const b of beam.slice(0,3)){const key=b.ships.map(s=>s.id).sort((a,b)=>a-b).join(',');if(results.some(x=>x.key===key))continue;const equipment=allocateEquipment(state,b.ships,policy,profile,allowTransfers);results.push({key,template:mode==='manual'?`指定した${fixed.length}隻を固定`:template.name,ships:b.ships.map(s=>({id:s.id,masterId:s.masterId,level:s.level,hp:s.hp,maxHp:s.maxHp,name:state.shipMaster[s.masterId]?.name||`艦 #${s.masterId}`})),equipment,score:b.ships.reduce((n,s)=>n+scoreShip(state,s,policy,profile.threat),0),reason:mode==='manual'?`選択艦と順序を保持し、${policy}の方針で保有装備を配分。`:`${template.name}の艦種条件と${policy}の役割優先、Lv・耐久率・Condで比較。`,gaps:equipment.flatMap(x=>x.gaps.map(g=>`艦 #${x.shipId} ${g}`))});}
  }
  if(!results.length)warnings.push('この海域の編成例を満たす候補がありません。固定艦・艦種・高速条件・遠征/入渠/損傷状態を確認してください。');
  const ranked=results.sort((a,b)=>b.score-a.score),economy=[...ranked].sort((a,b)=>a.ships.reduce((n,s)=>n+(state.shipMaster[s.masterId]?.fuelMax??999),0)-b.ships.reduce((n,s)=>n+(state.shipMaster[s.masterId]?.fuelMax??999),0));
  const candidates=mode==='auto'?[...new Map([...(ranked.length?[['最強候補',ranked[0]]]:[]),...(economy.length?[['燃費優先',economy[0]]]:[]),...ranked.slice(1).map((x,i)=>[`比較候補${i+1}`,x])].map(([k,v])=>[v.key,{...v,variant:k}])).values()].slice(0,3):ranked.slice(0,3);
  return {profile,policy,mode,observedAt:state.updatedAt,generatedAt:new Date(now).toISOString(),warnings:[...new Set(warnings)],candidates,limitations:['ルート到達・制空値・索敵・対空CI・先制対潜の成立は未判定','個別装備の特殊制約・装備ボーナス・特効・札制限は別途確認','評価点は候補比較用の独自指標。戦闘ダメージや勝率ではありません']};
}
export function candidateDeck(candidate,state){const out={version:4,f1:{name:'艦隊コンパス候補'}};if(state.commanderLevel!=null)out.hqlv=state.commanderLevel;candidate.ships.forEach((s,i)=>{const items={};for(const x of candidate.equipment.find(x=>x.shipId===s.id)?.items||[]){items[x.slot]={id:x.masterId};if(x.stars!=null)items[x.slot].rf=x.stars;if(x.proficiency!=null)items[x.slot].mas=x.proficiency;}out.f1[`s${i+1}`]={id:s.masterId,lv:s.level,items};});return out;}
export function policyOptions(){return POLICIES;}
