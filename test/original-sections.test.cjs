const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('original lists survive map views without mutating received data or duplicating IDs',()=>{
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../original-sections.js'),'utf8'),context);
  const merge=context.ypsOriginalSections;
  const port=['資源',['YPS_material','100'],'艦娘',['YPS_ship_list','ship'],'装備',['YPS_lockeditem_list','item'],'改修',['YPS_kai_list','kai']];
  const original=JSON.stringify(port);
  merge(port)[1].shift(); // Markdown parser consumes nested arrays.
  assert.equal(JSON.stringify(port),original);
  for(let i=0;i<2;i++){
    const result=merge(['海域選択',['map','1-5']]);
    for(const id of ['YPS_material','YPS_ship_list','YPS_lockeditem_list','YPS_kai_list'])assert.equal(result.filter(x=>Array.isArray(x)&&x[0]===id).length,1);
  }
  merge(['資源',['YPS_material','200']]);
  const latest=merge(['艦隊']);
  assert.equal(latest.find(x=>Array.isArray(x)&&x[0]==='YPS_material')[1],'200');
  assert.ok(!latest.some(x=>Array.isArray(x)&&x[0]==='YPS_ship_list'));
});
