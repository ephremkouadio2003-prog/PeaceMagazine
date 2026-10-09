/**
 * Peace Magazine — Carrousel « coverflow »
 *
 * Portage en JavaScript natif du composant React fourni : une position
 * fractionnaire unique (`pos`) pilote tout, les cartes sont peintes
 * directement dans le DOM (pas de re-rendu à 60 images/seconde), et la
 * boucle se fait en repliant la distance sur le plus court chemin de
 * l'anneau — sans cloner ni réordonner le moindre nœud.
 */

(function () {
    'use strict';

    const DEFAULTS = {
        rotate: 44,       // degrés d'inclinaison de la première voisine
        depth: 0.6,       // recul, en fraction de la largeur de carte
        falloff: 0.56,    // exposant sur la distance : l'inclinaison s'atténue
        fade: 0.1,        // opacité perdue par cran d'éloignement
        gap: 0.05,        // espace entre cartes, en fraction de leur largeur
        loop: true
    };

    class Coverflow {
        constructor(root) {
            this.root = root;
            this.frame = root.querySelector('.coverflow-frame');
            this.cards = Array.from(root.querySelectorAll('.coverflow-card'));
            this.count = this.cards.length;
            if (!this.frame || !this.count) {
                return;
            }

            this.opts = Object.assign({}, DEFAULTS);
            this.pos = 0;        // position fractionnaire courante
            this.target = 0;     // position visée par l'animation en cours
            this.width = 0;      // largeur mesurée d'une carte
            this.raf = null;
            this.drag = null;
            this.selected = 0;

            this.captionEl = root.querySelector('.coverflow-caption');
            this.dotsEl = root.querySelector('.coverflow-dots');

            this.bindEvents();
            this.buildDots();
            this.measure();
            this.setSelected(0);

            if ('ResizeObserver' in window) {
                this.observer = new ResizeObserver(() => this.measure());
                this.observer.observe(this.frame);
            } else {
                window.addEventListener('resize', () => this.measure());
            }

            // Les images arrivent après coup : on remesure à leur chargement.
            this.cards.forEach(card => {
                const img = card.querySelector('img');
                if (img && !img.complete) {
                    img.addEventListener('load', () => this.measure(), { once: true });
                }
            });
        }

        /** Carte entière la plus proche, repliée dans 0..count-1. */
        indexAt(pos) {
            return ((Math.round(pos) % this.count) + this.count) % this.count;
        }

        measure() {
            const first = this.cards[0];
            if (!first) {
                return;
            }
            this.width = first.offsetWidth;
            this.paint();
        }

        paint() {
            const width = this.width;
            if (!width) {
                return;
            }
            const { gap, loop, falloff, rotate, depth, fade } = this.opts;
            const pitch = width * (1 + gap);
            const pos = this.pos;
            const count = this.count;

            this.cards.forEach((card, index) => {
                let offset = index - pos;
                if (loop) {
                    // Repli sur le plus court chemin : c'est tout le mécanisme
                    // de bouclage, sans nœud cloné.
                    offset = ((offset % count) + count) % count;
                    if (offset > count / 2) {
                        offset -= count;
                    }
                }

                const distance = Math.abs(offset);
                // L'inclinaison et le recul s'atténuent avec l'éloignement :
                // une rampe linéaire refermerait la deuxième carte.
                const ramp = Math.pow(distance, falloff);
                // Bridée avant le profil pur, pour qu'une carte lointaine ne
                // tourne jamais complètement le dos.
                const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

                card.style.transform =
                    `translateX(calc(-50% + ${offset * pitch}px)) ` +
                    `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

                // Une carte est téléportée à l'autre bout de l'anneau à
                // exactement un demi-tour : elle doit être invisible à ce
                // moment-là, sinon le saut se voit.
                const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
                card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
                card.style.zIndex = String(100 - Math.round(distance));
                card.classList.toggle('is-active', Math.round(distance) === 0);
                card.setAttribute('aria-hidden', distance > 0.5 ? 'true' : 'false');
            });
        }

        settle(target) {
            if (this.raf !== null) {
                cancelAnimationFrame(this.raf);
            }
            this.target = target;
            this.setSelected(this.indexAt(target));

            const step = () => {
                const remaining = target - this.pos;
                if (Math.abs(remaining) < 0.0004) {
                    this.pos = target;
                    this.paint();
                    this.raf = null;
                    return;
                }
                // Amortissement exponentiel (pas un ressort : pas de rebond).
                this.pos += remaining * 0.16;
                this.paint();
                this.raf = requestAnimationFrame(step);
            };
            this.raf = requestAnimationFrame(step);
        }

        clamp(pos) {
            return this.opts.loop ? pos : Math.max(0, Math.min(this.count - 1, pos));
        }

        goTo(index) {
            // Prendre le plus court chemin plutôt que dérouler tout l'anneau.
            const target = this.opts.loop
                ? index + Math.round((this.target - index) / this.count) * this.count
                : index;
            this.settle(this.clamp(target));
        }

        nudge(by) {
            // On part de `target` et non de `pos` : sinon une touche pressée
            // en plein vol serait avalée par l'arrondi.
            this.settle(this.clamp(Math.round(this.target) + by));
        }

        setSelected(index) {
            if (index === this.selected && this.captionBuilt) {
                return;
            }
            this.selected = index;
            this.captionBuilt = true;
            this.updateCaption();
            this.updateDots();
        }

        updateCaption() {
            if (!this.captionEl) {
                return;
            }
            const card = this.cards[this.selected];
            if (!card) {
                return;
            }
            const title = card.dataset.title || '';
            const subtitle = card.dataset.subtitle || '';
            const hasPages = !!card.dataset.pages;

            // On construit les nœuds plutôt que d'assembler du HTML : le texte
            // passe par textContent, donc rien à échapper et rien à injecter.
            this.captionEl.textContent = '';

            const titreEl = document.createElement('p');
            titreEl.className = 'coverflow-title';
            titreEl.textContent = title;
            this.captionEl.appendChild(titreEl);

            if (subtitle) {
                const sousTitre = document.createElement('p');
                sousTitre.className = 'coverflow-subtitle';
                sousTitre.textContent = subtitle;
                this.captionEl.appendChild(sousTitre);
            }

            if (hasPages) {
                const openBtn = document.createElement('button');
                openBtn.type = 'button';
                openBtn.className = 'btn-outline coverflow-open';
                openBtn.textContent = 'Feuilleter le magazine';
                openBtn.addEventListener('click', () => this.openActive());
                this.captionEl.appendChild(openBtn);
            } else {
                const note = document.createElement('span');
                note.className = 'coverflow-nopdf';
                note.textContent = 'Aperçu sur demande';
                this.captionEl.appendChild(note);
            }

            // Relance l'animation d'apparition de la légende
            this.captionEl.classList.remove('is-in');
            void this.captionEl.offsetWidth;
            this.captionEl.classList.add('is-in');
        }

        buildDots() {
            if (!this.dotsEl) {
                return;
            }
            this.dotsEl.innerHTML = '';
            this.cards.forEach((card, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'coverflow-dot';
                dot.setAttribute('aria-label', `Aller au magazine ${index + 1}`);
                dot.addEventListener('click', () => this.goTo(index));
                this.dotsEl.appendChild(dot);
            });
        }

        updateDots() {
            if (!this.dotsEl) {
                return;
            }
            Array.from(this.dotsEl.children).forEach((dot, index) => {
                const current = index === this.selected;
                dot.classList.toggle('is-active', current);
                dot.setAttribute('aria-current', current ? 'true' : 'false');
            });
        }

        openActive() {
            const card = this.cards[this.selected];
            if (!card || !window.flipbookViewer) {
                return;
            }
            const dir = card.dataset.pages;
            const count = parseInt(card.dataset.pageCount, 10);
            if (!dir || !count) {
                return;
            }
            window.flipbookViewer.loadPages(dir, count, card.dataset.title || 'Magazine');
        }

        bindEvents() {
            const frame = this.frame;

            frame.addEventListener('pointerdown', (event) => {
                if (this.raf !== null) {
                    cancelAnimationFrame(this.raf);
                    this.raf = null;
                }
                frame.setPointerCapture(event.pointerId);
                this.target = this.pos;
                this.drag = {
                    id: event.pointerId,
                    x: event.clientX,
                    startX: event.clientX,
                    pos: this.pos,
                    v: 0,
                    t: performance.now(),
                    moved: false
                };
            });

            frame.addEventListener('pointermove', (event) => {
                const drag = this.drag;
                if (!drag || drag.id !== event.pointerId) {
                    return;
                }
                const pitch = this.width * (1 + this.opts.gap);
                if (!pitch) {
                    return;
                }
                if (Math.abs(event.clientX - drag.startX) > 6) {
                    drag.moved = true;
                    frame.classList.add('is-dragging');
                }

                const now = performance.now();
                const previous = this.pos;
                this.pos = this.clamp(drag.pos - (event.clientX - drag.x) / pitch);
                // Cartes par seconde, pour le lancer.
                drag.v = ((this.pos - previous) / Math.max(now - drag.t, 1)) * 1000;
                drag.t = now;

                this.setSelected(this.indexAt(this.pos));
                this.paint();
            });

            const endDrag = (event) => {
                const drag = this.drag;
                if (!drag || drag.id !== event.pointerId) {
                    return;
                }
                this.drag = null;
                frame.classList.remove('is-dragging');
                // Un geste rapide porte, mais jamais au-delà de deux cartes.
                const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
                this.settle(this.clamp(Math.round(this.pos + carried)));
            };

            frame.addEventListener('pointerup', endDrag);
            frame.addEventListener('pointercancel', endDrag);

            frame.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    this.nudge(-1);
                } else if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    this.nudge(1);
                } else if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.openActive();
                }
            });

            // Clic : la carte centrale s'ouvre, une carte latérale se centre.
            this.cards.forEach((card, index) => {
                card.addEventListener('click', () => {
                    if (this.drag && this.drag.moved) {
                        return;
                    }
                    if (index === this.selected) {
                        this.openActive();
                    } else {
                        this.goTo(index);
                    }
                });
            });

            const prev = this.root.querySelector('.coverflow-prev');
            const next = this.root.querySelector('.coverflow-next');
            if (prev) {
                prev.addEventListener('click', () => this.nudge(-1));
            }
            if (next) {
                next.addEventListener('click', () => this.nudge(1));
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.coverflow').forEach(root => new Coverflow(root));
    });
})();
