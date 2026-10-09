// ============================================================================
// TRACKING SLOT — the only place GA4 and Meta Pixel live.
// Installing: fill the two IDs below. Removing: empty them, or delete this file and its
// <script> tag in the layout. Nothing in layout, content or animation code depends on it.
// Next.js equivalent: components/Analytics.tsx, rendered once in app/layout.tsx, with
// the IDs read from the CMS "Réglages du site" document or from environment variables.
// Tie the loading to the visitor's consent before going live.
// ============================================================================
(function () {
    var GA4_ID = '';          // e.g. 'G-XXXXXXXXXX'
    var META_PIXEL_ID = '';   // e.g. '123456789012345'

    if (GA4_ID) {
        var ga = document.createElement('script');
        ga.async = true;
        ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
        document.head.appendChild(ga);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', GA4_ID);
    }

    if (META_PIXEL_ID) {
        /* eslint-disable */
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
            t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
        window.fbq('init', META_PIXEL_ID);
        window.fbq('track', 'PageView');
    }
})();
