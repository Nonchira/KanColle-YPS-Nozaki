import test from 'node:test';
import assert from 'node:assert/strict';
import {receivedBody} from '../received-body.js';
const options={timeoutMs:20,retryDelayMs:0};
test('captured callback and Promise bodies, including UTF-8 Base64',async()=>{
  const content='svdata={"api_data":"艦これ"}';
  assert.equal(await receivedBody({getContent:cb=>cb(content,'')},options),content);
  assert.equal(await receivedBody({getContent:()=>Promise.resolve({content,encoding:''})},options),content);
  assert.equal(await receivedBody({getContent:cb=>cb(Buffer.from(content).toString('base64'),'base64')},options),content);
});
test('empty captured content is read again once; no indefinite wait',async()=>{
  let calls=0;assert.equal(await receivedBody({getContent:cb=>cb(++calls===1?'':'ok','')},options),'ok');assert.equal(calls,2);
  calls=0;await assert.rejects(receivedBody({getContent:cb=>{calls++;cb('','');}},options),/空/);assert.equal(calls,2);
  await assert.rejects(receivedBody({getContent(){}},options),/タイムアウト/);
  await assert.rejects(receivedBody({getContent:cb=>cb('!!','base64')},options),/復号/);
});
