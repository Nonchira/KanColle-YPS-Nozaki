import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../core.js';
import {equipmentWorkspace} from '../workspace-ui.js';

test('equipment total includes all improvements and stays beside the name, including focused links',()=>{
  const state=emptyState();
  state.equipmentMaster={1:{name:'テスト砲'},2:{name:'別装備'}};
  state.equipment=Object.fromEntries(Array.from({length:23},(_,i)=>[i+100,{id:i+100,masterId:1,stars:i%11,locked:true}]));
  state.equipment[200]={id:200,masterId:2,stars:0};
  for(const focus of [undefined,100]){
    const html=equipmentWorkspace(state,focus);
    const firstCell=html.match(/<tbody><tr><td>(.*?)<\/td>/s)?.[1];
    assert.match(firstCell,/テスト砲/);
    assert.match(firstCell,/aria-label="合計 23個">×23<\/strong>/);
    assert.match(firstCell,/<details class="equipment-ids">/);
    assert.match(firstCell,/#122/);
    if(focus)assert.doesNotMatch(html,/別装備/);
  }
});
