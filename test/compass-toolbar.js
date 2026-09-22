// Synthetic browser fixture only. No game page or external site is opened.
window.chrome={runtime:{getManifest:()=>({version_name:'local test',homepage_url:'#help'}),sendMessage:message=>{document.getElementById('result').textContent=message.openCompass?'PASS: 艦隊コンパスを開くメッセージ':'Unexpected message';},onMessage:{addListener:()=>{}}}};
window.open=(url)=>{document.getElementById('result').textContent='PASS: 外部遷移を模擬 '+url;};
