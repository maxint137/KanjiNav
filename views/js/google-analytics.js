// https://davidsimpson.me/2014/05/27/add-googles-universal-analytics-tracking-chrome-extension/ 
(function(i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function() {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

var gaId = 'UA-91206532-' + (location.protocol === "chrome-extension:" ? '2' : '1');
ga('create', gaId, 'auto');
ga('send', 'pageview');
ga('require', 'displayfeatures');