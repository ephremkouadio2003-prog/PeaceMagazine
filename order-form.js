/**
 * Peace Magazine — Commande en ligne
 *
 * Formulaire multi-étapes : les informations et photos sont envoyées à un
 * script Google Apps Script (window.ORDER_CONFIG.scriptUrl) qui crée un
 * dossier Drive par commande et une ligne dans un Google Sheet.
 * Voir GUIDE-CONFIGURATION-COMMANDES.md pour la mise en place.
 */

(function () {
    'use strict';

    const CONFIG = window.ORDER_CONFIG || {};
    const WHATSAPP = '2250767660476';
    const DRAFT_KEY = 'pm_order_draft_v1';

    const form = document.getElementById('orderForm');
    if (!form) {
        return;
    }

    const steps = Array.from(form.querySelectorAll('.order-step'));
    const navItems = Array.from(document.querySelectorAll('#orderStepsNav li'));
    const progressFill = document.getElementById('orderProgressFill');
    const statusEl = document.getElementById('orderStatus');
    const sendingPanel = document.getElementById('orderSending');
    const sendingLabel = document.getElementById('orderSendingLabel');
    const uploadFill = document.getElementById('uploadProgressFill');
    const uploadText = document.getElementById('uploadProgressText');
    const successPanel = document.getElementById('orderSuccess');

    let currentStep = 1;
    const totalSteps = steps.length;

    /** Photos sélectionnées : { file, caption, isCover, previewUrl } */
    const photos = [];

    // ===== Navigation entre étapes =====

    function showStep(n) {
        currentStep = n;
        steps.forEach(step => {
            step.classList.toggle('active', Number(step.dataset.step) === n);
        });
        navItems.forEach(item => {
            const s = Number(item.dataset.step);
            item.classList.toggle('active', s === n);
            item.classList.toggle('done', s < n);
        });
        if (progressFill) {
            progressFill.style.width = `${((n - 1) / (totalSteps - 1)) * 100}%`;
        }
        setStatus('', '');
        if (n === totalSteps) {
            renderSummary();
        }
        const box = document.querySelector('.order-box');
        if (box) {
            box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function validateStep(n) {
        const step = steps.find(s => Number(s.dataset.step) === n);
        if (!step) {
            return true;
        }

        // Champs natifs requis de l'étape
        const fields = step.querySelectorAll('input[required], select[required], textarea[required]');
        for (const field of fields) {
            if (!field.checkValidity()) {
                field.reportValidity();
                field.focus();
                return false;
            }
        }

        // Étape photos : au moins 1 photo (30 recommandé)
        if (step.querySelector('#photoGrid')) {
            if (photos.length === 0) {
                setStatus('error', 'Ajoutez au moins une photo pour continuer (30 recommandées).');
                return false;
            }
            if (photos.length < (CONFIG.minPhotos || 30)) {
                setStatus('info', `Vous avez ajouté ${photos.length} photo${photos.length > 1 ? 's' : ''} — nous recommandons ${CONFIG.minPhotos || 30} pour un magazine riche. Vous pouvez tout de même continuer.`);
            }
        }
        return true;
    }

    form.addEventListener('click', (e) => {
        if (e.target.closest('.order-next')) {
            if (validateStep(currentStep)) {
                saveDraft();
                showStep(Math.min(currentStep + 1, totalSteps));
            }
        } else if (e.target.closest('.order-prev')) {
            showStep(Math.max(currentStep - 1, 1));
        }
    });

    // ===== Brouillon (textes uniquement, jamais les photos) =====

    const DRAFT_FIELDS = ['clientName', 'clientPhone', 'clientEmail', 'celebratedName', 'occasion',
        'eventDate', 'story', 'testimonialsText', 'styleChoice', 'colorsWanted', 'styleNotes',
        'deliveryDate', 'deliveryAddress'];

    function saveDraft() {
        try {
            const draft = {};
            DRAFT_FIELDS.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    draft[id] = el.value;
                }
            });
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch (e) { /* stockage indisponible : tant pis pour le brouillon */ }
    }

    function restoreDraft() {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) {
                return;
            }
            const draft = JSON.parse(raw);
            DRAFT_FIELDS.forEach(id => {
                const el = document.getElementById(id);
                if (el && draft[id]) {
                    el.value = draft[id];
                }
            });
        } catch (e) { /* ignore */ }
    }

    function clearDraft() {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch (e) { /* ignore */ }
    }

    restoreDraft();
    form.addEventListener('change', saveDraft);

    // Une date de livraison déjà passée n'a aucun sens : on borne le calendrier.
    (function limiterDates() {
        const jour = 86400000;
        const iso = (d) => new Date(d).toISOString().slice(0, 10);
        const livraison = document.getElementById('deliveryDate');
        if (livraison) {
            livraison.min = iso(Date.now() + 3 * jour);
        }
        const evenement = document.getElementById('eventDate');
        if (evenement) {
            evenement.max = iso(Date.now() + 3 * 365 * jour);
        }
    })();

    // ===== Gestion des photos =====

    const photoDrop = document.getElementById('photoDrop');
    const photoInput = document.getElementById('photoInput');
    const photoGrid = document.getElementById('photoGrid');
    const photoCounter = document.getElementById('photoCounter');

    const MAX_PHOTOS = 80;               // même plafond que le script Google
    const MAX_PHOTO_BYTES = 12 * 1024 * 1024;   // limite acceptée par le script
    const MAX_SOURCE_BYTES = 30 * 1024 * 1024;  // à l'ajout, avant compression

    // Les photos de téléphone font 3 à 8 Mo. Envoyées telles quelles, une
    // commande de 30 photos représente plus de 150 Mo : près de vingt minutes
    // en 4G, davantage en 3G. On les réduit donc avant l'envoi — 2000 px sur
    // le grand côté suffisent largement pour une page de magazine imprimée.
    const MAX_EDGE = 2000;
    const JPEG_QUALITY = 0.82;
    const SKIP_UNDER = 600 * 1024;       // déjà assez légère : on n'y touche pas

    function addFiles(fileList) {
        const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        let rejected = 0;
        let tooBig = 0;
        let overflow = 0;
        Array.from(fileList).forEach(file => {
            if (!accepted.includes(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
                rejected += 1;
                return;
            }
            if (file.size > MAX_SOURCE_BYTES) {
                tooBig += 1;
                return;
            }
            if (photos.length >= MAX_PHOTOS) {
                overflow += 1;
                return;
            }
            photos.push({
                file: file,
                caption: '',          // légende courte, imprimée sous la photo
                text: '',             // texte libre : anecdote, souvenir…
                isCover: false,
                previewUrl: URL.createObjectURL(file)
            });
        });
        const soucis = [];
        if (rejected) {
            soucis.push(`${rejected} fichier${rejected > 1 ? 's' : ''} au mauvais format (JPEG, PNG ou HEIC)`);
        }
        if (tooBig) {
            soucis.push(`${tooBig} photo${tooBig > 1 ? 's' : ''} de plus de 30 Mo`);
        }
        if (overflow) {
            soucis.push(`${overflow} photo${overflow > 1 ? 's' : ''} au-delà du maximum de ${MAX_PHOTOS}`);
        }
        if (soucis.length) {
            setStatus('error', 'Photos ignorées : ' + soucis.join(', ') + '.');
        }
        renderPhotos();
    }

    function renderPhotos() {
        if (!photoGrid) {
            return;
        }
        photoGrid.innerHTML = '';
        photos.forEach((photo, index) => {
            const card = document.createElement('div');
            const hasText = !!photo.text.trim();
            card.className = 'photo-card' + (photo.isCover ? ' is-cover' : '') +
                (hasText ? ' has-text' : '') + (photo.textOpen ? ' is-open' : '');
            card.innerHTML = `
                <div class="photo-card-img">
                    <img alt="">
                    <button type="button" class="photo-cover-btn" data-action="cover" data-index="${index}"
                        title="Choisir comme couverture" aria-label="Choisir comme photo de couverture"
                        aria-pressed="${photo.isCover}">
                        <svg class="icon" aria-hidden="true"><use href="#i-star${photo.isCover ? '' : '-o'}"></use></svg>
                    </button>
                    <button type="button" class="photo-remove-btn" data-action="remove" data-index="${index}"
                        title="Retirer cette photo" aria-label="Retirer cette photo">
                        <svg class="icon" aria-hidden="true"><use href="#i-times"></use></svg>
                    </button>
                    ${photo.isCover ? '<span class="photo-cover-badge">Couverture</span>' : ''}
                </div>
                <input type="text" class="photo-caption-input" data-index="${index}"
                    placeholder="Légende (facultatif)" maxlength="200"
                    aria-label="Légende de la photo ${index + 1}">
                <button type="button" class="photo-text-toggle" data-action="text" data-index="${index}"
                    aria-expanded="${hasText ? 'true' : 'false'}">
                    ${hasText ? 'Modifier le texte' : '+ Ajouter un texte'}
                </button>
                <textarea class="photo-text-input" data-index="${index}" rows="4" maxlength="1500"
                    placeholder="Racontez cette photo : où, quand, avec qui, l'anecdote derrière…"
                    aria-label="Texte associé à la photo ${index + 1}"
                    ${hasText || photo.textOpen ? '' : 'hidden'}></textarea>
            `;
            // Ce que la cliente a écrit est posé en propriété, jamais injecté
            // dans du HTML : rien à échapper, rien à mal interpréter.
            card.querySelector('.photo-card-img img').src = photo.previewUrl;
            card.querySelector('.photo-caption-input').value = photo.caption;
            card.querySelector('.photo-text-input').value = photo.text;
            photoGrid.appendChild(card);
        });
        updateCounter();
    }

    function updateCounter() {
        if (!photoCounter) {
            return;
        }
        const min = CONFIG.minPhotos || 30;
        const n = photos.length;
        photoCounter.textContent = `${n} photo${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''} · minimum conseillé : ${min}`;
        photoCounter.classList.toggle('ok', n >= min);
    }

    if (photoDrop && photoInput) {
        photoDrop.addEventListener('click', () => photoInput.click());
        photoDrop.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                photoInput.click();
            }
        });
        photoInput.addEventListener('change', () => {
            addFiles(photoInput.files);
            photoInput.value = '';
        });
        ['dragover', 'dragenter'].forEach(evt => photoDrop.addEventListener(evt, (e) => {
            e.preventDefault();
            photoDrop.classList.add('dragging');
        }));
        ['dragleave', 'drop'].forEach(evt => photoDrop.addEventListener(evt, (e) => {
            e.preventDefault();
            photoDrop.classList.remove('dragging');
        }));
        photoDrop.addEventListener('drop', (e) => {
            if (e.dataTransfer && e.dataTransfer.files) {
                addFiles(e.dataTransfer.files);
            }
        });
    }

    if (photoGrid) {
        photoGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) {
                return;
            }
            const index = Number(btn.dataset.index);
            if (btn.dataset.action === 'text') {
                const area = photoGrid.querySelector(`.photo-text-input[data-index="${index}"]`);
                if (area) {
                    area.hidden = !area.hidden;
                    btn.setAttribute('aria-expanded', area.hidden ? 'false' : 'true');
                    photos[index].textOpen = !area.hidden;
                    area.closest('.photo-card').classList.toggle('is-open', !area.hidden);
                    if (!area.hidden) {
                        area.focus();
                    }
                }
                return;
            }
            if (btn.dataset.action === 'remove') {
                URL.revokeObjectURL(photos[index].previewUrl);
                photos.splice(index, 1);
                renderPhotos();
            } else if (btn.dataset.action === 'cover') {
                photos.forEach((p, i) => { p.isCover = (i === index) ? !p.isCover : false; });
                renderPhotos();
            }
        });
        photoGrid.addEventListener('input', (e) => {
            const caption = e.target.closest('.photo-caption-input');
            if (caption) {
                photos[Number(caption.dataset.index)].caption = caption.value;
                return;
            }
            const text = e.target.closest('.photo-text-input');
            if (text) {
                const i = Number(text.dataset.index);
                photos[i].text = text.value;
                // On ne redessine pas la grille pendant la frappe : le libellé du
                // bouton se met à jour tout seul quand le champ perd le focus.
                text.closest('.photo-card').classList.toggle('has-text', !!text.value.trim());
            }
        });

        photoGrid.addEventListener('change', (e) => {
            const text = e.target.closest('.photo-text-input');
            if (text) {
                const card = text.closest('.photo-card');
                const btn = card.querySelector('.photo-text-toggle');
                if (btn) {
                    btn.textContent = text.value.trim() ? 'Modifier le texte' : '+ Ajouter un texte';
                }
            }
        });
    }

    // ===== Récapitulatif =====

    function fieldValue(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function renderSummary() {
        const summary = document.getElementById('orderSummary');
        if (!summary) {
            return;
        }
        const cover = photos.find(p => p.isCover);
        const captionCount = photos.filter(p => p.caption.trim()).length;
        const textCount = photos.filter(p => p.text.trim()).length;
        const rows = [
            ['Client', `${fieldValue('clientName')} — ${fieldValue('clientPhone')}${fieldValue('clientEmail') ? ' — ' + fieldValue('clientEmail') : ''}`],
            ['Personne célébrée', `${fieldValue('celebratedName')} (${fieldValue('occasion')}${fieldValue('eventDate') ? ', le ' + fieldValue('eventDate') : ''})`],
            ['Photos', `${photos.length} photo${photos.length > 1 ? 's' : ''}${captionCount ? `, ${captionCount} légende${captionCount > 1 ? 's' : ''}` : ''}${textCount ? `, ${textCount} texte${textCount > 1 ? 's' : ''}` : ''}${cover ? ', couverture choisie' : ''}`],
            ['Style', `${fieldValue('styleChoice')}${fieldValue('colorsWanted') ? ' — ' + fieldValue('colorsWanted') : ''}`],
            ['Livraison', `${fieldValue('deliveryDate')} — ${fieldValue('deliveryAddress')}`],
            ['Prix', `${formatAmount(CONFIG.totalAmount || 30000)} FCFA (24 pages) — acompte de ${formatAmount(CONFIG.depositAmount || 15000)} FCFA à la validation`]
        ];
        // Construction par nœuds : les réponses de la cliente passent par
        // textContent, donc aucune échappée à gérer.
        summary.textContent = '';
        rows.forEach(([label, value]) => {
            const row = document.createElement('div');
            row.className = 'order-summary-row';
            const etiquette = document.createElement('span');
            etiquette.textContent = label;
            const contenu = document.createElement('p');
            contenu.textContent = value;
            row.append(etiquette, contenu);
            summary.appendChild(row);
        });
    }

    function formatAmount(n) {
        return Number(n).toLocaleString('fr-FR').replace(/ /g, ' ');
    }

    // ===== Envoi vers Google Apps Script =====

    async function postToScript(payload) {
        // Pas d'en-tête Content-Type : cela déclencherait une requête
        // préalable (preflight) que Google Apps Script ne sait pas traiter.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90000);
        let response;
        try {
            response = await fetch(CONFIG.scriptUrl, {
                method: 'POST',
                body: JSON.stringify(payload),
                signal: controller.signal
            });
        } catch (err) {
            throw new Error(err.name === 'AbortError'
                ? 'le serveur ne répond pas'
                : 'connexion impossible');
        } finally {
            clearTimeout(timer);
        }
        if (!response.ok) {
            throw new Error(`Erreur serveur (HTTP ${response.status})`);
        }
        const data = await response.json();
        if (!data || data.success !== true) {
            throw new Error((data && data.error) || 'Réponse inattendue du serveur');
        }
        return data;
    }

    /**
     * Abandonne une promesse qui ne répond pas. Un décodage d'image ou une
     * requête réseau peuvent rester en suspens indéfiniment : sans cela, la
     * commande se figerait sans message ni possibilité de réessayer.
     */
    function withTimeout(promise, ms, label) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(label + ' : délai dépassé')), ms);
            promise.then(
                v => { clearTimeout(timer); resolve(v); },
                e => { clearTimeout(timer); reject(e); }
            );
        });
    }

    /** Décode une image, quel que soit le navigateur. */
    function loadBitmap(file) {
        if ('createImageBitmap' in window) {
            return createImageBitmap(file);
        }
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('décodage impossible')); };
            img.src = url;
        });
    }

    /**
     * Réduit une photo avant l'envoi. En cas d'échec (HEIC non décodable par
     * le navigateur, par exemple), on renvoie l'original : mieux vaut un envoi
     * lent qu'une photo perdue.
     */
    async function prepareFile(file) {
        const original = { blob: file, mimeType: file.type || 'image/jpeg', name: file.name };
        if (file.size <= SKIP_UNDER) {
            return original;
        }
        try {
            const bitmap = await withTimeout(loadBitmap(file), 8000, 'décodage de l\'image');
            const width = bitmap.width || bitmap.naturalWidth;
            const height = bitmap.height || bitmap.naturalHeight;
            if (!width || !height) {
                return original;
            }
            const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            if (bitmap.close) {
                bitmap.close();
            }
            const blob = await withTimeout(
                new Promise(res => canvas.toBlob(res, 'image/jpeg', JPEG_QUALITY)),
                8000, 'compression');
            if (!blob || blob.size >= file.size) {
                return original;   // la compression n'apporte rien
            }
            return {
                blob: blob,
                mimeType: 'image/jpeg',
                name: file.name.replace(/\.[^.]+$/, '') + '.jpg'
            };
        } catch (e) {
            return original;
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                resolve(result.substring(result.indexOf(',') + 1));
            };
            reader.onerror = () => reject(new Error(`Lecture impossible : ${file.name}`));
            reader.readAsDataURL(file);
        });
    }

    function setSendingProgress(done, total, label) {
        if (sendingLabel && label) {
            sendingLabel.textContent = label;
        }
        if (uploadFill) {
            uploadFill.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
        }
        if (uploadText) {
            uploadText.textContent = total ? `${done} / ${total} photos envoyées` : '';
        }
    }

    let submitting = false;

    async function submitOrder() {
        if (submitting) {
            return;   // double clic : une seule commande
        }
        if (document.getElementById('orderHoneypot').value) {
            return;   // robot
        }
        submitting = true;

        if (!CONFIG.scriptUrl) {
            setStatus('error', 'La commande en ligne n\'est pas encore activée. Contactez-nous sur WhatsApp : +225 07 67 66 04 76.');
            return;
        }

        form.hidden = true;
        sendingPanel.hidden = false;
        setSendingProgress(0, 0, 'Création de votre dossier…');

        try {
            // 1. Créer la commande (ligne Sheet + dossier Drive)
            const orderData = {
                clientName: fieldValue('clientName'),
                clientPhone: fieldValue('clientPhone'),
                clientEmail: fieldValue('clientEmail'),
                celebratedName: fieldValue('celebratedName'),
                occasion: fieldValue('occasion'),
                eventDate: fieldValue('eventDate'),
                story: fieldValue('story'),
                testimonials: fieldValue('testimonialsText'),
                style: fieldValue('styleChoice'),
                colors: fieldValue('colorsWanted'),
                styleNotes: fieldValue('styleNotes'),
                deliveryDate: fieldValue('deliveryDate'),
                deliveryAddress: fieldValue('deliveryAddress'),
                photoCount: photos.length,
                pageUrl: window.location.href
            };

            const created = await postToScript({ action: 'createOrder', order: orderData });
            const orderId = created.orderId;

            // 2. Envoyer les photos une par une
            let failed = 0;
            for (let i = 0; i < photos.length; i++) {
                setSendingProgress(i, photos.length, 'Préparation et envoi de vos photos…');
                const photo = photos[i];
                try {
                    const prepared = await prepareFile(photo.file);
                    if (prepared.blob.size > MAX_PHOTO_BYTES) {
                        throw new Error('photo trop lourde même après réduction');
                    }
                    const base64 = await fileToBase64(prepared.blob);
                    await postToScript({
                        action: 'uploadPhoto',
                        orderId: orderId,
                        index: i + 1,
                        fileName: prepared.name,
                        mimeType: prepared.mimeType,
                        caption: photo.caption.trim(),
                        text: photo.text.trim(),
                        isCover: photo.isCover,
                        data: base64
                    });
                } catch (err) {
                    console.error(`Échec de l'envoi de la photo ${photo.file.name}:`, err);
                    failed += 1;
                }
            }
            setSendingProgress(photos.length, photos.length, 'Finalisation…');

            // 3. Finaliser (fichier des légendes + statut)
            // On renvoie la liste complète : le script compose la fiche à partir
            // de ces textes plutôt que de relire les descriptions dans Drive.
            await postToScript({
                action: 'finalizeOrder',
                orderId: orderId,
                failedUploads: failed,
                photos: photos.map((p, i) => ({
                    index: i + 1,
                    caption: p.caption.trim(),
                    text: p.text.trim(),
                    isCover: p.isCover
                }))
            });

            // 4. Afficher le panneau de succès + paiement
            sendingPanel.hidden = true;
            showSuccess(orderId, failed);
            clearDraft();
        } catch (error) {
            console.error('Erreur lors de la commande:', error);
            sendingPanel.hidden = true;
            form.hidden = false;
            submitting = false;   // on peut réessayer
            setStatus('error', `L'envoi a échoué (${error.message}). Réessayez, ou commandez via WhatsApp : +225 07 67 66 04 76.`);
        }
    }

    function showSuccess(orderId, failed) {
        const numberEl = document.getElementById('orderNumber');
        if (numberEl) {
            numberEl.textContent = orderId;
        }

        const depositLabel = document.getElementById('depositAmountLabel');
        if (depositLabel) {
            depositLabel.textContent = formatAmount(CONFIG.depositAmount || 15000);
        }

        const payBtn = document.getElementById('paymentLinkBtn');
        const payFallback = document.getElementById('paymentLinkFallback');
        if (CONFIG.paymentLink) {
            payBtn.href = CONFIG.paymentLink;
            payBtn.hidden = false;
            payFallback.hidden = true;
        } else {
            payBtn.hidden = true;
            payFallback.hidden = false;
        }

        const waBtn = document.getElementById('paymentWhatsappBtn');
        if (waBtn) {
            const msg = encodeURIComponent(
                `Bonjour Peace Magazine, je viens de payer l'acompte de ma commande ${orderId}.\n\n` +
                `Nom : ${fieldValue('clientName')}\n` +
                `Numéro : ${fieldValue('clientPhone')}\n` +
                `Heure du paiement : `
            );
            waBtn.href = `https://wa.me/${WHATSAPP}?text=${msg}`;
        }

        successPanel.hidden = false;
        if (failed > 0) {
            setStatus('info', `${failed} photo${failed > 1 ? 's n\'ont' : ' n\'a'} pas pu être envoyée${failed > 1 ? 's' : ''} — nous vous recontacterons pour les récupérer.`);
        }
        successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function setStatus(type, message) {
        if (!statusEl) {
            return;
        }
        statusEl.textContent = message;
        statusEl.className = 'form-status' + (type ? ' ' + type : '');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
            submitOrder();
        }
    });
})();
