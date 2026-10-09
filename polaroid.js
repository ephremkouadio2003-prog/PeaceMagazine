/**
 * Peace Magazine — Carrousel « polaroïds sur un fil »
 *
 * Portage en JavaScript natif du composant React fourni. Les tirages sont
 * accrochés par une pince à un fil qui pend ; on tire le fil (ou on utilise
 * les flèches) et ils glissent dessus en se balançant à la vitesse qu'on leur
 * donne, puis reviennent se poser avec un léger dépassement. Au repos ils
 * oscillent encore un peu, comme dans un souffle d'air.
 */

(function () {
    'use strict';

    // ===== physique =====

    function clamp(v, a, b) {
        return Math.min(b, Math.max(a, v));
    }

    /** Hauteur d'un fil qui pend de `sag` entre (0, y0) et (w, y0), au point x. */
    function stringY(x, w, y0, sag) {
        const t = clamp(x / w, 0, 1);
        return y0 + 4 * sag * t * (1 - t);
    }

    /** Un pas de ressort critiquement amorti vers la cible. */
    function springStep(x, v, target, dt, k) {
        k = k || 70;
        const c = 2 * Math.sqrt(k);
        const nv = v + (k * (target - x) - c * v) * dt;
        return [x + nv * dt, nv];
    }

    /**
     * Un pas de balancement. `lineVel` est la vitesse des tirages à l'écran
     * (px/s, positif = vers la droite) : le tirage traîne derrière le
     * mouvement, la gravité le rappelle, et le frottement l'amortit.
     */
    function swingStep(a, w, lineVel, dt, gain) {
        const nw = w + (-38 * a - 4.2 * w + lineVel * 0.0034 * gain) * dt;
        return [clamp(a + nw * dt, -0.6, 0.6), nw];
    }

    /** Indice du tirage le plus proche du centre pour un décalage donné. */
    function nearestAt(off, spacing, n) {
        return clamp(Math.round(off / spacing), 0, Math.max(0, n - 1));
    }

    function pad2(n) {
        return n < 10 ? '0' + n : String(n);
    }

    // ===== carrousel =====

    class PolaroidLine {
        constructor(root) {
            this.root = root;
            this.cards = Array.from(root.querySelectorAll('.pl-card'));
            this.n = this.cards.length;
            if (!this.n) {
                return;
            }

            this.path = root.querySelector('#plString');
            this.captionEl = root.querySelector('#plCaption');
            this.numEl = root.querySelector('#plNum');
            this.liveEl = root.querySelector('#plLive');

            this.sag = 46;
            this.swing = 1;
            this.autoplayDelay = 5000;
            this.cardWidth = 260;

            this.size = { w: 1200, h: 700, cw: this.cardWidth };
            this.spacing = 0;

            // État de la simulation, écrit directement dans le DOM à chaque image.
            this.off = 0;
            this.vel = 0;
            this.target = 0;
            this.a = new Array(this.n).fill(0);   // angle de chaque tirage
            this.av = new Array(this.n).fill(0);  // vitesse angulaire

            this.active = 0;
            this.drag = null;
            this.lastTouch = 0;
            this.raf = null;
            this.visible = true;
            this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            const total = root.querySelector('#plTotal');
            if (total) {
                total.textContent = pad2(this.n);
            }

            root.polaroid = this;   // utile pour le débogage et les tests
            this.bind();
            this.measure();
            this.updateCaption();
            this.start();
        }

        measure() {
            const r = this.root.getBoundingClientRect();
            const cw = Math.round(Math.max(140, Math.min(this.cardWidth, r.width * 0.42, r.height * 0.42)));
            this.size = { w: r.width, h: r.height, cw: cw };
            this.root.style.setProperty('--pl-cw', cw + 'px');

            const spacing = cw * 1.08;
            if (spacing === this.spacing) {
                return;   // même géométrie : surtout ne pas toucher au mouvement en cours
            }
            this.spacing = spacing;
            // L'espacement a changé : on replace le fil sur le tirage actif.
            this.target = this.active * spacing;
            this.off = this.target;
            this.vel = 0;
        }

        goTo(i) {
            this.target = clamp(i, 0, this.n - 1) * this.spacing;
            this.wake();
        }

        /** Relance la boucle si elle s'était arrêtée (hors écran, onglet caché…). */
        wake() {
            if (!this.raf) {
                this.visible = true;
                this.prev = performance.now();
                this.raf = requestAnimationFrame(this.frame);
            }
        }

        step(dir) {
            this.lastTouch = performance.now();
            this.goTo(clamp(this.active + dir, 0, this.n - 1));
        }

        frame(now) {
            this.raf = null;
            if (!this.visible) {
                return;
            }
            try {
                this.tick(now);
            } catch (err) {
                // Une exception ne doit pas tuer l'animation en silence.
                this.lastError = err;
                console.error('Carrousel polaroïd :', err);
            }
            this.raf = requestAnimationFrame(this.frame);
        }

        tick(now) {
            // Le pas de temps doit rester strictement positif : une horloge qui
            // recule (onglet réveillé, temps virtuel) donnerait un dt nul ou
            // négatif, et le ressort n'avancerait jamais.
            const dt = Math.max(0.001, Math.min(0.033, (now - this.prev) / 1000));
            this.prev = now;

            const w = this.size.w;
            const h = this.size.h;
            const cw = this.size.cw;
            const y0 = Math.max(40, h * 0.2);

            let lineVel;
            const d = this.drag;
            if (d && d.moved) {
                lineVel = d.v * 1000;
            } else {
                const before = this.off;
                const r = springStep(this.off, this.vel, this.target, dt);
                this.off = r[0];
                this.vel = r[1];
                lineVel = -(this.off - before) / Math.max(dt, 1e-3);
            }

            const gain = this.reduced ? 0 : this.swing;
            const near = nearestAt(this.off, this.spacing, this.n);

            for (let i = 0; i < this.n; i++) {
                const el = this.cards[i];
                const x = w / 2 + i * this.spacing - this.off;

                if (x < -cw * 1.5 || x > w + cw * 1.5) {
                    el.style.visibility = 'hidden';
                    continue;
                }
                el.style.visibility = 'visible';

                const s = swingStep(this.a[i], this.av[i], lineVel, dt, gain);
                let a = s[0];
                this.av[i] = s[1];
                if (gain) {
                    a += Math.sin(now / 1300 + i * 1.7) * 0.0009 * gain;
                }
                this.a[i] = a;

                const y = stringY(x, w, y0, this.sag) - 6;
                el.style.transform = 'translate(' + (x - cw / 2).toFixed(1) + 'px,' + y.toFixed(1) +
                    'px) rotate(' + a.toFixed(4) + 'rad)';
                el.style.zIndex = String(i === near ? this.n + 1 : this.n - Math.abs(i - near));
                el.setAttribute('data-on', i === near ? '1' : '0');
            }

            if (this.path) {
                this.path.setAttribute('d',
                    'M0 ' + y0 + ' Q' + w / 2 + ' ' + (y0 + 2 * this.sag) + ' ' + w + ' ' + y0);
            }

            if (near !== this.active) {
                this.active = near;
                this.updateCaption();
            }
        }

        updateCaption() {
            const card = this.cards[this.active];
            if (!card) {
                return;
            }
            const title = card.dataset.title || '';
            const caption = card.dataset.caption || '';
            if (this.captionEl) {
                this.captionEl.innerHTML =
                    '<span class="pl-title"></span><span class="pl-sub"></span>';
                this.captionEl.querySelector('.pl-title').textContent = title;
                this.captionEl.querySelector('.pl-sub').textContent = caption;
                // relance l'animation d'apparition
                this.captionEl.classList.remove('is-in');
                void this.captionEl.offsetWidth;
                this.captionEl.classList.add('is-in');
            }
            if (this.numEl) {
                this.numEl.textContent = pad2(this.active + 1);
            }
            if (this.liveEl) {
                this.liveEl.textContent = (this.active + 1) + ' sur ' + this.n + ' : ' + title;
            }
        }

        start() {
            this.frame = this.frame.bind(this);
            this.prev = performance.now();

            if ('IntersectionObserver' in window) {
                new IntersectionObserver((entries) => {
                    this.visible = entries[0].isIntersecting;
                    if (this.visible && !this.raf) {
                        this.prev = performance.now();
                        this.raf = requestAnimationFrame(this.frame);
                    }
                }).observe(this.root);
            }
            this.raf = requestAnimationFrame(this.frame);

            if (this.autoplayDelay && this.n > 1) {
                setInterval(() => {
                    if (document.hidden || this.drag ||
                        performance.now() - this.lastTouch < this.autoplayDelay) {
                        return;
                    }
                    this.goTo(this.active >= this.n - 1 ? 0 : this.active + 1);
                }, this.autoplayDelay);
            }
        }

        bind() {
            const root = this.root;

            if ('ResizeObserver' in window) {
                new ResizeObserver(() => this.measure()).observe(root);
            } else {
                window.addEventListener('resize', () => this.measure());
            }

            root.addEventListener('pointerdown', (e) => {
                if (e.target.closest('.pl-bar')) {
                    return;
                }
                this.lastTouch = performance.now();
                this.drag = {
                    id: e.pointerId, x: e.clientX, off: this.off,
                    lx: e.clientX, lt: e.timeStamp, v: 0, moved: false
                };
            });

            root.addEventListener('pointermove', (e) => {
                const d = this.drag;
                if (!d || d.id !== e.pointerId) {
                    return;
                }
                const dx = e.clientX - d.x;
                if (!d.moved) {
                    if (Math.abs(dx) <= 5) {
                        return;
                    }
                    d.moved = true;
                    root.setAttribute('data-drag', '1');
                    root.setPointerCapture(e.pointerId);
                }
                const dt = Math.max(1, e.timeStamp - d.lt);
                d.v = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.v;
                d.lx = e.clientX;
                d.lt = e.timeStamp;

                const max = (this.n - 1) * this.spacing;
                let off = d.off - dx;
                // Au-delà des extrémités, le fil résiste au lieu de céder.
                if (off < 0) {
                    off *= 0.35;
                } else if (off > max) {
                    off = max + (off - max) * 0.35;
                }
                this.off = off;
            });

            const release = (e) => {
                const d = this.drag;
                this.drag = null;
                this.lastTouch = performance.now();
                if (!d || d.id !== e.pointerId) {
                    return;
                }
                root.setAttribute('data-drag', '0');
                if (d.moved) {
                    this.vel = -d.v * 1000;
                    // Le lancer porte : on vise le tirage où le fil s'arrêterait.
                    this.goTo(nearestAt(this.off - d.v * 180, this.spacing, this.n));
                    return;
                }
                const card = e.target.closest('[data-i]');
                if (card) {
                    this.goTo(Number(card.getAttribute('data-i')));
                }
            };
            root.addEventListener('pointerup', release);
            root.addEventListener('pointercancel', release);

            root.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') {
                    this.step(1);
                } else if (e.key === 'ArrowLeft') {
                    this.step(-1);
                } else {
                    return;
                }
                e.preventDefault();
            });

            const prev = root.querySelector('#plPrev');
            const next = root.querySelector('#plNext');
            if (prev) {
                prev.addEventListener('click', () => this.step(-1));
            }
            if (next) {
                next.addEventListener('click', () => this.step(1));
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.pl-root').forEach(root => new PolaroidLine(root));
    });
})();
