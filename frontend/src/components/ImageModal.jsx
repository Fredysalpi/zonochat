import { X } from 'lucide-react';
import { useEffect } from 'react';
import './ImageModal.css';

function ImageModal({ imageUrl, onClose }) {
    // Cerrar con tecla Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevenir scroll del body cuando el modal está abierto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="image-modal-close" onClick={onClose}>
                    <X size={24} />
                </button>
                <img src={imageUrl} alt="Imagen ampliada" className="image-modal-content" />
            </div>
        </div>
    );
}

export default ImageModal;
