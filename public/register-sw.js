// Registers the service worker only outside iframe + Lovable preview hosts.
(function () {
  try {
    var inIframe = window.self !== window.top;
    var host = window.location.hostname;
    var isPreview =
      host.indexOf("lovableproject.com") !== -1 ||
      host.indexOf("lovable.app") !== -1 ||
      host.indexOf("id-preview--") !== -1 ||
      host === "localhost" ||
      host === "127.0.0.1";
    if (inIframe || isPreview) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (rs) {
          rs.forEach(function (r) { r.unregister(); });
        });
      }
      return;
    }
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").catch(function () {});
      });
    }
  } catch (e) {}
})();
