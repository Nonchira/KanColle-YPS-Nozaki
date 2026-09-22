/* Passive ranking quest notebook. No request parameters, game writes or cloud sync.
 * Rules and provenance: SENKA-README.md. Counts are observed lower bounds.
 */
(function (root) {
    'use strict';
    const maps = (names, count = 1, rank = 'S') => names.split(' ').map(map => ({ map, count, rank }));
    const catalog = [
        { id: 'z-front', title: '戦果拡張任務！「Z作戦」前段作戦', points: 350, period: 'quarter', fleet: 'first', maps: [...maps('2-4 6-1 6-3', 1, 'A'), ...maps('6-4')] },
        { id: 'z-back', title: '戦果拡張任務！「Z作戦」後段作戦', points: 400, period: 'quarter', fleet: 'first', maps: maps('7-2-2 5-5 6-2 6-5') },
        { id: 'anchorage', title: '泊地周辺海域の安全確保を徹底せよ！', points: 300, period: 'quarter', maps: maps('1-5 7-1 7-2-1 7-2-2', 3) },
        { id: 'mikawa', title: '新編成「三川艦隊」、鉄底海峡に突入せよ！', points: 200, period: 'quarter', fleet: 'mikawa', maps: maps('5-1 5-3 5-4') },
        { id: 'patrol', title: '南西諸島方面「海上警備行動」発令！', points: 80, period: 'quarter', fleet: 'patrol', maps: maps('1-4 2-1 2-2 2-3') },
        { id: 'west', title: '発令！「西方海域作戦」', points: 330, period: 'quarter', maps: maps('4-1 4-2 4-3 4-4 4-5') },
        { id: 'six', title: '拡張「六水戦」、最前線へ！', points: 390, period: 'quarter', fleet: 'six', maps: maps('5-1 5-4 6-4 6-5') },
        { id: 'al', title: 'AL作戦', points: 480, period: 'year', fleet: 'al', maps: maps('3-1 3-3 3-4 3-5') },
        { id: 'carrier', title: '機動部隊決戦', points: 600, period: 'year', fleet: 'carrier', maps: [...maps('5-2 5-5', 2), ...maps('6-4', 2, 'A'), ...maps('6-5', 2)] },
        { id: 'okinoshima', title: '沖ノ島海域迎撃戦', points: 0, period: 'quarter', maps: maps('2-4', 2) }
    ];
    const eo = [[15,75],[16,75],[25,100],[35,150],[75,170],[45,180],[55,200],[65,250]];
    // Confirmed same-quarter prerequisites. Do not infer across different cycles.
    const prerequisites = { 'z-back': 'z-front', west: 'patrol' };
    const norm = text => String(text || '').normalize('NFKC').replace(/[\s!！「」『』、,]/g, '');
    const copy = value => JSON.parse(JSON.stringify(value));
    function period(kind, time) {
        const d = new Date(time + (kind === 'month' ? 9 : 4) * 3600000);
        let year = d.getUTCFullYear(), month = d.getUTCMonth();
        if (kind === 'year') { if (month < 5) year--; month = 5; }
        if (kind === 'quarter') { month = Math.floor((month - 2) / 3) * 3 + 2; if (month < 0) { month += 12; year--; } }
        return year + '-' + String(month + 1).padStart(2, '0');
    }
    function deadline(kind, time) {
        const [y,m] = period(kind,time).split('-').map(Number);
        const delta = kind === 'quarter' ? 3 : kind === 'year' ? 12 : 1;
        return new Date(Date.UTC(y, m - 1 + delta, 1, kind === 'month' ? 0 : 5)).toISOString().slice(0,16).replace('T',' ') + ' JST';
    }
    function fleetOK(rule, fleetId, ships) {
        if (!rule) return true;
        if (rule === 'first') return fleetId === 1;
        if (!ships || !ships.length || ships.some(s => !s || !s.api_name || !s.api_stype)) return false;
        const count = fn => ships.filter(fn).length;
        const base = s => s.api_name.replace(/改.*$/, '');
        if (rule === 'al') return count(s => s.api_stype === 7) >= 2;
        if (rule === 'carrier') return [7,11,18].includes(ships[0].api_stype);
        if (rule === 'patrol') return count(s => [3,4,21,7].includes(s.api_stype)) >= 1 && count(s => [2,1].includes(s.api_stype)) >= 3;
        if (rule === 'mikawa') return new Set(ships.filter(s => ['鳥海','青葉','衣笠','古鷹','加古','天龍','夕張'].includes(base(s))).map(base)).size >= 4;
        if (rule === 'six') return /^夕張改二(?:特|丁)?$/.test(ships[0].api_name) &&
            (ships.some(s => s.api_name === '由良改二') || new Set(ships.filter(s => ['睦月','如月','弥生','卯月','菊月','望月'].includes(base(s))).map(base)).size >= 2);
        return false;
    }
    class Tracker {
        constructor(storage) {
            this.storage = storage; this.account = null; this.data = { quests: {}, eo: {} };
            this.master = {}; this.ships = {}; this.decks = {}; this.live = {}; this.sortie = null;
            this.storageError = false;
        }
        gap() { this.live = {}; this.sortie = null; this.decks = {}; }
        selectAccount(id) {
            if (!id || String(id) === this.account) return;
            this.account = String(id); this.gap(); this.ships = {}; this.data = { quests: {}, eo: {} };
            try {
                const stored = JSON.parse(this.storage && this.storage.getItem('yps_senka_v1_' + this.account) || 'null');
                if (stored && stored.version === 1 && stored.quests && stored.eo) this.data = stored;
            } catch (_) { this.storageError = true; }
        }
        save() {
            if (!this.account || !this.storage) return;
            try { this.storage.setItem('yps_senka_v1_' + this.account, JSON.stringify({ ...this.data, version: 1 })); }
            catch (_) { this.storageError = true; }
        }
        entry(q, time) {
            const key = period(q.period, time);
            let e = this.data.quests[q.id];
            if (!e || e.period !== key) e = this.data.quests[q.id] = { period: key, counts: {}, complete: false };
            return e;
        }
        completion(q,time) {
            const e=this.data.quests[q.id];
            if(e?.period===period(q.period,time) && e.complete) return 'server';
            for(const [child,parent] of Object.entries(prerequisites)) {
                const c=this.data.quests[child],cq=catalog.find(x=>x.id===child);
                if(parent!==q.id || !c?.seen || c.period!==period(cq.period,time) || cq.period!==q.period) continue;
                // A newer direct non-complete response overrides inferred completion.
                if(e?.period===period(q.period,time) && [1,2].includes(e.lastState) && e.seen>=c.seen) continue;
                return child;
            }
            return null;
        }
        progress(q,m,time) {
            const e=this.data.quests[q.id];
            if(e?.period!==period(q.period,time)) return 0;
            const observed=Number(e.counts[m.map]||0), manual=e.manual?.[m.map];
            return Math.min(m.count,manual ? manual.count+Math.max(0,observed-manual.observed) : observed);
        }
        setManual(id,map,count,time=Date.now()) {
            const q=catalog.find(x=>x.id===id),m=q?.maps.find(x=>x.map===map);
            if(!this.account || this.sortie) throw Error('母港へ戻ってから補正してください。');
            if(!m || (count!==null && (!Number.isInteger(count)||count<0||count>m.count))) throw Error('任務・海域・回数を確認してください。');
            const e=this.entry(q,time);
            if(!e.manual) e.manual={};
            (e.corrections||(e.corrections=[])).push({map,at:time,previous:e.manual[map]||null,count,source:'user'});
            if(count===null) delete e.manual[map];
            else e.manual[map]={count,observed:Number(e.counts[map]||0),at:time,source:'user'};
            this.save();
        }
        receive(api, json, time = Date.now()) {
            if (!json || json.api_result !== 1) return;
            const d = json.api_data || {};
            if (api === '/api_start2/getData') {
                this.account = null; this.data = { quests: {}, eo: {} }; this.gap(); this.ships = {};
                this.master = Object.fromEntries((d.api_mst_ship || []).map(s => [s.api_id,s]));
                return;
            }
            if (api === '/api_port/port' || api === '/api_get_member/basic') this.selectAccount((d.api_basic || d).api_member_id);
            if (!this.account) return;
            if (api === '/api_port/port') { this.sortie = null; this.ships = {}; this.decks = {}; }
            const shipData = d.api_ship_data || (api === '/api_port/port' ? d.api_ship : null) || (api === '/api_get_member/ship2' ? d : null);
            if (Array.isArray(shipData)) for (const s of shipData) this.ships[s.api_id] = s;
            const deckData = d.api_deck_port || d.api_deck_data || (api === '/api_get_member/deck' ? d : null);
            if (Array.isArray(deckData)) for (const f of deckData) this.decks[f.api_id] = copy(f);
            // These responses do not identify changed slots. Wait for a received deck snapshot.
            if (/^\/api_req_hensei\//.test(api) || /^\/api_req_kaisou\/(remodeling|powerup)$/.test(api) || api === '/api_req_kousyou/destroyship') this.decks = {};
            // Claiming another completed quest cannot stop an accepted quest.
            // Starting a quest also leaves already accepted quests intact.
            if(api==='/api_req_quest/start') for(const id of Object.keys(this.live)) {
                if(this.live[id].state===1) delete this.live[id];
            }
            if(api==='/api_req_quest/stop') for(const id of Object.keys(this.live)) {
                if(this.live[id].state===2) delete this.live[id];
            }
            if (api === '/api_get_member/questlist' && Array.isArray(d.api_list)) {
                for (const raw of d.api_list) {
                    if (!raw || typeof raw !== 'object') continue;
                    const q = catalog.find(q => norm(q.title) === norm(raw.api_title));
                    if (!q || ![1,2,3].includes(raw.api_state)) continue;
                    const e = this.entry(q,time);
                    // A newer non-complete server state contradicts a persisted completion.
                    if (raw.api_state !== 3 && e.complete) {
                        (e.conflicts || (e.conflicts = [])).push({ at: time, previous: { complete: true, counts: copy(e.counts) }, receivedState: raw.api_state });
                        e.complete = false; e.counts = {};
                    }
                    if (raw.api_state === 3) e.complete = true;
                    e.seen = time;
                    e.lastState = raw.api_state;
                    this.live[q.id] = { state: raw.api_state, period: e.period, day: Math.floor((time + 4*3600000)/86400000) };
                }
                this.save();
            }
            if (api === '/api_get_member/mapinfo' && Array.isArray(d.api_map_info)) {
                for (const m of d.api_map_info) if (eo.some(([id]) => id === m.api_id)) {
                    this.data.eo[m.api_id] = { period: period('month',time), seen: time,
                        cleared: m.api_cleared === 1 && !m.api_required_defeat_count,
                        known: [0,1].includes(m.api_cleared), gauge: m.api_gauge_num || null,
                        done: m.api_defeat_count ?? null, required: m.api_required_defeat_count ?? null };
                }
                this.save();
            }
            if (api === '/api_req_map/start') {
                this.sortie = { active: {}, battle: null, node: null, blocked: false, area: null, mapNo: null };
                for (const q of catalog) if (this.liveState(q,time) === 2) this.sortie.active[q.id] = period(q.period,time);
            }
            if ((api === '/api_req_map/start' || api === '/api_req_map/next') && this.sortie) {
                // A next-node response can omit the area/map already received at start.
                // Never carry location across a new sortie, port return or observation gap.
                const s = this.sortie;
                if (Number.isInteger(d.api_maparea_id) && d.api_maparea_id > 0) s.area = d.api_maparea_id;
                if (Number.isInteger(d.api_mapinfo_no) && d.api_mapinfo_no > 0) s.mapNo = d.api_mapinfo_no;
                s.node = d.api_event_id === 5 && s.area && s.mapNo && Number.isInteger(d.api_no)
                    ? { map: s.area + '-' + s.mapNo, no: d.api_no } : null;
                this.sortie.battle = null;
            }
            if (/goback_port$/.test(api) && this.sortie) this.sortie.blocked = true;
            const combat = /^\/api_req_(sortie|battle_midnight|combined_battle)\//.test(api);
            if (combat && this.sortie && this.sortie.node && !/battleresult$/.test(api)) {
                const id = Number(d.api_deck_id ?? d.api_dock_id);
                if (d.api_escape_idx?.length || d.api_escape_idx_combined?.length) this.sortie.blocked = true;
                if (id > 0 && !this.sortie.battle) {
                    const ids = this.decks[id]?.api_ship?.filter(n => n > 0);
                    this.sortie.battle = { id, ships: ids?.map(n => this.master[this.ships[n]?.api_ship_id] || null) };
                }
            }
            if (combat && /battleresult$/.test(api) && this.sortie) {
                const s = this.sortie, node = s.node, battle = s.battle;
                s.node = null; s.battle = null; // one result per node; duplicates cannot add twice
                if (!node || !battle || s.blocked) return;
                let map = node.map;
                if (map === '7-2') map = node.no === 7 ? '7-2-1' : node.no === 15 ? '7-2-2' : null;
                for (const q of catalog) {
                    const rule = q.maps.find(m => m.map === map);
                    if (!rule || s.active[q.id] !== period(q.period,time) || this.liveState(q,time) !== 2 || !fleetOK(q.fleet,battle.id,battle.ships)) continue;
                    if (d.api_win_rank !== 'S' && !(rule.rank === 'A' && d.api_win_rank === 'A')) continue;
                    const e = this.entry(q,time);
                    const before=this.progress(q,rule,time);
                    e.counts[map] = Math.min(rule.count, (e.counts[map] || 0) + 1);
                    if(e.manual?.[map]) { e.manual[map].count=Math.min(rule.count,before+1); e.manual[map].observed=e.counts[map]; }
                    e.updated = time;
                }
                this.save();
            }
        }
        liveState(q,time) {
            const live = this.live[q.id];
            return live && live.period === period(q.period,time) && live.day === Math.floor((time + 4*3600000)/86400000) ? live.state : null;
        }
        lines(time = Date.now()) {
            const result = ['### 戦果メモ'];
            const unconfirmed = catalog.filter(q => this.liveState(q,time) === null &&
                !this.completion(q,time));
            if (unconfirmed.length) result.push(
                '計数保留：「未確認」の任務は加算できません。出撃前に「遂行中」の対象任務ページを開き、',
                '戦果メモが「受注中」になったことを確認してください。');
            for (const [kind,title] of [['quarter','クォータリー戦果任務'],['year','イヤーリー戦果任務（6月更新）']]) {
                result.push('### ' + title + '　更新: ' + deadline(kind,time));
                result.push('\t==状態\t==任務\t==戦果\t==海域ごとの達成');
                for (const q of catalog.filter(q => q.period === kind && q.points > 0)) result.push(this.questLine(q,time));
            }
            result.push('### EO（月次）　更新: ' + deadline('month',time));
            result.push('\t==状態\t==海域\t==戦果\t==ゲージ（最終受信）');
            for (const [id,points] of eo) {
                const e = this.data.eo[id], fresh = e?.period === period('month',time) && e.known;
                const state = !fresh ? '未確認' : e.cleared ? '攻略済み' : '未クリア';
                const gauge = fresh && !e.cleared && e.required > 0 && e.done !== null ? (e.gauge ? e.gauge + 'ゲージ目 ' : '') + e.done + '/' + e.required : '—';
                result.push('\t' + state + '\t' + Math.floor(id/10) + '-' + id%10 + '\t' + points + '\t' + gauge);
            }
            result.push('### 関連任務（戦果報酬なし）','\t==状態\t==任務\t==戦果\t==海域ごとの達成');
            result.push(this.questLine(catalog.find(q => q.id === 'okinoshima'),time));
            result.push('✓＝達成確認、?＝未確認、手＝手動補正。n/必要数はこのPCの記録です（以前の進捗は不明）。');
            result.push('未記録分は「戦果手動入力」で修正できます。受注状態は任務一覧で確認し、未表示を未受注とは判定しません。');
            if (!this.account) result.push('母港データの受信待ちです。');
            if (this.storageError) result.push('戦果メモの保存を利用できません。', '再起動後は記録を引き継げない可能性があります。');
            result.push('---');
            return result;
        }
        questLine(q,time) {
            const shared=this.sharedStates?.[norm(q.title)], useShared=shared?.period===period(q.period,time);
            const e = this.data.quests[q.id], fresh = e?.period === period(q.period,time), complete = useShared ? ['complete','achieved'].includes(shared.status) : this.completion(q,time);
            const state = useShared ? (({complete:'完了',achieved:'達成・報酬待ち',active:'受注中',unaccepted:'未受注',locked:'未出現'})[shared.status]||'未確認') + (shared.stale&&!complete?'（再確認待ち）':'') : complete ? '攻略済み' : ({1:'未受注',2:'受注中'})[this.liveState(q,time)] || '未確認';
            const progress = q.maps.map(m => {
                const n = this.progress(q,m,time),manual=fresh && e.manual?.[m.map];
                return ((complete || n >= m.count) ? '✓' + m.map : '?' + m.map + (m.count > 1 || n ? '(' + n + '/' + m.count + ')' : '')) + (!complete && manual?'［手］':'');
            }).join(' ／ ');
            return '\t' + state + '\t' + q.title + '\t' + q.points + '\t' + progress;
        }
    }
    const api = { Tracker, catalog, eo, period, deadline, fleetOK };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.YpsSenka = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
