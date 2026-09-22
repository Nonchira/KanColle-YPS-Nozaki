import test from 'node:test';
import assert from 'node:assert/strict';
import {deferredSync} from '../deferred-sync.js';
const tick=()=>new Promise(r=>setTimeout(r,15));
test('burst coalesces; changes during slow derived work cause one follow-up',async()=>{
 let calls=0,release;const queue=deferredSync(async()=>{calls++;if(calls===1)await new Promise(r=>release=r);},()=>{},1);
 for(let i=0;i<30;i++)queue();
 await tick();assert.equal(calls,1);
 for(let i=0;i<30;i++)queue();
 await tick();assert.equal(calls,1);
 release();await tick();assert.equal(calls,2);
});
test('derived failure does not poison future runs',async()=>{
 let calls=0,errors=0;const queue=deferredSync(async()=>{if(++calls===1)throw Error('test');},()=>errors++,1);
 queue();await tick();queue();await tick();assert.equal(calls,2);assert.equal(errors,1);
});
