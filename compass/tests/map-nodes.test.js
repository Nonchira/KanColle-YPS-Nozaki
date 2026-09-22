import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeLetter} from '../map-nodes.js';
test('destination labels use map-specific API edges, including converging routes',()=>{
  for(const [area,map,node,label] of [[1,5,11,'J'],[1,5,12,'J'],[7,1,11,'K'],[7,2,7,'G'],[7,2,15,'M'],[6,1,1,'B'],[6,1,2,'A'],[6,2,1,'B'],[3,5,1,'B'],[5,6,14,'C2']])
    assert.equal(nodeLetter({area,map,node}),label);
});
test('unknown locations and non-letter starting points are not guessed',()=>{
  for(const location of [null,{}, {area:1,map:5,node:999},{area:99,map:1,node:1},{area:5,map:6,node:35}])
    assert.equal(nodeLetter(location),null);
});
