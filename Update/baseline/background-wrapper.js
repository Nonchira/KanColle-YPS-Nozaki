// "service worker (無効)" の回避策として try/catch で囲む.
// @see https://github.com/furyutei/twMediaDownloader/issues/89#issuecomment-1261621380
// @see https://groups.google.com/a/chromium.org/g/chromium-extensions/c/lLb3EJzjw0o
try {
	importScripts('background.js');
} catch (e) {
	console.error(e);
}
