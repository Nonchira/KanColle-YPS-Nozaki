import test from 'node:test';
import assert from 'node:assert/strict';
import {demoData} from '../demo.js';
import {expeditionWorkspace} from '../expedition-ui.js';
import {normalize,emptyState,reduce} from '../core.js';

test('expedition master keeps route, duration, requirements text and reward IDs',()=>{
  const at='2026-09-08T00:00:00Z';
  const ev=normalize('/api_start2/getData',{api_result:1,api_data:{api_mst_mission:[{api_id:5,api_name:'海上護衛任務',api_disp_no:'5',api_maparea_id:1,api_deck_num:4,api_time:90,api_details:'条件',api_sample_fleet:[3,2,2,2],api_win_item1:[1,2],api_win_item2:[3]}]}},at,'mission-master');
  const m=reduce(emptyState(),ev).state.missionMaster[5];
  assert.equal(m.mapArea,1);assert.equal(m.durationMin,90);assert.equal(m.deckNum,4);assert.deepEqual(m.sampleFleet,[3,2,2,2]);assert.deepEqual(m.winItem2,[3]);
});
test('expedition view exposes current fleet comparison without changing canonical state',()=>{
  const {state}=demoData(),before=JSON.stringify(state),html=expeditionWorkspace(state,'5');
  assert.match(html,/遠征ジェネレーター/);assert.match(html,/海上護衛任務/);assert.match(html,/第二艦隊/);assert.match(html,/ドラム缶|大発系|条件/);assert.equal(JSON.stringify(state),before);
});
