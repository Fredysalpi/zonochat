# 🔍 CHECKLIST DE VERIFICACIÓN - INSTAGRAM NO RECIBE MENSAJES

## ❓ PREGUNTAS CLAVE

Por favor responde estas preguntas para diagnosticar el problema:

### 1. ¿Qué ves en ngrok cuando envías un mensaje?
- [ ] Aparece un POST /api/webhooks/instagram
- [ ] Solo aparecen GET (health checks)
- [ ] No aparece nada

### 2. ¿Desde qué tipo de cuenta envías el mensaje?
- [ ] Cuenta personal de Instagram
- [ ] Cuenta de negocio de Instagram
- [ ] Cuenta de creador de Instagram

### 3. ¿A qué cuenta envías el mensaje?
- [ ] A @morsalcorp (cuenta de negocio)
- [ ] A otra cuenta

### 4. ¿Cómo envías el mensaje?
- [ ] Desde la app de Instagram en el teléfono
- [ ] Desde Instagram web
- [ ] Desde Direct Messages

### 5. ¿Qué tipo de mensaje envías?
- [ ] Mensaje de texto normal
- [ ] Respuesta a una historia
- [ ] Mensaje con imagen
- [ ] Otro tipo

---

## 🔧 VERIFICACIONES EN META

### Paso 1: Verifica el estado del webhook

1. Ve a https://developers.facebook.com
2. Selecciona tu App
3. Ve a Instagram → Webhooks
4. Haz clic en "Probar" (Test) si está disponible

### Paso 2: Verifica los campos suscritos

En la sección de webhooks, verifica que esté marcado:
- [ ] messages
- [ ] messaging_postbacks (opcional)

### Paso 3: Verifica la suscripción de la cuenta

En la sección "2. Generar tokens de acceso":
- [ ] La cuenta @morsalcorp está en la lista
- [ ] El toggle "Suscripción al webhook" está en AZUL (activado)
- [ ] No hay ningún mensaje de error

### Paso 4: Verifica el modo de la App

1. Ve a Configuración → Básico
2. Verifica:
   - [ ] La app está en modo "Live" o "En producción"
   - [ ] O si está en modo "Desarrollo", tu cuenta está agregada como tester

---

## 🧪 PRUEBA ALTERNATIVA

### Opción 1: Usar la herramienta de prueba de Meta

1. Ve a Instagram → Webhooks en Meta
2. Busca un botón que diga "Probar" o "Test"
3. Envía un evento de prueba
4. Observa si llega al backend

### Opción 2: Verificar con curl

Ejecuta este comando para ver si Meta puede alcanzar tu webhook:

```bash
# Desde Meta, deberían poder hacer esto:
curl -X POST "https://vinously-superobedient-mildred.ngrok-free.dev/api/webhooks/instagram" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "test",
      "time": 1234567890,
      "messaging": [{
        "sender": {"id": "test"},
        "recipient": {"id": "test"},
        "timestamp": 1234567890,
        "message": {
          "mid": "test",
          "text": "test"
        }
      }]
    }]
  }'
```

---

## 🎯 POSIBLES CAUSAS

### Causa 1: La app no tiene permisos aprobados
**Solución**: Ve a Configuración → Permisos y asegúrate de que estén aprobados

### Causa 2: La cuenta no está correctamente vinculada
**Solución**: Desvincula y vuelve a vincular la cuenta de Instagram

### Causa 3: El webhook no está suscrito correctamente
**Solución**: Desactiva y vuelve a activar el toggle de suscripción

### Causa 4: Restricciones de Instagram
**Solución**: Instagram puede tener restricciones sobre qué mensajes se envían al webhook:
- Solo mensajes de cuentas que han iniciado la conversación
- Solo mensajes dentro de la ventana de 24 horas
- Solo mensajes de texto (no respuestas a historias)

### Causa 5: La app está en modo sandbox
**Solución**: Cambia la app a modo producción

---

## 📞 SIGUIENTE PASO

Por favor:

1. **Responde las preguntas de la sección 1**
2. **Verifica los puntos de la sección 2**
3. **Comparte capturas de pantalla de**:
   - La sección de webhooks en Meta
   - La sección de suscripciones
   - Los logs de ngrok cuando envías el mensaje
   - Los logs del backend cuando envías el mensaje

Con esta información podré identificar exactamente qué está fallando.

---

**Creado**: 2026-01-02 00:05
**Estado**: Esperando información para diagnóstico
