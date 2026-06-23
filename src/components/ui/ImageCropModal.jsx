import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Button from './button';
import { FaSave, FaTimes } from 'react-icons/fa';

export default function ImageCropModal({ isOpen, onClose, imageSrc, onCropComplete }) {
    const { t } = useTranslation();
    const [crop, setCrop] = useState({
        unit: '%',
        width: 50,
        aspect: 1,
        x: 25,
        y: 25,
    });
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    useEffect(() => {
        if (isOpen && imageSrc) {
            // Reset crop when modal opens
            setCrop({
                unit: '%',
                width: 50,
                aspect: 1,
                x: 25,
                y: 25,
            });
            setCompletedCrop(null);
        }
    }, [isOpen, imageSrc]);

    const onLoad = useCallback((img) => {
        imgRef.current = img;
        // Set initial completed crop
        const width = img.width * 0.5;
        const height = width; // aspect 1:1
        setCompletedCrop({
            unit: 'px',
            width: width,
            height: height,
            x: img.width * 0.25,
            y: img.height * 0.25,
        });
    }, []);

    const generateCroppedImage = useCallback(async () => {
        const image = imgRef.current;
        const cropData = completedCrop;

        if (!image || !cropData || !cropData.width || !cropData.height) {
            console.error('Missing image or crop data');
            return null;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('No 2d context');
            return null;
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Set canvas to crop size
        const pixelCrop = {
            x: cropData.x * scaleX,
            y: cropData.y * scaleY,
            width: cropData.width * scaleX,
            height: cropData.height * scaleY,
        };

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        console.error('Canvas is empty');
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    resolve(blob);
                },
                'image/jpeg',
                0.95
            );
        });
    }, [completedCrop]);

    const handleSave = async () => {
        try {
            const croppedImage = await generateCroppedImage();
            if (croppedImage) {
                onCropComplete(croppedImage);
            } else {
                console.error('Failed to generate cropped image');
            }
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {t("ui.imageCrop.title")}
                </h2>

                <div className="mb-6 flex justify-center">
                    {imageSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                onLoad={onLoad}
                                alt="Crop preview"
                                className="max-w-full max-h-[60vh] object-contain"
                            />
                        </ReactCrop>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <FaTimes className="h-4 w-4" />
                        {t("ui.imageCrop.cancel")}
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <FaSave className="h-4 w-4" />
                        {t("ui.imageCrop.save")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
