/* Local notebook correction only. No game API or page-script execution. */
(() => {
    'use strict';
    let panel=null;
    const element=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
    const request=body=>new Promise((resolve,reject)=>chrome.runtime.sendMessage({type:'yps-senka-local',...body},r=>{
        if(chrome.runtime.lastError||!r) reject(Error('F12を開き、母港データを受信してから開き直してください。'));
        else if(!r.ok) reject(Error(r.error));else resolve(r);
    }));
    document.addEventListener('click',async event=>{
        if(event.target.id!=='YPS_senka_edit') return;
        if(panel) panel.remove();
        panel=element('dialog');
        const currentPanel=panel,close=element('button','閉じる'),title=element('h3','戦果手動入力'),status=element('p','読み込み中…'),body=element('div');
        status.style.whiteSpace='pre-line';
        close.onclick=()=>{currentPanel.close();currentPanel.remove();if(panel===currentPanel)panel=null;};
        panel.append(title,close,status,body); document.body.append(panel);panel.showModal();
        try {
            const data=await request({op:'get'});
            status.textContent=data.ready?'未記録分を含めた現在の合計回数を入力してください。\n「手」で表示され、同じ期間・このアカウントだけに保存します。': '母港へ戻り、F12で受信してから開き直してください。';
            const select=element('select');
            for(const q of data.quests) {const o=element('option',q.title);o.value=q.id;select.append(o);}
            select.value='anchorage';body.append(select);
            const rows=element('div'),preview=element('p');body.append(rows,preview);
            function render(snapshot) {
                const q=snapshot.quests.find(q=>q.id===select.value);rows.replaceChildren();preview.textContent=q.line;
                for(const m of q.maps) {
                    const row=element('p'),label=element('label',m.map+'　'),input=element('input'),save=element('button','保存'),reset=element('button','補正解除');
                    input.type='number';input.min='0';input.max=String(m.max);input.value=String(m.count);input.style.width='4em';label.append(input,document.createTextNode(' / '+m.max+'　'));
                    save.disabled=reset.disabled=!snapshot.ready;
                    async function update(count) {
                        save.disabled=reset.disabled=true;
                        try {
                            const next=await request({op:'set',token:snapshot.token,quest:q.id,map:m.map,count});
                            Object.assign(data,next);render(next);status.textContent=next.warning||'保存しました。下の表示へ反映済みです。\n海域選択を開き直すと通常の戦果メモにも反映されます。';
                        } catch(error) {status.textContent=error.message;save.disabled=reset.disabled=false;}
                    }
                    save.onclick=()=>{if(input.reportValidity()&&input.value!=='')update(Number(input.value));};reset.onclick=()=>update(null);
                    row.append(label,save,reset);rows.append(row);
                }
            }
            select.onchange=()=>render(data);render(data);
        } catch(error) {status.textContent=error.message;}
    });
})();
