// Keep the last received original lists available in temporary map/fleet views.
// No storage writes or network requests. Values remain from the last port display.
var ypsOriginalSections = (function () {
  var cached = [];
  var ids = ['YPS_material', 'YPS_ship_list', 'YPS_lockeditem_list', 'YPS_kai_list'];
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  return function (message) {
    var result = clone(message);
    if (message.some(function (entry) { return Array.isArray(entry) && entry[0] === 'YPS_material'; })) {
      cached = [];
      message.forEach(function (entry, index) {
        if (Array.isArray(entry) && ids.indexOf(entry[0]) !== -1) {
          cached.push({heading: typeof message[index - 1] === 'string' ? message[index - 1] : entry[0], section: clone(entry)});
        }
      });
    } else {
      var missing = cached.filter(function (item) {
        return !message.some(function (entry) { return Array.isArray(entry) && entry[0] === item.section[0]; });
      });
      if (missing.length) {
        result.push('---', '## 元の一覧（直近の母港表示）');
        missing.forEach(function (item) { result.push(item.heading, clone(item.section)); });
      }
    }
    return result;
  };
})();
