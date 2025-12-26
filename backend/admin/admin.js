// Configuration de l'API
const API_BASE_URL = window.location.origin.replace(':3000', ':3000') + '/api';
let authToken = localStorage.getItem('admin_token');

// État de l'application
let currentSection = 'dashboard';
let ordersData = [];
let leadsData = [];
let statsData = {};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Vérifier l'authentification
    if (!authToken) {
        showLoginModal();
        return;
    }

    // Configurer les événements
    setupEventListeners();
    
    // Charger les données initiales
    loadDashboardData();
}

function setupEventListeners() {
    // Navigation sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            showSection(section);
        });
    });

    // Bouton actualiser
    document.getElementById('refresh-btn').addEventListener('click', function() {
        loadCurrentSectionData();
    });

    // Boutons d'action
    document.getElementById('filter-orders')?.addEventListener('click', showOrderFilters);
    document.getElementById('add-order')?.addEventListener('click', showAddOrderModal);
    document.getElementById('filter-leads')?.addEventListener('click', showLeadFilters);
    document.getElementById('add-lead')?.addEventListener('click', showAddLeadModal);
}

function showSection(section) {
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Afficher la section
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    document.getElementById(`${section}-section`).style.display = 'block';

    // Mettre à jour le titre
    const titles = {
        'dashboard': 'Tableau de bord',
        'orders': 'Gestion des Commandes',
        'leads': 'Gestion des Leads',
        'files': 'Gestion des Fichiers',
        'users': 'Gestion des Utilisateurs',
        'analytics': 'Analytics Avancées',
        'settings': 'Paramètres'
    };
    document.getElementById('page-title').textContent = titles[section];

    currentSection = section;
    loadCurrentSectionData();
}

function loadCurrentSectionData() {
    switch (currentSection) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'leads':
            loadLeadsData();
            break;
        case 'files':
            loadFilesData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// Fonctions de chargement des données
async function loadDashboardData() {
    try {
        showLoading('recent-orders-table');
        
        // Charger les statistiques
        const statsResponse = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            if (stats.success) {
                updateDashboardStats(stats.data);
                updateCharts(stats.data);
            }
        }

        // Charger les commandes récentes
        const ordersResponse = await fetch(`${API_BASE_URL}/admin/orders?limit=5&sortBy=created_at&sortOrder=DESC`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            if (orders.success) {
                updateRecentOrdersTable(orders.data.orders);
            }
        }

    } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord:', error);
        showError('Erreur lors du chargement des données');
    }
}

async function loadOrdersData() {
    try {
        showLoading('orders-table');
        
        const response = await fetch(`${API_BASE_URL}/admin/orders?limit=50`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                ordersData = data.data.orders;
                updateOrdersTable(ordersData);
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des commandes');
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors du chargement des commandes');
        }

    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        showError('Erreur lors du chargement des commandes: ' + error.message);
    }
}

async function loadLeadsData() {
    try {
        showLoading('leads-table');
        
        const response = await fetch(`${API_BASE_URL}/admin/leads?limit=50`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                leadsData = data.data.leads;
                updateLeadsTable(leadsData);
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des leads');
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors du chargement des leads');
        }

    } catch (error) {
        console.error('Erreur lors du chargement des leads:', error);
        showError('Erreur lors du chargement des leads: ' + error.message);
    }
}

// Fonctions de mise à jour de l'interface
function updateDashboardStats(stats) {
    // Calculer les totaux
    const totalOrders = stats.statusStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
    const totalRevenue = stats.totalRevenue || 0;
    const activeLeads = stats.statusStats.find(s => s.status === 'new')?.count || 0;
    const conversionRate = stats.conversionRate ? 
        Math.round((stats.conversionRate.convertedLeads / stats.conversionRate.totalLeads) * 100) : 0;

    // Mettre à jour les cartes de statistiques
    document.getElementById('total-orders').textContent = totalOrders.toLocaleString();
    document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString() + ' FCFA';
    document.getElementById('active-leads').textContent = activeLeads.toLocaleString();
    document.getElementById('conversion-rate').textContent = conversionRate + '%';
}

function updateCharts(stats) {
    // Graphique des commandes mensuelles
    const monthlyData = stats.monthlyStats || [];
    const ctx1 = document.getElementById('ordersChart').getContext('2d');
    
    new Chart(ctx1, {
        type: 'line',
        data: {
            labels: monthlyData.map(item => item.month),
            datasets: [{
                label: 'Commandes',
                data: monthlyData.map(item => item.count),
                borderColor: '#F5C542',
                backgroundColor: 'rgba(245, 197, 66, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Graphique des statuts
    const statusData = stats.statusStats || [];
    const ctx2 = document.getElementById('statusChart').getContext('2d');
    
    new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: statusData.map(item => item.status),
            datasets: [{
                data: statusData.map(item => item.count),
                backgroundColor: [
                    '#F5C542',
                    '#FFB300',
                    '#17a2b8',
                    '#28a745',
                    '#dc3545'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateRecentOrdersTable(orders) {
    const tbody = document.querySelector('#recent-orders-table tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucune commande récente</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.orderNumber}</strong></td>
            <td>${order.clientName}</td>
            <td>${order.occasion}</td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>${order.totalPrice.toLocaleString()} FCFA</td>
            <td>${new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewOrder('${order.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateOrdersTable(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Aucune commande trouvée</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.orderNumber || order.id.substring(0, 8)}</strong></td>
            <td>${order.customerName || order.clientName || 'N/A'}</td>
            <td>${order.occasion || 'N/A'}</td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td><span class="status-badge payment-${order.paymentStatus || 'pending'}">${getPaymentStatusText(order.paymentStatus || 'pending')}</span></td>
            <td>${order.totalPrice ? order.totalPrice.toLocaleString() + ' FCFA' : 'N/A'}</td>
            <td>${order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewOrder('${order.id}')" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="editOrder('${order.id}')" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="downloadOrderPhotos('${order.id}')" title="Télécharger photos">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateLeadsTable(leads) {
    const tbody = document.querySelector('#leads-table tbody');
    tbody.innerHTML = '';

    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Aucun lead trouvé</td></tr>';
        return;
    }

    leads.forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${lead.name}</strong></td>
            <td>
                ${lead.email ? `<div><i class="fas fa-envelope me-1"></i>${lead.email}</div>` : ''}
                ${lead.phone ? `<div><i class="fas fa-phone me-1"></i>${lead.phone}</div>` : ''}
            </td>
            <td>${lead.occasion || 'Non spécifié'}</td>
            <td>${lead.source}</td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar" role="progressbar" style="width: ${lead.score}%">
                        ${lead.score}/100
                    </div>
                </div>
            </td>
            <td><span class="status-badge status-${lead.status}">${getLeadStatusText(lead.status)}</span></td>
            <td>${new Date(lead.createdAt).toLocaleDateString('fr-FR')}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewLead('${lead.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="contactLead('${lead.id}')">
                        <i class="fas fa-phone"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Fonctions utilitaires
function getStatusText(status) {
    const statusMap = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'in_progress': 'En cours',
        'review': 'En révision',
        'approved': 'Approuvée',
        'printing': 'En impression',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
    };
    return statusMap[status] || status;
}

function getPaymentStatusText(status) {
    const statusMap = {
        'pending': 'En attente',
        'paid': 'Payé',
        'failed': 'Échoué',
        'refunded': 'Remboursé'
    };
    return statusMap[status] || status;
}

function getLeadStatusText(status) {
    const statusMap = {
        'new': 'Nouveau',
        'contacted': 'Contacté',
        'qualified': 'Qualifié',
        'converted': 'Converti',
        'lost': 'Perdu'
    };
    return statusMap[status] || status;
}

function showLoading(tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center">
                <div class="loading">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

function showError(message) {
    // Créer une alerte Bootstrap
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insérer l'alerte en haut de la page
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    // Supprimer l'alerte après 5 secondes
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showLoginModal() {
    // Créer une modal de connexion simple
    const modalHtml = `
        <div class="modal fade" id="loginModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Connexion Administration</h5>
                    </div>
                    <div class="modal-body">
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Mot de passe</label>
                                <input type="password" class="form-control" id="password" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="login()">Se connecter</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            authToken = data.data.session.accessToken;
            localStorage.setItem('admin_token', authToken);
            
            // Fermer la modal et initialiser l'app
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            initializeApp();
        } else {
            throw new Error(data.message || 'Identifiants incorrects');
        }
    } catch (error) {
        showError('Erreur de connexion: ' + error.message);
    }
}

// Fonctions d'action
async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showOrderModal(data.data.order, data.data.files);
            } else {
                showError(data.message || 'Erreur lors du chargement de la commande');
            }
        } else {
            const errorData = await response.json();
            showError(errorData.message || 'Erreur lors du chargement de la commande');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de la commande:', error);
        showError('Erreur lors de la récupération de la commande');
    }
}

async function editOrder(orderId) {
    // Ouvrir la modal de modification
    await viewOrder(orderId);
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showSuccess('Statut mis à jour avec succès');
                loadCurrentSectionData();
            } else {
                showError(data.message || 'Erreur lors de la mise à jour');
            }
        } else {
            const errorData = await response.json();
            showError(errorData.message || 'Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        showError('Erreur lors de la mise à jour du statut');
    }
}

async function updatePaymentStatus(orderId, newPaymentStatus, notes) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/payment-status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                paymentStatus: newPaymentStatus,
                paymentNotes: notes 
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showSuccess('Statut de paiement mis à jour avec succès');
                loadCurrentSectionData();
            } else {
                showError(data.message || 'Erreur lors de la mise à jour');
            }
        } else {
            const errorData = await response.json();
            showError(errorData.message || 'Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de paiement:', error);
        showError('Erreur lors de la mise à jour du statut de paiement');
    }
}

async function downloadOrderPhotos(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/download-photos`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `commande-${orderId}-photos.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess('Téléchargement démarré');
        } else {
            const errorData = await response.json();
            showError(errorData.message || 'Erreur lors du téléchargement');
        }
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        showError('Erreur lors du téléchargement des photos');
    }
}

function showOrderModal(order, files = []) {
    // Créer une modal pour afficher les détails de la commande
    const modalHtml = `
        <div class="modal fade" id="orderModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Commande ${order.orderNumber || order.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Client:</strong> ${order.customerName || 'N/A'}<br>
                                <strong>Email:</strong> ${order.customerEmail || 'N/A'}<br>
                                <strong>Téléphone:</strong> ${order.customerPhone || 'N/A'}
                            </div>
                            <div class="col-md-6">
                                <strong>Personne célébrée:</strong> ${order.personName || 'N/A'}<br>
                                <strong>Occasion:</strong> ${order.occasion || 'N/A'}<br>
                                <strong>Date de livraison:</strong> ${order.deliveryDate || 'N/A'}
                            </div>
                        </div>
                        <div class="mb-3">
                            <strong>Statut:</strong>
                            <select class="form-select d-inline-block w-auto ms-2" id="orderStatusSelect" onchange="updateOrderStatus('${order.id}', this.value)">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>En attente</option>
                                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmée</option>
                                <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>En cours</option>
                                <option value="review" ${order.status === 'review' ? 'selected' : ''}>En révision</option>
                                <option value="approved" ${order.status === 'approved' ? 'selected' : ''}>Approuvée</option>
                                <option value="printing" ${order.status === 'printing' ? 'selected' : ''}>En impression</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Expédiée</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Livrée</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <strong>Statut de paiement:</strong>
                            <select class="form-select d-inline-block w-auto ms-2" id="paymentStatusSelect" onchange="updatePaymentStatus('${order.id}', this.value)">
                                <option value="pending" ${order.paymentStatus === 'pending' ? 'selected' : ''}>En attente</option>
                                <option value="paid" ${order.paymentStatus === 'paid' ? 'selected' : ''}>Payé</option>
                                <option value="pending_verification" ${order.paymentStatus === 'pending_verification' ? 'selected' : ''}>En vérification</option>
                                <option value="failed" ${order.paymentStatus === 'failed' ? 'selected' : ''}>Échoué</option>
                                <option value="refunded" ${order.paymentStatus === 'refunded' ? 'selected' : ''}>Remboursé</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <strong>Prix:</strong> ${order.totalPrice ? order.totalPrice.toLocaleString() + ' FCFA' : 'N/A'}
                        </div>
                        ${files.length > 0 ? `
                            <div class="mb-3">
                                <strong>Photos (${files.length}):</strong>
                                <button class="btn btn-sm btn-primary ms-2" onclick="downloadOrderPhotos('${order.id}')">
                                    <i class="fas fa-download me-1"></i>Télécharger toutes les photos (ZIP)
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Supprimer l'ancienne modal si elle existe
    const existingModal = document.getElementById('orderModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function viewLead(leadId) {
    console.log('Voir lead:', leadId);
    // TODO: Implémenter la vue détaillée du lead
}

function contactLead(leadId) {
    console.log('Contacter lead:', leadId);
    // TODO: Implémenter le contact du lead
}

function showOrderFilters() {
    console.log('Afficher filtres commandes');
    // TODO: Implémenter les filtres
}

function showAddOrderModal() {
    console.log('Ajouter nouvelle commande');
    // TODO: Implémenter l'ajout de commande
}

function showLeadFilters() {
    console.log('Afficher filtres leads');
    // TODO: Implémenter les filtres
}

function showAddLeadModal() {
    console.log('Ajouter nouveau lead');
    // TODO: Implémenter l'ajout de lead
}

// Fonctions de chargement des autres sections
function loadFilesData() {
    console.log('Chargement des fichiers...');
    // TODO: Implémenter
}

function loadUsersData() {
    console.log('Chargement des utilisateurs...');
    // TODO: Implémenter
}

function loadAnalyticsData() {
    console.log('Chargement des analytics...');
    // TODO: Implémenter
}

function loadSettingsData() {
    console.log('Chargement des paramètres...');
    // TODO: Implémenter
}











