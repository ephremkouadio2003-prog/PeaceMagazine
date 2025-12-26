const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { File } = require('../models');

// Configuration du stockage
const storage = multer.memoryStorage();

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
    }
};

// Configuration de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 50 // Maximum 50 fichiers par requête
    }
});

// Middleware d'upload multiple
const uploadMultiple = (fieldName = 'files', maxCount = 50) => {
    return upload.array(fieldName, maxCount);
};

// Middleware d'upload simple
const uploadSingle = (fieldName = 'file') => {
    return upload.single(fieldName);
};

// Traitement et optimisation des images
const processImage = async (buffer, options = {}) => {
    const {
        width = 1920,
        height = 1080,
        quality = 85,
        format = 'jpeg'
    } = options;

    try {
        let sharpInstance = sharp(buffer);

        // Obtenir les métadonnées de l'image
        const metadata = await sharpInstance.metadata();

        // Redimensionner si nécessaire
        if (metadata.width > width || metadata.height > height) {
            sharpInstance = sharpInstance.resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Optimiser selon le format
        switch (format) {
            case 'jpeg':
                sharpInstance = sharpInstance.jpeg({ quality });
                break;
            case 'png':
                sharpInstance = sharpInstance.png({ quality });
                break;
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality });
                break;
            default:
                sharpInstance = sharpInstance.jpeg({ quality });
        }

        return await sharpInstance.toBuffer();
    } catch (error) {
        throw new Error(`Erreur lors du traitement de l'image: ${error.message}`);
    }
};

// Génération d'un nom de fichier unique
const generateFilename = (originalName, type = 'photo') => {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `${type}_${timestamp}_${uuid}${ext}`;
};

// Middleware de traitement des fichiers uploadés
const processUploadedFiles = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next();
        }

        const processedFiles = [];
        const errors = [];

        for (const file of req.files) {
            try {
                // Générer un nom de fichier unique
                const filename = generateFilename(file.originalname, req.body.type || 'photo');
                
                // Traiter l'image si c'est une image
                let processedBuffer = file.buffer;
                if (file.mimetype.startsWith('image/')) {
                    processedBuffer = await processImage(file.buffer, {
                        width: 1920,
                        height: 1080,
                        quality: 85,
                        format: 'jpeg'
                    });
                }

                // Créer l'enregistrement en base de données
                const fileRecord = await File.create({
                    originalName: file.originalname,
                    filename: filename,
                    mimetype: file.mimetype,
                    size: processedBuffer.length,
                    path: `uploads/${filename}`,
                    type: req.body.type || 'photo',
                    uploadedBy: req.user?.id,
                    orderId: req.body.orderId,
                    isPublic: req.body.isPublic === 'true',
                    metadata: {
                        originalSize: file.size,
                        processedSize: processedBuffer.length,
                        compressionRatio: Math.round((1 - processedBuffer.length / file.size) * 100)
                    }
                });

                processedFiles.push({
                    fileRecord,
                    buffer: processedBuffer,
                    filename
                });

            } catch (error) {
                errors.push({
                    originalName: file.originalname,
                    error: error.message
                });
            }
        }

        req.processedFiles = processedFiles;
        req.uploadErrors = errors;

        next();
    } catch (error) {
        console.error('Erreur lors du traitement des fichiers:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors du traitement des fichiers',
            error: error.message
        });
    }
};

// Middleware de gestion des erreurs d'upload
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Fichier trop volumineux',
                maxSize: process.env.MAX_FILE_SIZE || '10MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Trop de fichiers uploadés',
                maxCount: 50
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Champ de fichier inattendu'
            });
        }
    }

    if (error.message.includes('Type de fichier non autorisé')) {
        return res.status(400).json({
            success: false,
            message: error.message,
            allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp']
        });
    }

    next(error);
};

// Validation des fichiers
const validateFiles = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Aucun fichier fourni'
        });
    }

    // Vérifier le nombre de fichiers
    const maxFiles = req.body.maxFiles ? parseInt(req.body.maxFiles) : 50;
    if (req.files.length > maxFiles) {
        return res.status(400).json({
            success: false,
            message: `Trop de fichiers. Maximum autorisé: ${maxFiles}`
        });
    }

    // Vérifier la taille totale
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 100 * 1024 * 1024; // 100MB
    if (totalSize > maxTotalSize) {
        return res.status(400).json({
            success: false,
            message: 'Taille totale des fichiers trop importante',
            maxTotalSize: '100MB'
        });
    }

    next();
};

module.exports = {
    upload,
    uploadMultiple,
    uploadSingle,
    processUploadedFiles,
    handleUploadError,
    validateFiles,
    processImage,
    generateFilename
};











