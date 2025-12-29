# Archivo de Sonido de Notificación

Para que las notificaciones funcionen con sonido, necesitas agregar un archivo de audio llamado `notification.mp3` en la carpeta `public` del frontend.

## Opciones para obtener el sonido:

### Opción 1: Usar un sonido gratuito de Freesound.org
1. Ve a https://freesound.org/
2. Busca "notification sound" o "message notification"
3. Descarga un sonido corto (1-2 segundos)
4. Renómbralo a `notification.mp3`
5. Colócalo en `frontend/public/notification.mp3`

### Opción 2: Usar un sonido del sistema
Puedes usar cualquier sonido corto de tu sistema operativo y convertirlo a MP3.

### Opción 3: Generar un beep simple
Si prefieres un sonido simple, puedes usar herramientas online como:
- https://www.beepgenerator.net/
- https://onlinetonegenerator.com/

## Ubicación del archivo:
```
frontend/
  public/
    notification.mp3  <-- Coloca el archivo aquí
```

## Nota:
El sistema funcionará sin el archivo de sonido, pero no reproducirá audio cuando lleguen notificaciones. Las notificaciones visuales seguirán funcionando normalmente.
