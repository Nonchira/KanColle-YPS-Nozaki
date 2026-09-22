chrome.runtime.onMessage.addListener(function (req, sender) {
	if (sender.id !== chrome.runtime.id) return;
	if (req.type === 'yps-senka-local') return;
	if (req.openCompass === true) {
		chrome.tabs.create({url: chrome.runtime.getURL('compass/dashboard.html')});
		return;
	}
	if (req.type === 'updated' || req.type === 'save-error' || req.type === 'quest-records-updated') return;
	chrome.tabs.query({url:[
			'https://play.games.dmm.com/game/kancolle'
		]}, function (tab) {
		if (tab[0]) chrome.tabs.sendMessage(tab[0].id, req).catch(function () {});
	});
});
