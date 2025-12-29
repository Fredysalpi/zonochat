import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import './TypificationModal.css';

function TypificationModal({ isOpen, onClose, onSubmit, ticketId }) {
    const [selectedType, setSelectedType] = useState('');
    const [selectedSubtype, setSelectedSubtype] = useState('');

    const typificationOptions = [
        {
            value: 'contacto_efectivo',
            label: 'Contacto Efectivo',
            subtypes: [
                { value: 'venta_realizada', label: 'Venta Realizada' },
                { value: 'informacion_brindada', label: 'Información Brindada' },
                { value: 'seguimiento_programado', label: 'Seguimiento Programado' }
            ]
        },
        {
            value: 'contacto_no_efectivo',
            label: 'Contacto No Efectivo',
            subtypes: [
                { value: 'cliente_no_responde', label: 'Cliente No Responde' },
                { value: 'chat_vicio', label: 'Chat Vicio' },
                { value: 'numero_equivocado', label: 'Número Equivocado' },
                { value: 'no_interesado', label: 'No Interesado' }
            ]
        }
    ];

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setSelectedSubtype('');
    };

    const handleSubtypeSelect = (subtype) => {
        setSelectedSubtype(subtype);
    };

    const handleSubmit = () => {
        if (!selectedType) {
            alert('Por favor selecciona un tipo de contacto');
            return;
        }

        onSubmit({
            ticketId,
            type: selectedType,
            subtype: selectedSubtype
        });

        // Resetear y cerrar
        setSelectedType('');
        setSelectedSubtype('');
        onClose();
    };

    const handleCancel = () => {
        setSelectedType('');
        setSelectedSubtype('');
        onClose();
    };

    const selectedOption = typificationOptions.find(opt => opt.value === selectedType);

    if (!isOpen) return null;

    return (
        <div className="typification-modal-overlay" onClick={handleCancel}>
            <div className="typification-modal" onClick={(e) => e.stopPropagation()}>
                <div className="typification-modal-header">
                    <h3>Tipificación de Contacto</h3>
                    <button className="close-modal-btn" onClick={handleCancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="typification-modal-body">
                    {!selectedType ? (
                        <div className="typification-list">
                            <p className="list-title">Selecciona el tipo de contacto:</p>
                            {typificationOptions.map((option) => (
                                <button
                                    key={option.value}
                                    className="typification-list-item"
                                    onClick={() => handleTypeSelect(option.value)}
                                >
                                    <span>{option.label}</span>
                                    <ChevronRight size={18} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="typification-list">
                            <button
                                className="back-button"
                                onClick={() => setSelectedType('')}
                            >
                                ← Volver
                            </button>
                            <p className="list-title">{selectedOption?.label}</p>
                            {selectedOption?.subtypes.map((subtype) => (
                                <button
                                    key={subtype.value}
                                    className={`typification-list-item ${selectedSubtype === subtype.value ? 'selected' : ''}`}
                                    onClick={() => handleSubtypeSelect(subtype.value)}
                                >
                                    <span>{subtype.label}</span>
                                    {selectedSubtype === subtype.value && (
                                        <span className="check-mark">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="typification-modal-footer">
                    <button className="btn-cancel" onClick={handleCancel}>
                        Cancelar
                    </button>
                    <button
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={!selectedType}
                    >
                        Guardar Tipificación
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TypificationModal;
