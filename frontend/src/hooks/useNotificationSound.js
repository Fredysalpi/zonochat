import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para reproducir sonidos de notificación
 * Usa múltiples técnicas para garantizar que el audio SIEMPRE funcione
 */
export const useNotificationSound = () => {
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const audioBufferRef = useRef(null);

    useEffect(() => {
        // Método 1: Audio tradicional
        audioRef.current = new Audio('/src/sonido/notification.mp3');
        audioRef.current.volume = 0.7;
        audioRef.current.preload = 'auto';
        audioRef.current.load();

        // Método 2: Web Audio API (más confiable para autoplay)
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();

            // Cargar el archivo de audio
            fetch('/src/sonido/notification.mp3')
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContextRef.current.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    audioBufferRef.current = audioBuffer;
                    console.log('✅ Audio cargado y listo (Web Audio API)');
                })
                .catch(error => {
                    console.warn('⚠️ Error al cargar audio con Web Audio API:', error);
                });
        } catch (error) {
            console.warn('⚠️ Web Audio API no disponible:', error);
        }

        // Intentar desbloquear audio inmediatamente
        const unlockAudio = async () => {
            try {
                if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                }
                if (audioRef.current) {
                    const playPromise = audioRef.current.play();
                    if (playPromise) {
                        playPromise.then(() => {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                        }).catch(() => { });
                    }
                }
            } catch (error) {
                // Silenciar errores
            }
        };

        // Intentar desbloquear inmediatamente
        setTimeout(unlockAudio, 100);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playNotification = () => {
        // Intentar con Web Audio API primero (más confiable)
        if (audioContextRef.current && audioBufferRef.current) {
            try {
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBufferRef.current;

                const gainNode = audioContextRef.current.createGain();
                gainNode.gain.value = 0.7; // Volumen 70%

                source.connect(gainNode);
                gainNode.connect(audioContextRef.current.destination);

                source.start(0);
                console.log('🔔 Sonido reproducido (Web Audio API)');
                return;
            } catch (error) {
                console.warn('⚠️ Error con Web Audio API, intentando método tradicional');
            }
        }

        // Fallback: Audio tradicional
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('🔔 Sonido reproducido (Audio tradicional)');
                    })
                    .catch(error => {
                        console.error('❌ No se pudo reproducir el sonido:', error);
                    });
            }
        }
    };

    return { playNotification };
};

export default useNotificationSound;
