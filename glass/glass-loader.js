// Decorative WebGL layer — loader. The only script a page needs to opt in:
//   <canvas id="webgl" data-glass-mode="story|contact" aria-hidden="true"></canvas>
//   <script src="/glass/glass-loader.js" defer></script>
// It waits for the page to be fully loaded, then imports the scene. It never loads it
// for reduced-motion users, data-saver or 2G connections, or browsers without WebGL 2:
// those visitors keep the static page and its poster.
(function () {
    var canvas = document.getElementById('webgl');
    if (!canvas) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var connection = navigator.connection || {};
    var slow = connection.saveData === true || /(^|-)2g$/.test(connection.effectiveType || '');
    var webgl2 = false;
    try { webgl2 = !!document.createElement('canvas').getContext('webgl2'); } catch (error) { webgl2 = false; }
    if (reducedMotion || slow || !webgl2) return;

    function start() {
        // The story rearranges the top of the page: never do that under a visitor who
        // has already scrolled into the static version.
        if (canvas.dataset.glassMode !== 'contact' && window.scrollY > window.innerHeight * 0.4) return;
        import('/glass/glass-scene.js').catch(function (error) {
            document.documentElement.classList.remove('glass-on', 'glass-ready');
            console.warn('[glass] decorative layer disabled:', error);
        });
    }
    function schedule() {
        if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 1200 });
        else window.setTimeout(start, 200);
    }
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
})();
