// Site behaviour: header, and the one scroll-driven signature moment of each inner page.
// No dependency. Content never relies on this file: without it every page shows its
// final, fully drawn state. Reduced-motion users get that same final state.
(function () {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };

    // ---- Header: background once scrolled, collapsible menu on small screens ----
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    if (header) {
        var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
    if (header && toggle) {
        toggle.addEventListener('click', function () {
            var open = header.classList.toggle('nav-open');
            toggle.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && header.classList.contains('nav-open')) {
                header.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.focus();
            }
        });
    }

    // One rAF-throttled scroll loop shared by the signature moments.
    var watchers = [];
    var ticking = false;
    function run() { ticking = false; watchers.forEach(function (fn) { fn(); }); }
    function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(run); } }
    function watch(fn) {
        watchers.push(fn);
        if (watchers.length === 1) {
            window.addEventListener('scroll', request, { passive: true });
            window.addEventListener('resize', request);
        }
        fn();
    }

    // ---- Qui sommes-nous: the value chain draws itself along an infinity path ----
    var chain = document.querySelector('[data-chain]');
    if (chain && !reducedMotion) {
        var line = chain.querySelector('.chain-line');
        var head = chain.querySelector('.chain-head');
        var nodes = [].slice.call(chain.querySelectorAll('.chain-node'));
        var steps = [].slice.call(chain.querySelectorAll('.chain-step'));
        var length = line.getTotalLength();
        // Where each node and each step sits along the path (data-at, 0 to 1).
        var at = function (el) { return Number(el.getAttribute('data-at') || 0); };
        nodes.forEach(function (node) { node.classList.remove('is-on'); });
        line.style.strokeDasharray = length;
        // Pinned when the whole block fits in the screen; otherwise only the drawing
        // stays in view while the steps scroll past it.
        var inner = chain.querySelector('.chain-inner');
        var pinned = false;
        var layout = function () {
            chain.classList.remove('is-scrolly', 'is-pinned');
            pinned = inner.offsetHeight + 120 <= window.innerHeight;
            chain.classList.add('is-scrolly');
            chain.classList.toggle('is-pinned', pinned);
        };
        layout();
        window.addEventListener('resize', layout);
        watch(function () {
            var rect = chain.getBoundingClientRect();
            var progress = pinned
                ? clamp(-rect.top / Math.max(1, rect.height - window.innerHeight))
                : clamp((window.innerHeight * 0.5 - rect.top) / Math.max(1, rect.height * 0.8));
            var drawn = clamp(progress / 0.9);            // finished a little before the section ends
            line.style.strokeDashoffset = length * (1 - drawn);
            var point = line.getPointAtLength(length * drawn);
            head.setAttribute('cx', point.x);
            head.setAttribute('cy', point.y);
            nodes.concat(steps).forEach(function (el) { el.classList.toggle('is-on', drawn >= at(el) + 0.01); });
        });
    }

    // ---- Nos pôles: the index follows the pole being read ----
    var index = document.querySelector('[data-pole-index]');
    if (index && 'IntersectionObserver' in window) {
        var links = [].slice.call(index.querySelectorAll('a[href^="#"]'));
        var byId = {};
        links.forEach(function (link) { byId[link.getAttribute('href').slice(1)] = link; });
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (link) { link.classList.remove('is-current'); });
                var link = byId[entry.target.id];
                if (link) link.classList.add('is-current');
            });
        }, { rootMargin: '-35% 0px -55% 0px' });
        Object.keys(byId).forEach(function (id) {
            var target = document.getElementById(id);
            if (target) observer.observe(target);
        });
    }

    // ---- Secteurs & Approche: the method rail fills as the steps are reached ----
    var method = document.querySelector('[data-method]');
    if (method && !reducedMotion) {
        var rail = method.querySelector('.method-rail span');
        var methodSteps = [].slice.call(method.querySelectorAll('.method-step'));
        method.classList.add('is-scrolly');
        watch(function () {
            var rect = method.getBoundingClientRect();
            // 0 when the block enters the lower third of the screen, 1 when it reaches the upper third.
            var progress = clamp((window.innerHeight * 0.8 - rect.top) / (window.innerHeight * 0.5));
            if (rail) rail.style.transform = 'scaleX(' + progress + ')';
            methodSteps.forEach(function (step, i) {
                step.classList.toggle('is-on', progress >= i / methodSteps.length + 0.02);
            });
        });
    }

    // ---- Les fondateurs: portraits lean toward the pointer, accordions open smoothly ----
    var tilts = [].slice.call(document.querySelectorAll('[data-tilt]'));
    if (tilts.length && !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        tilts.forEach(function (el) {
            el.addEventListener('pointermove', function (event) {
                var rect = el.getBoundingClientRect();
                var x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
                el.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
                el.style.setProperty('--rx', ((0.5 - y) * 6).toFixed(2) + 'deg');
                el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
                el.classList.add('is-tilting');
            });
            el.addEventListener('pointerleave', function () {
                el.classList.remove('is-tilting');
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
            });
        });
    }
    [].slice.call(document.querySelectorAll('.founder-more')).forEach(function (details) {
        var body = details.querySelector('.founder-more-body');
        if (!body || reducedMotion || !body.animate) return;
        details.addEventListener('toggle', function () {
            if (!details.open) return;
            body.style.overflow = 'hidden';
            body.animate([{ height: '0px', opacity: 0 }, { height: body.scrollHeight + 'px', opacity: 1 }],
                { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = function () { body.style.overflow = ''; };
        });
    });

    // ---- Contact form (prototype): validates, then reports. The Next.js build posts
    //      the same fields to /api/contact. ----
    var form = document.querySelector('#project-form');
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var status = form.querySelector('.form-status');
            if (status) status.textContent = 'Maquette : le formulaire est valide. L’envoi sera branché sur /api/contact lors du développement.';
        });
    }
})();
