/**
 * Peace Magazine — Lecteur flipbook
 *
 * Feuilletage réaliste : la page qui tourne est redessinée sur un canvas,
 * découpée en fines bandes verticales projetées sur un cylindre. Chaque
 * bande a son propre angle, sa propre perspective et son propre ombrage,
 * ce qui donne la courbure souple du papier plutôt qu'un simple pivot.
 * La page suit le doigt ou la souris ; on peut relâcher à mi-course.
 *
 * Double page (pages numérotées à partir de 1) :
 *   planche 0 → [ — , 1 ]   (la couverture, seule à droite)
 *   planche k → [ 2k , 2k+1 ]
 */

class FlipbookViewer {
    constructor() {
        this.pagesDir = '';
        this.totalPages = 0;
        this.images = new Map();   // pageNum -> Promise<HTMLImageElement>
        this.spread = 0;
        this.modal = null;
        this.isFullscreen = false;
        this.isTurning = false;
        this.double = true;
        this.pageRatio = 1.414;
        this.pageWidth = 0;
        this.pageHeight = 0;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.cache = new Map();
        this.cacheLimit = 16;
        this.turnState = null;
        this.turnRaf = null;
        this.pointer = null;

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    // ===== Chargement =====

    /**
     * Ouvre un magazine composé de pages images.
     * @param {string} dir   dossier des pages (ex. "assets/magazines/nuella")
     * @param {number} count nombre de pages
     * @param {string} title titre affiché
     */
    async loadPages(dir, count, title = 'Magazine') {
        try {
            this.showLoadingModal(title);
            this.pagesDir = dir.replace(/\/+$/, '');
            this.totalPages = count;
            this.spread = 0;
            this.cache.clear();
            this.images.clear();

            // Les proportions viennent de la première page.
            const first = await this.loadImage(1);
            this.pageRatio = first.naturalHeight / first.naturalWidth;

            this.buildViewer();
            this.layout();
            await this.showSpread(0);
            this.bindControls();
        } catch (error) {
            console.error('Erreur lors du chargement du magazine:', error);
            this.showError("Impossible de charger le magazine. Vérifiez votre connexion et réessayez.");
        }
    }

    pageUrl(pageNum) {
        return `${this.pagesDir}/${String(pageNum).padStart(3, '0')}.webp`;
    }

    loadImage(pageNum) {
        if (this.images.has(pageNum)) {
            return this.images.get(pageNum);
        }
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Page ${pageNum} introuvable`));
            img.src = this.pageUrl(pageNum);
        });
        this.images.set(pageNum, promise);
        return promise;
    }

    // ===== Structure =====

    showLoadingModal(title) {
        const modal = document.createElement('div');
        modal.id = 'flipbook-modal';
        modal.className = 'flipbook-modal';
        modal.innerHTML = `
            <div class="flipbook-container">
                <div class="flipbook-header">
                    <h2 class="flipbook-title"></h2>
                    <button class="flipbook-close" aria-label="Fermer le magazine">&times;</button>
                </div>
                <div class="flipbook-content">
                    <div class="flipbook-loading">
                        <span class="loading-spinner big" aria-hidden="true"></span>
                        <p>Chargement du magazine…</p>
                    </div>
                </div>
            </div>
        `;
        modal.querySelector('.flipbook-title').textContent = title;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        this.modal = modal;

        modal.querySelector('.flipbook-close').addEventListener('click', () => this.close());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
        document.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('resize', this.onResize);
    }

    buildViewer() {
        const content = this.modal.querySelector('.flipbook-content');
        content.innerHTML = `
            <div class="fb-stage">
                <div class="fb-book">
                    <div class="fb-side fb-left"><canvas></canvas></div>
                    <div class="fb-side fb-right"><canvas></canvas></div>
                    <canvas class="fb-turn" hidden></canvas>
                    <span class="fb-hint">Glissez la page pour feuilleter</span>
                </div>
            </div>
            <div class="flipbook-controls">
                <button class="flipbook-btn flipbook-prev" aria-label="Page précédente">&lsaquo;</button>
                <div class="flipbook-page-info">
                    <span class="current-page">1</span> / <span class="total-pages">${this.totalPages}</span>
                </div>
                <button class="flipbook-btn flipbook-next" aria-label="Page suivante">&rsaquo;</button>
                <button class="flipbook-btn flipbook-fullscreen" aria-label="Plein écran">
                    <svg class="icon" aria-hidden="true"><use href="#i-expand"></use></svg>
                </button>
            </div>
        `;

        this.stage = content.querySelector('.fb-stage');
        this.book = content.querySelector('.fb-book');
        this.leftSlot = content.querySelector('.fb-left canvas');
        this.rightSlot = content.querySelector('.fb-right canvas');
        this.turnCanvas = content.querySelector('.fb-turn');
        this.turnCtx = this.turnCanvas.getContext('2d');
    }

    // ===== Géométrie des planches =====

    get maxSpread() {
        return this.double ? Math.floor(this.totalPages / 2) : this.totalPages - 1;
    }

    leftPageOf(spread) {
        if (!this.double) {
            return null;
        }
        return spread === 0 ? null : 2 * spread;
    }

    rightPageOf(spread) {
        if (!this.double) {
            return spread + 1;
        }
        const page = 2 * spread + 1;
        return page <= this.totalPages ? page : null;
    }

    layout() {
        if (!this.stage) {
            return;
        }
        this.double = window.innerWidth >= 820;
        this.book.classList.toggle('is-single', !this.double);

        const availW = this.stage.clientWidth;
        const availH = this.stage.clientHeight;
        if (!availW || !availH) {
            return;
        }

        const columns = this.double ? 2 : 1;
        const pageW = Math.max(120, Math.floor(Math.min(availW / columns, availH / this.pageRatio)));
        this.pageWidth = pageW;
        this.pageHeight = Math.round(pageW * this.pageRatio);

        const bookW = pageW * columns;
        this.book.style.width = `${bookW}px`;
        this.book.style.height = `${this.pageHeight}px`;

        this.turnCanvas.width = Math.round(bookW * this.dpr);
        this.turnCanvas.height = Math.round(this.pageHeight * this.dpr);
        this.turnCanvas.style.width = `${bookW}px`;
        this.turnCanvas.style.height = `${this.pageHeight}px`;
    }

    // ===== Rendu des pages =====

    async getPageCanvas(pageNum) {
        if (!pageNum || pageNum < 1 || pageNum > this.totalPages) {
            return null;
        }
        const key = `${pageNum}@${this.pageWidth}`;
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const img = await this.loadImage(pageNum);
        const width = Math.round(this.pageWidth * this.dpr);
        const height = Math.round(width * (img.naturalHeight / img.naturalWidth));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        if (this.cache.size >= this.cacheLimit) {
            this.cache.delete(this.cache.keys().next().value);
        }
        this.cache.set(key, canvas);
        return canvas;
    }

    async paintSlot(slot, pageNum) {
        if (!slot) {
            return;
        }
        const source = await this.getPageCanvas(pageNum);
        const parent = slot.parentElement;
        if (!source) {
            slot.width = slot.height = 0;
            if (parent) {
                parent.classList.add('is-blank');
            }
            return;
        }
        if (parent) {
            parent.classList.remove('is-blank');
        }
        slot.width = source.width;
        slot.height = source.height;
        slot.getContext('2d').drawImage(source, 0, 0);
    }

    async showSpread(spread) {
        this.spread = spread;
        await Promise.all([
            this.paintSlot(this.leftSlot, this.leftPageOf(spread)),
            this.paintSlot(this.rightSlot, this.rightPageOf(spread))
        ]);
        this.updateInfo();
        this.preload(spread);
    }

    preload(spread) {
        [spread + 1, spread - 1].forEach(s => {
            if (s < 0 || s > this.maxSpread) {
                return;
            }
            [this.leftPageOf(s), this.rightPageOf(s)].forEach(page => {
                if (page) {
                    this.getPageCanvas(page).catch(() => {});
                }
            });
        });
    }

    updateInfo() {
        if (!this.modal) {
            return;
        }
        const current = this.modal.querySelector('.current-page');
        if (current) {
            const left = this.leftPageOf(this.spread);
            const right = this.rightPageOf(this.spread);
            current.textContent = left && right ? `${left}–${right}` : String(left || right || 1);
        }
        const prev = this.modal.querySelector('.flipbook-prev');
        const next = this.modal.querySelector('.flipbook-next');
        if (prev) {
            prev.disabled = this.spread === 0;
            prev.classList.toggle('disabled', this.spread === 0);
        }
        if (next) {
            const atEnd = this.spread >= this.maxSpread;
            next.disabled = atEnd;
            next.classList.toggle('disabled', atEnd);
        }
    }

    // ===== Feuilletage : rendu de la page courbée =====

    /**
     * Projette un point de la page sur le cylindre de pliage.
     * `r` est la distance au pli (la reliure), de 0 au bord extérieur.
     */
    projectPoint(r, angle) {
        const W = this.pageWidth;
        const D = 6 * W;                       // distance de l'œil
        const BEND = 0.30;                     // amplitude de la courbure
        // Chaque bande a son propre angle : c'est ce décalage progressif qui
        // bombe le papier au lieu de le faire pivoter d'un bloc. Le facteur
        // sin(angle) annule la courbure quand la page est à plat.
        const aEff = angle + BEND * Math.sin((Math.PI * r) / W) * Math.sin(angle);
        const cos = Math.cos(aEff);
        const z = r * Math.sin(aEff);
        const scale = D / (D - z);
        return { x: r * cos * scale, scale, cos };
    }

    drawTurnFrame(progress) {
        const st = this.turnState;
        if (!st || !this.turnCtx) {
            return;
        }

        const W = this.pageWidth;
        const H = this.pageHeight;
        const bookW = this.double ? W * 2 : W;
        const ctx = this.turnCtx;

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, bookW, H);

        const angle = Math.max(0.0008, Math.min(Math.PI - 0.0008, progress * Math.PI));
        const spineX = this.double ? W : 0;
        const dir = st.dirSign;

        // Ombre projetée par la page soulevée sur celle du dessous
        const shadow = Math.sin(angle) * 0.26;
        if (shadow > 0.01) {
            const reach = W * 0.6;
            const grad = ctx.createLinearGradient(spineX, 0, spineX + dir * reach, 0);
            grad.addColorStop(0, `rgba(0,0,0,${shadow})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(dir > 0 ? spineX : spineX - reach, 0, reach, H);
        }

        // Les bords sont calculés une fois pour toutes : chaque bande part
        // exactement où la précédente s'arrête.
        const STRIPS = 150;
        const edges = new Array(STRIPS + 1);
        for (let i = 0; i <= STRIPS; i++) {
            const r = (i / STRIPS) * W;
            const p = this.projectPoint(r, angle);
            const height = H * p.scale;
            edges[i] = {
                x: spineX + dir * p.x,
                cos: p.cos,
                top: (H - height) / 2,
                bottom: (H + height) / 2
            };
        }

        // Au-delà de 90° la bande montre son verso : on regroupe les bandes
        // par face, ce qui donne au plus deux segments contigus. Une page à
        // demi tournée montre donc naturellement recto *et* verso.
        const segments = [];
        for (let i = 0; i < STRIPS; i++) {
            const front = (edges[i].cos + edges[i + 1].cos) / 2 >= 0;
            const last = segments[segments.length - 1];
            if (last && last.front === front) {
                last.i1 = i + 1;
            } else {
                segments.push({ front, i0: i, i1: i + 1 });
            }
        }

        const snap = (v) => Math.round(v * this.dpr) / this.dpr;
        const minWidth = 1 / this.dpr;

        for (const seg of segments) {
            const source = seg.front ? st.front : st.back;
            if (!source) {
                continue;
            }
            const mirror = seg.front ? st.frontMirror : st.backMirror;
            const srcScale = source.width / W;

            // --- le papier ---
            for (let i = seg.i0; i < seg.i1; i++) {
                const r0 = (i / STRIPS) * W;
                const r1 = ((i + 1) / STRIPS) * W;
                const e0 = edges[i];
                const e1 = edges[i + 1];

                const xa = snap(Math.min(e0.x, e1.x));
                const xb = snap(Math.max(e0.x, e1.x));
                const top = (e0.top + e1.top) / 2;
                const height = (e0.bottom + e1.bottom) / 2 - top;

                ctx.drawImage(
                    source,
                    (mirror ? W - r1 : r0) * srcScale, 0, (r1 - r0) * srcScale, source.height,
                    xa, top, Math.max(xb - xa, minWidth), height
                );
            }

            // --- l'ombrage ---
            // Un seul dégradé détouré sur la face, plutôt qu'un rectangle par
            // bande : dans la zone comprimée les bandes font moins d'un pixel
            // et leurs rectangles semi-transparents se mélangeaient en moiré.
            const xStart = edges[seg.i0].x;
            const xEnd = edges[seg.i1].x;
            if (Math.abs(xEnd - xStart) < 0.5) {
                continue;
            }

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(edges[seg.i0].x, edges[seg.i0].top);
            for (let i = seg.i0 + 1; i <= seg.i1; i++) {
                ctx.lineTo(edges[i].x, edges[i].top);
            }
            for (let i = seg.i1; i >= seg.i0; i--) {
                ctx.lineTo(edges[i].x, edges[i].bottom);
            }
            ctx.closePath();
            ctx.clip();

            const grad = ctx.createLinearGradient(xStart, 0, xEnd, 0);
            const STOPS = 24;
            for (let s = 0; s <= STOPS; s++) {
                const idx = Math.round(seg.i0 + ((seg.i1 - seg.i0) * s) / STOPS);
                // Le papier s'assombrit à mesure qu'il se présente de profil.
                const shade = (1 - Math.abs(edges[idx].cos)) * 0.46;
                grad.addColorStop(s / STOPS, `rgba(22,17,10,${shade.toFixed(4)})`);
            }
            ctx.fillStyle = grad;
            ctx.fillRect(Math.min(xStart, xEnd) - 1, 0, Math.abs(xEnd - xStart) + 2, H);
            ctx.restore();
        }
    }

    // ===== Feuilletage : enchaînement =====

    /** Prépare les images et la moitié révélée. Renvoie false si impossible. */
    async beginTurn(direction) {
        if (this.isTurning || !this.totalPages) {
            return false;
        }
        const target = this.spread + direction;
        if (target < 0 || target > this.maxSpread) {
            return false;
        }
        this.isTurning = true;
        this.hideHint();

        const state = { direction, target, dirSign: 1, from: 0, to: 1 };

        if (this.double) {
            state.dirSign = direction > 0 ? 1 : -1;
            if (direction > 0) {
                // La page de droite se rabat vers la gauche.
                state.front = await this.getPageCanvas(this.rightPageOf(this.spread));
                state.back = await this.getPageCanvas(this.leftPageOf(target));
                state.frontMirror = false;
                state.backMirror = true;
                await this.paintSlot(this.rightSlot, this.rightPageOf(target));
            } else {
                // La page de gauche se rabat vers la droite.
                state.front = await this.getPageCanvas(this.leftPageOf(this.spread));
                state.back = await this.getPageCanvas(this.rightPageOf(target));
                state.frontMirror = true;
                state.backMirror = false;
                await this.paintSlot(this.leftSlot, this.leftPageOf(target));
            }
        } else if (direction > 0) {
            state.front = await this.getPageCanvas(this.rightPageOf(this.spread));
            state.back = await this.getPageCanvas(this.rightPageOf(target));
            state.frontMirror = false;
            state.backMirror = true;
            await this.paintSlot(this.rightSlot, this.rightPageOf(target));
        } else {
            // La page précédente revient de la gauche : on joue le pli à l'envers.
            state.from = 1;
            state.to = 0;
            state.front = await this.getPageCanvas(this.rightPageOf(target));
            state.back = await this.getPageCanvas(this.rightPageOf(this.spread));
            state.frontMirror = false;
            state.backMirror = true;
        }

        this.turnState = state;
        this.turnCanvas.hidden = false;
        this.drawTurnFrame(state.from);
        return true;
    }

    animateTurn(from, to, duration = 780) {
        return new Promise(resolve => {
            if (this.turnRaf !== null) {
                cancelAnimationFrame(this.turnRaf);
            }
            const start = performance.now();
            let done = false;

            const finish = () => {
                if (done) {
                    return;
                }
                done = true;
                clearTimeout(watchdog);
                if (this.turnRaf !== null) {
                    cancelAnimationFrame(this.turnRaf);
                    this.turnRaf = null;
                }
                this.drawTurnFrame(to);
                resolve();
            };

            // requestAnimationFrame est gelé dans un onglet en arrière-plan :
            // sans ce garde-fou, une page tournée puis quittée laisserait le
            // lecteur verrouillé sur `isTurning`.
            const watchdog = setTimeout(finish, duration + 600);

            const step = (now) => {
                if (done) {
                    return;
                }
                const t = Math.min(1, (now - start) / duration);
                const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                this.drawTurnFrame(from + (to - from) * eased);
                if (t < 1) {
                    this.turnRaf = requestAnimationFrame(step);
                } else {
                    this.turnRaf = null;
                    finish();
                }
            };
            this.turnRaf = requestAnimationFrame(step);
        });
    }

    async commitTurn() {
        const st = this.turnState;
        if (!st) {
            return;
        }
        if (this.double) {
            if (st.direction > 0) {
                await this.paintSlot(this.leftSlot, this.leftPageOf(st.target));
            } else {
                await this.paintSlot(this.rightSlot, this.rightPageOf(st.target));
            }
        } else {
            await this.paintSlot(this.rightSlot, this.rightPageOf(st.target));
        }
        this.spread = st.target;
        this.turnCanvas.hidden = true;
        this.turnState = null;
        this.isTurning = false;
        this.updateInfo();
        this.preload(this.spread);
    }

    async cancelTurn() {
        this.turnCanvas.hidden = true;
        this.turnState = null;
        const spread = this.spread;
        this.isTurning = false;
        await this.showSpread(spread);
    }

    async turn(direction) {
        const ready = await this.beginTurn(direction);
        if (!ready) {
            return;
        }
        const st = this.turnState;
        await this.animateTurn(st.from, st.to);
        await this.commitTurn();
    }

    nextPage() { return this.turn(1); }
    previousPage() { return this.turn(-1); }

    // ===== Contrôles =====

    hideHint() {
        const hint = this.modal && this.modal.querySelector('.fb-hint');
        if (hint) {
            hint.classList.add('is-gone');
        }
    }

    bindControls() {
        const modal = this.modal;
        const prev = modal.querySelector('.flipbook-prev');
        const next = modal.querySelector('.flipbook-next');
        const full = modal.querySelector('.flipbook-fullscreen');

        if (prev) {
            prev.addEventListener('click', () => this.previousPage());
        }
        if (next) {
            next.addEventListener('click', () => this.nextPage());
        }
        if (full) {
            full.addEventListener('click', () => this.toggleFullscreen());
        }

        // Glissement : la page suit le pointeur, on peut relâcher à mi-course.
        this.book.addEventListener('pointerdown', (event) => {
            if (this.isTurning) {
                return;
            }
            this.book.setPointerCapture(event.pointerId);
            const rect = this.book.getBoundingClientRect();
            this.pointer = {
                id: event.pointerId,
                x0: event.clientX,
                onRight: event.clientX - rect.left > rect.width / 2,
                active: false,
                ready: null,
                ok: false,
                progress: 0
            };
        });

        this.book.addEventListener('pointermove', (event) => {
            const ptr = this.pointer;
            if (!ptr || ptr.id !== event.pointerId) {
                return;
            }
            const dx = event.clientX - ptr.x0;

            if (!ptr.active) {
                if (Math.abs(dx) < 10) {
                    return;
                }
                ptr.active = true;
                ptr.dir = dx < 0 ? 1 : -1;
                this.book.classList.add('is-dragging');
                ptr.ready = this.beginTurn(ptr.dir).then(ok => { ptr.ok = ok; });
                return;
            }
            if (!ptr.ok || !this.turnState) {
                return;
            }
            const st = this.turnState;
            const p = Math.max(0, Math.min(1, Math.abs(dx) / this.pageWidth));
            ptr.progress = p;
            this.drawTurnFrame(st.from + (st.to - st.from) * p);
        });

        const release = async (event) => {
            const ptr = this.pointer;
            if (!ptr || ptr.id !== event.pointerId) {
                return;
            }
            this.pointer = null;
            this.book.classList.remove('is-dragging');

            if (!ptr.active) {
                // Simple clic : on tourne selon la moitié touchée.
                if (ptr.onRight) {
                    this.nextPage();
                } else {
                    this.previousPage();
                }
                return;
            }

            if (ptr.ready) {
                await ptr.ready;
            }
            if (!ptr.ok || !this.turnState) {
                return;
            }
            const st = this.turnState;
            const current = st.from + (st.to - st.from) * ptr.progress;
            if (ptr.progress > 0.35) {
                await this.animateTurn(current, st.to, 420);
                await this.commitTurn();
            } else {
                await this.animateTurn(current, st.from, 320);
                await this.cancelTurn();
            }
        };

        this.book.addEventListener('pointerup', release);
        this.book.addEventListener('pointercancel', release);
    }

    onKeyDown(event) {
        if (!this.modal || !document.body.contains(this.modal)) {
            return;
        }
        if (event.key === 'Escape') {
            this.close();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.previousPage();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.nextPage();
        }
    }

    onResize() {
        if (!this.modal || !this.stage) {
            return;
        }
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(() => {
            const wasDouble = this.double;
            this.layout();
            this.cache.clear();
            if (wasDouble !== this.double) {
                this.spread = 0;   // la numérotation des planches change
            }
            this.showSpread(this.spread);
        }, 200);
    }

    toggleFullscreen() {
        if (!this.modal) {
            return;
        }
        const target = this.modal;
        if (!this.isFullscreen) {
            const request = target.requestFullscreen || target.webkitRequestFullscreen;
            if (request) {
                request.call(target).catch(() => {});
            }
            this.modal.classList.add('fullscreen');
            this.isFullscreen = true;
        } else {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit && document.fullscreenElement) {
                exit.call(document).catch(() => {});
            }
            this.modal.classList.remove('fullscreen');
            this.isFullscreen = false;
        }
        setTimeout(() => {
            this.layout();
            this.cache.clear();
            this.showSpread(this.spread);
        }, 150);
    }

    showError(message) {
        if (!this.modal) {
            return;
        }
        const content = this.modal.querySelector('.flipbook-content');
        content.innerHTML = `
            <div class="flipbook-error">
                <h3>Erreur</h3>
                <p></p>
                <button type="button" class="flipbook-btn fb-error-close">Fermer</button>
            </div>
        `;
        content.querySelector('p').textContent = message;
        content.querySelector('.fb-error-close').addEventListener('click', () => this.close());
    }

    close() {
        document.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('resize', this.onResize);
        if (this.turnRaf !== null) {
            cancelAnimationFrame(this.turnRaf);
            this.turnRaf = null;
        }
        if (this.isFullscreen && document.fullscreenElement) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) {
                exit.call(document).catch(() => {});
            }
        }
        if (this.modal && document.body.contains(this.modal)) {
            document.body.removeChild(this.modal);
        }
        document.body.style.overflow = '';
        this.modal = null;
        this.turnState = null;
        this.pointer = null;
        this.isFullscreen = false;
        this.isTurning = false;
        this.cache.clear();
        this.images.clear();
    }
}

window.flipbookViewer = new FlipbookViewer();
