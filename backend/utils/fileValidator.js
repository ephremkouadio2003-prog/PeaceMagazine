/**
 * Validateur de fichiers pour les uploads base64
 * ⚠️ SÉCURITÉ: Validation stricte du contenu réel des fichiers
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES];

// Magic bytes pour vérifier le type réel du fichier (premiers octets)
const FILE_SIGNATURES = {
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF, 0xE0], // JPEG avec JFIF
        [0xFF, 0xD8, 0xFF, 0xE1], // JPEG avec EXIF
        [0xFF, 0xD8, 0xFF, 0xDB]  // JPEG brut
    ],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/webp': [
        [0x52, 0x49, 0x46, 0x46], // RIFF
        // WebP: RIFF...WEBP (vérifié après)
    ],
    'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
    ]
};

class FileValidator {
    /**
     * Vérifier le type réel du fichier via magic bytes
     * ⚠️ SÉCURITÉ: Vérifie le contenu réel, pas seulement l'extension/MIME déclaré
     */
    static verifyFileContent(buffer, declaredMimeType) {
        if (!buffer || buffer.length < 8) {
            return { valid: false, error: 'Fichier trop petit ou invalide' };
        }

        const bytes = Array.from(buffer.slice(0, 16)); // Lire les 16 premiers octets

        // Vérifier JPEG
        if (declaredMimeType === 'image/jpeg' || declaredMimeType === 'image/jpg') {
            const jpegSignatures = FILE_SIGNATURES['image/jpeg'];
            for (const sig of jpegSignatures) {
                if (bytes.slice(0, sig.length).every((b, i) => b === sig[i])) {
                    return { valid: true, detectedType: 'image/jpeg' };
                }
            }
        }

        // Vérifier PNG
        if (declaredMimeType === 'image/png') {
            const pngSignature = FILE_SIGNATURES['image/png'][0];
            if (bytes.slice(0, pngSignature.length).every((b, i) => b === pngSignature[i])) {
                return { valid: true, detectedType: 'image/png' };
            }
        }

        // Vérifier WebP
        if (declaredMimeType === 'image/webp') {
            // WebP: RIFF (4 bytes) + taille (4 bytes) + WEBP (4 bytes)
            if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
                // Vérifier "WEBP" aux positions 8-11
                if (buffer.length >= 12) {
                    const webpBytes = Array.from(buffer.slice(8, 12));
                    if (webpBytes[0] === 0x57 && webpBytes[1] === 0x45 && 
                        webpBytes[2] === 0x42 && webpBytes[3] === 0x50) {
                        return { valid: true, detectedType: 'image/webp' };
                    }
                }
            }
        }

        // Vérifier GIF
        if (declaredMimeType === 'image/gif') {
            const gifSignatures = FILE_SIGNATURES['image/gif'];
            for (const sig of gifSignatures) {
                if (bytes.slice(0, sig.length).every((b, i) => b === sig[i])) {
                    return { valid: true, detectedType: 'image/gif' };
                }
            }
        }

        return { 
            valid: false, 
            error: `Type de fichier réel ne correspond pas au type déclaré (${declaredMimeType}). Possible fichier malveillant.` 
        };
    }

    /**
     * Détecter les fichiers suspects (scripts, exécutables, etc.)
     */
    static detectSuspiciousContent(buffer) {
        const suspiciousPatterns = [
            { name: 'PHP', bytes: [0x3C, 0x3F, 0x70, 0x68, 0x70] }, // <?php
            { name: 'JavaScript', bytes: [0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74] }, // <script
            { name: 'Executable', bytes: [0x4D, 0x5A] }, // MZ (PE executable)
            { name: 'ELF', bytes: [0x7F, 0x45, 0x4C, 0x46] }, // ELF executable
        ];

        for (const pattern of suspiciousPatterns) {
            const found = buffer.slice(0, 100).includes(Buffer.from(pattern.bytes));
            if (found) {
                return { suspicious: true, type: pattern.name };
            }
        }

        return { suspicious: false };
    }

    /**
     * Valider un fichier base64 avec vérification du contenu réel
     * ⚠️ SÉCURITÉ: Vérifie le contenu réel, pas seulement le MIME déclaré
     */
    static validateBase64File(base64Data, filename, maxSize = MAX_FILE_SIZE) {
        const errors = [];

        // Vérifier le format base64
        const base64Regex = /^data:([A-Za-z0-9+/]+);base64,(.+)$/;
        const matches = base64Data.match(base64Regex);

        if (!matches) {
            errors.push('Format base64 invalide. Format attendu: data:image/jpeg;base64,...');
            return { valid: false, errors };
        }

        const declaredMimeType = matches[1];
        const base64Content = matches[2];

        // Vérifier le type MIME déclaré
        if (!ALLOWED_MIME_TYPES.includes(declaredMimeType)) {
            errors.push(`Type de fichier non autorisé: ${declaredMimeType}. Types autorisés: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
        }

        // Vérifier la taille et décoder
        try {
            const buffer = Buffer.from(base64Content, 'base64');
            const sizeInBytes = buffer.length;

            if (sizeInBytes > maxSize) {
                const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
                const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
                errors.push(`Fichier trop volumineux: ${sizeInMB}MB (maximum: ${maxSizeMB}MB)`);
            }

            // ⚠️ SÉCURITÉ: Vérifier le contenu réel du fichier (magic bytes)
            if (errors.length === 0) {
                const contentCheck = this.verifyFileContent(buffer, declaredMimeType);
                if (!contentCheck.valid) {
                    errors.push(`⚠️ SÉCURITÉ: ${contentCheck.error}`);
                }
            }

            // ⚠️ SÉCURITÉ: Détecter les contenus suspects
            if (errors.length === 0) {
                const suspiciousCheck = this.detectSuspiciousContent(buffer);
                if (suspiciousCheck.suspicious) {
                    errors.push(`⚠️ SÉCURITÉ: Contenu suspect détecté (${suspiciousCheck.type}). Fichier rejeté.`);
                }
            }

            // Vérifier le nom de fichier
            if (!filename || filename.trim().length === 0) {
                errors.push('Nom de fichier requis');
            }

            if (filename && filename.length > 255) {
                errors.push('Nom de fichier trop long (maximum 255 caractères)');
            }

            // Sanitizer le nom de fichier (enlever les caractères dangereux)
            const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

            return {
                valid: errors.length === 0,
                errors,
                mimeType: declaredMimeType,
                size: sizeInBytes,
                buffer,
                sanitizedFilename,
                requiresQuarantine: errors.some(e => e.includes('SÉCURITÉ'))
            };
        } catch (error) {
            errors.push(`Erreur lors du décodage base64: ${error.message}`);
            return { valid: false, errors };
        }
    }

    /**
     * Valider plusieurs fichiers
     */
    static validateFiles(files, maxTotalSize = MAX_TOTAL_SIZE) {
        const errors = [];
        const validatedFiles = [];
        let totalSize = 0;

        if (!Array.isArray(files) || files.length === 0) {
            return { valid: true, files: [], errors: [] };
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!file.data) {
                errors.push(`Fichier ${i + 1}: Données manquantes`);
                continue;
            }

            const validation = this.validateBase64File(
                file.data,
                file.name || `fichier-${i + 1}.jpg`,
                MAX_FILE_SIZE
            );

            if (!validation.valid) {
                errors.push(`Fichier ${i + 1} (${file.name || 'sans nom'}): ${validation.errors.join(', ')}`);
                continue;
            }

            totalSize += validation.size;
            validatedFiles.push({
                ...file,
                validated: validation,
                index: i
            });
        }

        // Vérifier la taille totale
        if (totalSize > maxTotalSize) {
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            const maxTotalSizeMB = (maxTotalSize / (1024 * 1024)).toFixed(2);
            errors.push(`Taille totale des fichiers trop importante: ${totalSizeMB}MB (maximum: ${maxTotalSizeMB}MB)`);
        }

        return {
            valid: errors.length === 0,
            files: validatedFiles,
            errors,
            totalSize
        };
    }

    /**
     * Obtenir l'extension à partir du type MIME
     */
    static getExtensionFromMimeType(mimeType) {
        const mimeToExt = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/gif': '.gif'
        };
        return mimeToExt[mimeType] || '.jpg';
    }

    /**
     * Formater la taille en format lisible
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}

module.exports = FileValidator;






