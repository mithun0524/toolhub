/* Blocking script: stamps the theme before first paint so there is no flash. */
(function () {
  var saved = null;
  try { saved = localStorage.getItem('nought:theme'); } catch (e) {}
  var dark = saved ? saved === 'dark'
    : !window.matchMedia || !window.matchMedia('(prefers-color-scheme: light)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  if (!navigator.onLine) document.documentElement.classList.add('is-offline');
})();
