/**
 * Peace Magazine — Script principal
 * Site statique (GitHub Pages). Les commandes et contacts passent par WhatsApp.
 */

const WHATSAPP_NUMBER = '2250767660476';
const WHATSAPP_DISPLAY = '+225 07 67 66 04 76';

// ===== Défilement fluide pour les ancres =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (event) => {
        const hash = anchor.getAttribute('href');
        if (!hash || hash === '#') {
            return;
        }
        const target = document.querySelector(hash);
        if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== FAQ (accordéon accessible) =====
class FAQ {
    constructor() {
        this.init();
    }

    init() {
        const faqItems = document.querySelectorAll('.faq-item');
        if (!faqItems.length) {
            return;
        }

        faqItems.forEach((item) => {
            const question = item.querySelector('.faq-question');
            if (!question) {
                return;
            }
            const toggle = question.querySelector('.faq-toggle');

            const toggleFAQ = () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(other => {
                    other.classList.remove('active');
                    const otherQuestion = other.querySelector('.faq-question');
                    if (otherQuestion) {
                        otherQuestion.setAttribute('aria-expanded', 'false');
                    }
                    const otherToggle = other.querySelector('.faq-toggle');
                    if (otherToggle) {
                        otherToggle.textContent = '+';
                    }
                });

                item.classList.toggle('active', !isActive);
                question.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
                if (toggle) {
                    toggle.textContent = !isActive ? '−' : '+';
                }
            };

            question.addEventListener('click', toggleFAQ);
            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFAQ();
                }
            });
        });
    }
}

// ===== Formulaire de contact (envoi direct via WhatsApp) =====
class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        if (!this.form) {
            return;
        }
        this.statusEl = null;
        this.init();
    }

    init() {
        this.statusEl = document.createElement('div');
        this.statusEl.className = 'form-status';
        this.statusEl.setAttribute('aria-live', 'polite');
        this.form.prepend(this.statusEl);

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.submitForm();
        });
    }

    submitForm() {
        const formData = new FormData(this.form);
        const name = (formData.get('contactName') || '').toString().trim();
        const contact = (formData.get('contactEmail') || '').toString().trim();
        const message = (formData.get('contactMessage') || '').toString().trim();

        if (!name || !contact || !message) {
            this.setStatus('error', 'Merci de remplir tous les champs.');
            return;
        }

        const text = encodeURIComponent(
            'Bonjour Peace Magazine,\n\n' +
            `Nom : ${name}\n` +
            `Email/Téléphone : ${contact}\n\n` +
            `Message :\n${message}`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener');

        this.setStatus('success', 'Votre message est prêt dans WhatsApp — il ne reste qu\'à l\'envoyer. Vous pouvez aussi nous écrire à morak6@icloud.com.');
        this.form.reset();
    }

    setStatus(type, message) {
        if (!this.statusEl) {
            return;
        }
        this.statusEl.textContent = message;
        this.statusEl.className = `form-status ${type}`;
    }
}

// ===== Animations au scroll =====
class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.step, .gallery-item, .faq-item').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(element);
        });
    }
}

// ===== Navbar : fond au scroll + rétraction vers le bas =====
function initializeNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        return;
    }

    let lastScrollTop = 0;
    let ticking = false;

    const handleScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        navbar.classList.toggle('scrolled', scrollTop > 50);

        // Cacher la navbar en descendant, la réafficher en remontant
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        lastScrollTop = scrollTop;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    handleScroll();
}

// ===== Menu mobile =====
function initializeMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (!navToggle || !navMenu) {
        return;
    }

    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
        navMenu.classList.toggle('active', !isExpanded);
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        }
    });
}

// ===== Mentions légales / CGV (modale) =====
function showLegalSection(type) {
    const modal = document.getElementById('legal-modal');
    const title = document.getElementById('legal-title');
    const content = document.getElementById('legal-content');
    if (!modal || !title || !content) {
        return;
    }

    if (type === 'mentions') {
        title.textContent = 'Mentions Légales';
        content.innerHTML = `
            <h3>Éditeur du site</h3>
            <p><strong>Peace Magazine</strong><br>
            Société de création de magazines personnalisés<br>
            Côte d'Ivoire, Abidjan<br>
            Téléphone : ${WHATSAPP_DISPLAY}<br>
            Email : morak6@icloud.com</p>
            <h3>Hébergement</h3>
            <p>Ce site est hébergé par GitHub Pages (GitHub, Inc.).</p>
            <h3>Propriété intellectuelle</h3>
            <p>L'ensemble de ce site relève de la législation sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.</p>
            <h3>Protection des données personnelles</h3>
            <p>Conformément à la loi, vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant. Pour l'exercer, contactez-nous.</p>
        `;
    } else if (type === 'cgv') {
        title.textContent = 'Conditions Générales de Vente';
        content.innerHTML = `
            <h3>Article 1 - Objet</h3>
            <p>Les présentes conditions générales de vente s'appliquent aux services de création de magazines personnalisés.</p>
            <h3>Article 2 - Tarifs</h3>
            <p>Le prix d'un magazine personnalisé est de <strong>30 000 FCFA</strong> pour 24 pages (hors livraison).</p>
            <h3>Article 3 - Délais</h3>
            <p>Les commandes doivent être passées 1 à 2 semaines avant la date de livraison souhaitée.</p>
            <h3>Article 4 - Processus de commande</h3>
            <p>1. Collecte des informations et photos<br>
            2. Création d'un aperçu personnalisé<br>
            3. Validation par le client<br>
            4. Paiement selon l'option choisie<br>
            5. Impression et livraison</p>
            <h3>Article 5 - Paiement</h3>
            <p>Le paiement s'effectue après validation de l'aperçu. Moyens acceptés : virement bancaire, mobile money, espèces.</p>
            <h3>Article 6 - Livraison</h3>
            <p>La livraison est à la charge du client. Le tarif est confirmé après validation de la commande.</p>
            <h3>Article 7 - Responsabilité</h3>
            <p>Peace Magazine s'engage à respecter la confidentialité des informations fournies et à livrer un produit de qualité.</p>
            <h3>Article 8 - Droit de rétractation</h3>
            <p>Du fait du caractère personnalisé du service, le droit de rétractation ne s'applique pas après validation de l'aperçu.</p>
            <h3>Article 9 - Contact</h3>
            <p>Pour toute question : WhatsApp ${WHATSAPP_DISPLAY}</p>
        `;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLegalSection() {
    const modal = document.getElementById('legal-modal');
    if (!modal) {
        return;
    }
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.addEventListener('click', (event) => {
    const modal = document.getElementById('legal-modal');
    if (modal && event.target === modal) {
        closeLegalSection();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeLegalSection();
    }
});

// ===== Vidéos : galerie en accordéon =====
function initializeVideoCovers() {
    const panels = Array.from(document.querySelectorAll('.media-panel'));
    if (!panels.length) {
        return;
    }

    const play = (panel) => {
        const video = panel.querySelector('video');
        if (!video) {
            return;
        }
        // Une seule vidéo à la fois : on remet les autres au repos.
        panels.forEach(other => {
            if (other === panel) {
                return;
            }
            const v = other.querySelector('video');
            if (v && !v.paused) {
                v.pause();
            }
            other.classList.remove('is-playing');
        });

        panel.classList.add('is-playing');
        // Le panneau survolé est déjà large ; sur mobile (sans survol) il faut
        // l'ouvrir explicitement pour que la vidéo soit visible.
        panels.forEach(other => other.classList.toggle('is-open', other === panel));

        video.play().catch(() => {
            panel.classList.remove('is-playing');
        });
    };

    panels.forEach(panel => {
        const video = panel.querySelector('video');

        panel.addEventListener('click', (event) => {
            // Les contrôles natifs de la vidéo gardent la main une fois lancée.
            if (event.target.closest('video') && panel.classList.contains('is-playing')) {
                return;
            }
            play(panel);
        });

        panel.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                play(panel);
            }
        });

        if (video) {
            video.addEventListener('ended', () => {
                panel.classList.remove('is-playing');
                video.currentTime = 0;
            });
            video.addEventListener('pause', () => {
                if (video.currentTime === 0) {
                    panel.classList.remove('is-playing');
                }
            });
        }
    });
}

// ===== Année du footer =====
function updateFooterYear() {
    const yearEl = document.getElementById('footerYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

// ===== Initialisation =====
document.addEventListener('DOMContentLoaded', () => {
    initializeVideoCovers();
    new FAQ();
    new ContactForm();
    new ScrollAnimations();
    initializeMobileMenu();
    initializeNavbarScroll();
    updateFooterYear();
});
