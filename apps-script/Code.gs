/**
 * Peace Magazine — Réception des commandes du site
 *
 * Reçoit les commandes du formulaire de peacemagazine.shop :
 *   - crée un dossier Google Drive par commande (dans « Peace Magazine — Commandes »)
 *   - enregistre chaque commande dans un Google Sheet
 *   - dépose chaque photo dans le dossier de la commande (la légende facultative
 *     va dans la description du fichier et dans Légendes.txt)
 *
 * Installation : voir GUIDE-CONFIGURATION-COMMANDES.md à la racine du site.
 */

// ===== Garde-fous =====
// Le script est déployé « accessible à tous » : c'est indispensable pour que les
// clients commandent sans compte Google, mais cela signifie que n'importe qui
// peut l'appeler. Ces limites empêchent qu'on s'en serve pour saturer le Drive
// ou y déposer autre chose que des photos.
var MAX_PHOTO_BYTES = 12 * 1024 * 1024;   // 12 Mo par photo
var MAX_PHOTOS = 80;                      // par commande
var MAX_TEXT = 4000;                      // par champ de texte
var MAX_PHOTO_TEXT = 1500;                // texte associé à une photo
var MAX_ORDERS_PER_HOUR = 20;

var ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif'
};

var ROOT_FOLDER_NAME = 'Peace Magazine — Commandes';
var SPREADSHEET_NAME = 'Peace Magazine — Suivi des commandes';
var SHEET_NAME = 'Commandes';

var HEADERS = [
  'Date', 'N° commande', 'Statut', 'Client', 'Téléphone', 'Email',
  'Personne célébrée', 'Occasion', 'Date événement', 'Histoire / anecdotes',
  'Témoignages', 'Style', 'Couleurs', 'Directives', 'Date livraison',
  'Adresse livraison', 'Photos annoncées', 'Photos reçues', 'Dossier Drive'
];

/** Petit test : ouvrez l'URL /exec dans un navigateur. */
function doGet() {
  return jsonOutput({ success: true, message: 'Peace Magazine — API commandes opérationnelle ✅' });
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var result;
    if (payload.action === 'createOrder') {
      result = createOrder(payload.order || {});
    } else if (payload.action === 'uploadPhoto') {
      result = uploadPhoto(payload);
    } else if (payload.action === 'finalizeOrder') {
      result = finalizeOrder(payload);
    } else {
      throw new Error('Action inconnue');
    }
    result.success = true;
    return jsonOutput(result);
  } catch (err) {
    return jsonOutput({ success: false, error: String(err && err.message ? err.message : err) });
  }
}

// ===== Nettoyage des entrées =====

/** Tronque et nettoie une valeur texte venue du formulaire. */
function clean(value, max) {
  if (value === null || value === undefined) {
    return '';
  }
  var s = String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
  max = max || MAX_TEXT;
  return s.length > max ? s.substring(0, max) + '…' : s;
}

/**
 * Neutralise les formules dans une cellule : une valeur commençant par
 * =, +, - ou @ serait exécutée par Google Sheets, ce qui permet de faire
 * fuiter le contenu d'un classeur.
 */
function safeCell(value) {
  var s = clean(value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/** Nom de fichier sans séparateur de chemin, point de tête ni caractère interdit. */
function safeName(value) {
  return clean(value, 120)
    .replace(/\.[A-Za-z0-9]+$/, '')        // on retire l'extension d'origine
    .replace(/[\/\\:*?"<>|]/g, '-')        // séparateurs et caractères interdits
    .replace(/\.{2,}/g, '.')                // plus de « .. »
    .replace(/^[.\-\s]+|[.\-\s]+$/g, '')   // ni point ni tiret en tête ou en fin
    || 'photo';
}

/** Refuse plus de MAX_ORDERS_PER_HOUR commandes par heure. */
function checkRate() {
  var props = PropertiesService.getScriptProperties();
  var now = Date.now();
  var hits;
  try {
    hits = JSON.parse(props.getProperty('RATE') || '[]');
  } catch (e) {
    hits = [];
  }
  hits = hits.filter(function (t) { return now - t < 3600000; });
  if (hits.length >= MAX_ORDERS_PER_HOUR) {
    throw new Error('Trop de commandes en peu de temps. Réessayez plus tard ou écrivez-nous sur WhatsApp.');
  }
  hits.push(now);
  props.setProperty('RATE', JSON.stringify(hits));
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== Commande =====

function createOrder(order) {
  checkRate();

  var now = new Date();
  var orderId = 'CMD-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');

  var o = {
    clientName: clean(order.clientName, 120),
    clientPhone: clean(order.clientPhone, 40),
    clientEmail: clean(order.clientEmail, 160),
    celebratedName: clean(order.celebratedName, 160),
    occasion: clean(order.occasion, 80),
    eventDate: clean(order.eventDate, 40),
    story: clean(order.story),
    testimonials: clean(order.testimonials),
    style: clean(order.style, 80),
    colors: clean(order.colors, 200),
    styleNotes: clean(order.styleNotes),
    deliveryDate: clean(order.deliveryDate, 40),
    deliveryAddress: clean(order.deliveryAddress, 600),
    photoCount: Math.min(Math.max(Number(order.photoCount) || 0, 0), MAX_PHOTOS)
  };

  if (!o.clientName || !o.clientPhone) {
    throw new Error('Nom et téléphone sont obligatoires.');
  }

  var root = getOrCreateRootFolder();
  var folder = root.createFolder(orderId + ' — ' + (safeName(o.celebratedName) || 'Sans nom'));
  // Raccourci pour retrouver le dossier ensuite. Si le stockage est plein,
  // on continue : getOrderFolder() sait aussi chercher par nom.
  try {
    PropertiesService.getScriptProperties().setProperty(orderId, folder.getId());
  } catch (e) {
    // sans conséquence
  }

  creerFiche(folder, orderId, now, o);

  // safeCell() devant chaque champ libre : sans cela une valeur commençant par
  // « = » serait interprétée comme une formule par Google Sheets.
  var sheet = getOrCreateSheet(root);
  sheet.appendRow([
    now,
    orderId,
    '🕐 En cours d\'envoi',
    safeCell(o.clientName),
    "'" + o.clientPhone,
    safeCell(o.clientEmail),
    safeCell(o.celebratedName),
    safeCell(o.occasion),
    safeCell(o.eventDate),
    safeCell(o.story),
    safeCell(o.testimonials),
    safeCell(o.style),
    safeCell(o.colors),
    safeCell(o.styleNotes),
    safeCell(o.deliveryDate),
    safeCell(o.deliveryAddress),
    o.photoCount,
    0,
    folder.getUrl()
  ]);

  return { orderId: orderId, folderUrl: folder.getUrl() };
}

/**
 * Crée la fiche de commande.
 *
 * On préfère un Google Docs (lisible, modifiable, annotable, et sans impact
 * sur le quota Drive). Mais DocumentApp réclame une autorisation distincte :
 * si elle manque, on retombe sur un fichier texte. Une commande ne doit
 * jamais être perdue pour un problème de permission.
 */
function creerFiche(folder, orderId, now, o) {
  try {
    return creerFicheDocs(folder, orderId, now, o);
  } catch (e) {
    folder.createFile('Fiche commande.txt', ficheTexte(orderId, now, o), MimeType.PLAIN_TEXT);
    return null;
  }
}

/** Version texte, utilisée si l'autorisation Google Docs manque. */
function ficheTexte(orderId, now, o) {
  return 'PEACE MAGAZINE — COMMANDE ' + orderId + '\n' +
    'Reçue le ' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy à HH:mm') + '\n\n' +
    '== CLIENT ==\n' +
    'Nom : ' + o.clientName + '\n' +
    'Téléphone : ' + o.clientPhone + '\n' +
    'Email : ' + (o.clientEmail || '—') + '\n\n' +
    '== PERSONNE CÉLÉBRÉE ==\n' +
    'Nom : ' + o.celebratedName + '\n' +
    'Occasion : ' + o.occasion + '\n' +
    'Date de l\'événement : ' + (o.eventDate || '—') + '\n\n' +
    '== HISTOIRE ET ANECDOTES ==\n' + (o.story || '—') + '\n\n' +
    '== TÉMOIGNAGES ==\n' + (o.testimonials || '—') + '\n\n' +
    '== STYLE ==\n' +
    'Style : ' + (o.style || '—') + '\n' +
    'Couleurs : ' + (o.colors || '—') + '\n' +
    'Directives : ' + (o.styleNotes || '—') + '\n\n' +
    '== LIVRAISON ==\n' +
    'Date souhaitée : ' + (o.deliveryDate || '—') + '\n' +
    'Adresse : ' + (o.deliveryAddress || '—') + '\n\n' +
    'Photos annoncées : ' + o.photoCount + '\n';
}

function creerFicheDocs(folder, orderId, now, o) {
  var doc = DocumentApp.create('Fiche commande — ' + orderId);
  var body = doc.getBody();
  body.clear();

  var titre = body.appendParagraph('PEACE MAGAZINE');
  titre.setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('Commande ' + orderId)
      .setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  body.appendParagraph('Reçue le ' +
    Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy à HH:mm'));

  section(body, 'Client');
  ligne(body, 'Nom', o.clientName);
  ligne(body, 'Téléphone', o.clientPhone);
  ligne(body, 'Email', o.clientEmail || '—');

  section(body, 'Personne célébrée');
  ligne(body, 'Nom', o.celebratedName);
  ligne(body, 'Occasion', o.occasion);
  ligne(body, 'Date de l\'événement', o.eventDate || '—');

  section(body, 'Histoire et anecdotes');
  body.appendParagraph(o.story || '—');

  if (o.testimonials) {
    section(body, 'Témoignages à inclure');
    body.appendParagraph(o.testimonials);
  }

  section(body, 'Style souhaité');
  ligne(body, 'Style', o.style || '—');
  ligne(body, 'Couleurs', o.colors || '—');
  ligne(body, 'Directives', o.styleNotes || '—');

  section(body, 'Livraison');
  ligne(body, 'Date souhaitée', o.deliveryDate || '—');
  ligne(body, 'Adresse', o.deliveryAddress || '—');
  ligne(body, 'Photos annoncées', String(o.photoCount));

  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).moveTo(folder);

  try {
    PropertiesService.getScriptProperties().setProperty('DOC-' + orderId, doc.getId());
  } catch (e) {
    // sans conséquence : finalizeOrder retrouvera le document dans le dossier
  }
  return doc.getId();
}

function section(body, titre) {
  body.appendParagraph(titre).setHeading(DocumentApp.ParagraphHeading.HEADING2);
}

function ligne(body, etiquette, valeur) {
  var p = body.appendParagraph('');
  p.appendText(etiquette + ' : ').setBold(true);
  p.appendText(String(valeur)).setBold(false);
}

/** Retrouve la fiche d'une commande, par raccourci ou dans son dossier. */
function ouvrirFiche(orderId, folder) {
  var docId = PropertiesService.getScriptProperties().getProperty('DOC-' + orderId);
  if (docId) {
    try {
      return DocumentApp.openById(docId);
    } catch (e) {
      // document déplacé ou supprimé : on cherche dans le dossier
    }
  }
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    if (f.getName().indexOf('Fiche commande') === 0) {
      return DocumentApp.openById(f.getId());
    }
  }
  return null;
}

function uploadPhoto(payload) {
  // Seules des images, et seulement celles-là : l'extension est imposée par le
  // serveur d'après le type reconnu, jamais reprise telle quelle du client.
  var type = String(payload.mimeType || '').toLowerCase();
  if (!ALLOWED_TYPES[type]) {
    throw new Error('Format refusé (images JPEG, PNG, WebP ou HEIC uniquement).');
  }

  var index = Number(payload.index) || 0;
  if (index < 1 || index > MAX_PHOTOS) {
    throw new Error('Trop de photos pour une commande (maximum ' + MAX_PHOTOS + ').');
  }

  var folder = getOrderFolder(payload.orderId);
  var photosFolder = getOrCreateSubFolder(folder, 'Photos');

  var bytes = Utilities.base64Decode(payload.data);
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('Photo trop lourde (maximum ' + Math.round(MAX_PHOTO_BYTES / 1048576) + ' Mo).');
  }

  var name = (payload.isCover ? 'COUVERTURE — ' : '') + padNumber(index) + ' — ' +
             safeName(payload.fileName) + ALLOWED_TYPES[type];

  var file = photosFolder.createFile(Utilities.newBlob(bytes, type, name));

  // Légende et texte sont aussi posés en description du fichier : on les
  // retrouve ainsi directement dans Drive, en survolant la photo.
  var caption = clean(payload.caption, 300);
  var texte = clean(payload.text, MAX_PHOTO_TEXT);
  var description = [caption, texte].filter(function (v) { return v; }).join('\n\n');
  if (description) {
    file.setDescription(description);
  }
  return { fileId: file.getId() };
}

function finalizeOrder(payload) {
  var orderId = clean(payload.orderId, 40);
  var folder = getOrderFolder(orderId);
  var photosFolder = getOrCreateSubFolder(folder, 'Photos');

  var recues = 0;
  var files = photosFolder.getFiles();
  while (files.hasNext()) {
    files.next();
    recues++;
  }

  // Les légendes et textes arrivent du formulaire : inutile de relire chaque
  // description dans Drive, ce qui serait lent pour quatre-vingts photos.
  var photos = Array.isArray(payload.photos) ? payload.photos.slice(0, MAX_PHOTOS) : [];
  var doc = null;
  try {
    doc = ouvrirFiche(orderId, folder);
  } catch (e) {
    doc = null;   // autorisation Docs absente
  }
  if (!doc && photos.length) {
    ajouterPhotosAuTexte(folder, photos);
  }
  if (doc && photos.length) {
    var body = doc.getBody();
    section(body, 'Photos, légendes et textes');
    photos.forEach(function (p) {
      var index = Number(p.index) || 0;
      var caption = clean(p.caption, 300);
      var texte = clean(p.text, MAX_PHOTO_TEXT);
      var titre = 'Photo ' + padNumber(index) + (p.isCover ? ' — COUVERTURE' : '');
      body.appendParagraph(titre).setHeading(DocumentApp.ParagraphHeading.HEADING3);
      if (caption) {
        ligne(body, 'Légende', caption);
      }
      if (texte) {
        body.appendParagraph(texte);
      }
      if (!caption && !texte) {
        body.appendParagraph('(sans texte)').setItalic(true);
      }
    });
    doc.saveAndClose();
  }

  var entries = { length: recues };
  var failed = Math.max(Number(payload.failedUploads) || 0, 0);
  var statut = '💰 En attente de paiement de l\'acompte';
  if (failed > 0) {
    statut += ' (⚠️ ' + failed + ' photo(s) non reçue(s))';
  }
  updateOrderRow(orderId, { statut: statut, photosRecues: entries.length });

  return { photoCount: entries.length };
}

/** Ajoute la liste des photos à la fiche texte (repli sans Google Docs). */
function ajouterPhotosAuTexte(folder, photos) {
  var it = folder.getFilesByName('Fiche commande.txt');
  if (!it.hasNext()) {
    return;
  }
  var file = it.next();
  var lignes = photos.map(function (p) {
    var caption = clean(p.caption, 300);
    var texte = clean(p.text, MAX_PHOTO_TEXT);
    var titre = 'Photo ' + padNumber(Number(p.index) || 0) + (p.isCover ? ' — COUVERTURE' : '');
    if (!caption && !texte) {
      return titre + '\n    (sans texte)';
    }
    return titre +
      (caption ? '\n    Légende : ' + caption : '') +
      (texte ? '\n    ' + texte : '');
  });
  file.setContent(file.getBlob().getDataAsString() +
    '\n== PHOTOS, LÉGENDES ET TEXTES ==\n\n' + lignes.join('\n\n') + '\n');
}

// ===== Outils Drive / Sheet =====

function getOrCreateRootFolder() {
  var it = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function getOrCreateSubFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function getOrderFolder(orderId) {
  // Le numéro de commande doit avoir la forme que nous générons : cela empêche
  // d'aller chercher un dossier arbitraire du Drive.
  var id = clean(orderId, 40);
  if (!/^CMD-\d{8}-\d{6}$/.test(id)) {
    throw new Error('Numéro de commande invalide.');
  }
  var folderId = PropertiesService.getScriptProperties().getProperty(id);
  if (folderId) {
    return DriveApp.getFolderById(folderId);
  }
  var it = getOrCreateRootFolder().getFolders();
  while (it.hasNext()) {
    var folder = it.next();
    if (folder.getName().indexOf(id) === 0) {
      return folder;
    }
  }
  throw new Error('Commande introuvable.');
}

function getOrCreateSheet(rootFolder) {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID');
  var ss = null;
  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (e) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(SPREADSHEET_NAME);
    DriveApp.getFileById(ss.getId()).moveTo(rootFolder);
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F5C542');
  }
  return sheet;
}

function updateOrderRow(orderId, updates) {
  var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!ssId) {
    return;
  }
  var sheet = SpreadsheetApp.openById(ssId).getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return;
  }
  var ids = sheet.getRange(1, 2, sheet.getLastRow(), 1).getValues();
  for (var row = 1; row < ids.length; row++) {
    if (ids[row][0] === orderId) {
      var rowNumber = row + 1;
      if (updates.statut) {
        sheet.getRange(rowNumber, 3).setValue(updates.statut);
      }
      if (updates.photosRecues !== undefined) {
        sheet.getRange(rowNumber, 18).setValue(updates.photosRecues);
      }
      return;
    }
  }
}

function padNumber(n) {
  n = Number(n) || 0;
  return n < 10 ? '0' + n : String(n);
}
