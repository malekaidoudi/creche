/**
 * Service d'upload direct vers Cloudinary
 * Permet d'uploader les fichiers directement depuis le navigateur vers Cloudinary
 * sans passer par le backend, réduisant le temps d'upload de moitié
 */

import api from './api';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

/**
 * Obtenir une signature pour l'upload sécurisé
 */
async function getUploadSignature() {
    try {
        const response = await api.post('/api/cloudinary/signature');
        return response.data;
    } catch (error) {
        console.error('❌ Erreur obtention signature Cloudinary:', error);
        throw new Error('Impossible d\'obtenir la signature d\'upload');
    }
}

/**
 * Compresser une vidéo côté client
 * Utilise l'API Canvas et MediaRecorder pour réduire la taille
 * @param {File} videoFile - Fichier vidéo original
 * @param {Function} onProgress - Callback de progression (0-100)
 * @returns {Promise<Blob>} - Vidéo compressée
 */
async function compressVideo(videoFile, onProgress = () => { }) {
    return new Promise((resolve, reject) => {
        console.log('🎬 Début compression vidéo:', {
            name: videoFile.name,
            size: `${(videoFile.size / 1024 / 1024).toFixed(2)} MB`,
            type: videoFile.type
        });

        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            console.log('📐 Métadonnées vidéo:', {
                duration: `${video.duration.toFixed(1)}s`,
                width: video.videoWidth,
                height: video.videoHeight
            });

            // Calculer la nouvelle résolution (max 720p pour compression)
            let targetWidth = video.videoWidth;
            let targetHeight = video.videoHeight;
            const maxHeight = 720;

            if (targetHeight > maxHeight) {
                const ratio = maxHeight / targetHeight;
                targetHeight = maxHeight;
                targetWidth = Math.round(video.videoWidth * ratio);
            }

            // Assurer que les dimensions sont paires (requis pour certains codecs)
            targetWidth = Math.round(targetWidth / 2) * 2;
            targetHeight = Math.round(targetHeight / 2) * 2;

            console.log('🎯 Résolution cible:', `${targetWidth}x${targetHeight}`);

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            // Vérifier le support de MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
                    ? 'video/webm;codecs=vp8'
                    : 'video/webm';

            console.log('🎥 Codec utilisé:', mimeType);

            // Créer le stream depuis le canvas
            const stream = canvas.captureStream(30); // 30 FPS

            // Ajouter l'audio si présent
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(video);
            const destination = audioCtx.createMediaStreamDestination();
            source.connect(destination);
            source.connect(audioCtx.destination);

            destination.stream.getAudioTracks().forEach(track => {
                stream.addTrack(track);
            });

            // Configurer le MediaRecorder avec un bitrate réduit
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 1500000 // 1.5 Mbps (compression significative)
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                audioCtx.close();
                const blob = new Blob(chunks, { type: mimeType });
                console.log('✅ Compression terminée:', {
                    originalSize: `${(videoFile.size / 1024 / 1024).toFixed(2)} MB`,
                    compressedSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
                    reduction: `${((1 - blob.size / videoFile.size) * 100).toFixed(1)}%`
                });
                resolve(blob);
            };

            mediaRecorder.onerror = (e) => {
                console.error('❌ Erreur MediaRecorder:', e);
                reject(new Error('Erreur lors de la compression'));
            };

            // Démarrer l'enregistrement
            mediaRecorder.start(1000); // Chunk toutes les secondes

            // Jouer la vidéo et dessiner sur le canvas
            let lastTime = 0;
            const drawFrame = () => {
                if (video.paused || video.ended) {
                    mediaRecorder.stop();
                    return;
                }

                // Mettre à jour la progression
                const progress = Math.round((video.currentTime / video.duration) * 100);
                if (progress !== lastTime) {
                    lastTime = progress;
                    onProgress(progress);
                }

                ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                requestAnimationFrame(drawFrame);
            };

            video.onended = () => {
                mediaRecorder.stop();
            };

            video.play().then(() => {
                drawFrame();
            }).catch(reject);
        };

        video.onerror = () => {
            reject(new Error('Erreur de chargement de la vidéo'));
        };

        video.src = URL.createObjectURL(videoFile);
    });
}

/**
 * Upload direct vers Cloudinary avec progression
 * @param {File|Blob} file - Fichier à uploader
 * @param {Object} options - Options d'upload
 * @param {Function} options.onProgress - Callback de progression (0-100)
 * @param {string} options.resourceType - 'image' ou 'video'
 * @param {boolean} options.compress - Compresser la vidéo avant upload
 * @returns {Promise<Object>} - Résultat de l'upload Cloudinary
 */
async function uploadToCloudinary(file, options = {}) {
    const { onProgress = () => { }, resourceType = 'auto', compress = true } = options;

    console.log('☁️ Début upload Cloudinary:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        resourceType,
        compress
    });

    let fileToUpload = file;

    // Compresser les vidéos volumineuses (> 20 MB)
    if (compress && file.type.startsWith('video/') && file.size > 20 * 1024 * 1024) {
        console.log('🗜️ Compression nécessaire (fichier > 20 MB)');
        onProgress(0, 'compression');

        try {
            fileToUpload = await compressVideo(file, (p) => {
                onProgress(Math.round(p * 0.3), 'compression'); // 0-30% pour compression
            });
            console.log('✅ Fichier compressé, début upload');
        } catch (error) {
            console.warn('⚠️ Compression échouée, upload du fichier original:', error.message);
            fileToUpload = file;
        }
    }

    // Obtenir la signature
    onProgress(compress ? 30 : 0, 'signature');
    const signatureData = await getUploadSignature();

    const { cloudName, apiKey, timestamp, signature, folder } = signatureData;

    // Préparer le FormData pour Cloudinary
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    // Upload avec XMLHttpRequest pour avoir la progression
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                // Progression de 30% à 100% (ou 0% à 100% si pas de compression)
                const baseProgress = compress && file.size > 20 * 1024 * 1024 ? 30 : 0;
                const uploadProgress = Math.round((event.loaded / event.total) * (100 - baseProgress));
                onProgress(baseProgress + uploadProgress, 'upload');
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const result = JSON.parse(xhr.responseText);
                console.log('✅ Upload Cloudinary réussi:', {
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    size: `${(result.bytes / 1024 / 1024).toFixed(2)} MB`
                });
                resolve({
                    success: true,
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    resourceType: result.resource_type,
                    bytes: result.bytes,
                    duration: result.duration || null,
                    width: result.width,
                    height: result.height
                });
            } else {
                console.error('❌ Erreur upload Cloudinary:', xhr.status, xhr.responseText);
                reject(new Error(`Erreur upload: ${xhr.status}`));
            }
        };

        xhr.onerror = () => {
            console.error('❌ Erreur réseau upload Cloudinary');
            reject(new Error('Erreur réseau lors de l\'upload'));
        };

        const uploadUrl = `${CLOUDINARY_UPLOAD_URL}/${cloudName}/${resourceType === 'video' ? 'video' : 'image'}/upload`;
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
    });
}

/**
 * Générer une thumbnail pour une vidéo Cloudinary
 * @param {string} videoUrl - URL de la vidéo Cloudinary
 * @returns {string} - URL de la thumbnail
 */
function generateVideoThumbnail(videoUrl) {
    if (!videoUrl || !videoUrl.includes('cloudinary.com')) {
        return null;
    }

    return videoUrl
        .replace('/video/upload/', '/video/upload/so_0,w_800,h_450,c_fill,f_jpg/')
        .replace(/\.(mp4|webm|mov|avi|MOV|MP4)$/i, '.jpg');
}

export default {
    uploadToCloudinary,
    compressVideo,
    generateVideoThumbnail,
    getUploadSignature
};
