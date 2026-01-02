# 🚨 SOLUCIÓN DEFINITIVA - INSTAGRAM WEBHOOKS

## ⚠️ PROBLEMA IDENTIFICADO

Meta NO está enviando peticiones POST al webhook cuando llegan mensajes.

## 🔍 CAUSAS POSIBLES Y SOLUCIONES

### 1. ⚠️ CAUSA MÁS COMÚN: Permisos no aprobados

Instagram requiere que ciertos permisos estén **APROBADOS** por Meta, no solo agregados.

#### Verificación:
1. Ve a https://developers.facebook.com
2. Selecciona tu App
3. Ve a **"Revisión de la app"** o **"App Review"**
4. Busca estos permisos:
   - `instagram_manage_messages`
   - `instagram_basic`
   - `pages_messaging`

#### Solución:
Si estos permisos están en estado "En revisión" o "No solicitado":
1. Haz clic en "Solicitar"
2. Completa el formulario
3. **MIENTRAS ESPERAS LA APROBACIÓN**, agrega tu cuenta como **tester**:
   - Ve a "Roles" → "Roles de prueba"
   - Agrega tu cuenta de Instagram como tester
   - Acepta la invitación desde Instagram

---

### 2. ⚠️ Modo de la App

#### Verificación:
1. Ve a Configuración → Básico
2. Verifica el "Modo de la app"

#### Solución:
- Si está en **"Desarrollo"**: Solo funcionará con cuentas de prueba
- Cambia a **"Live"** para que funcione con cualquier cuenta
- O agrega cuentas de prueba en "Roles"

---

### 3. ⚠️ Primera respuesta manual requerida

Instagram requiere que respondas manualmente el primer mensaje antes de activar webhooks.

#### Solución:
1. Abre Instagram con la cuenta @morsalcorp
2. Ve a mensajes directos
3. Responde manualmente al mensaje
4. Pide que te envíen otro mensaje
5. ESE mensaje debería llegar al webhook

---

### 4. ⚠️ Webhook no suscrito correctamente

#### Verificación:
1. Ve a Instagram → Webhooks en Meta
2. En "2. Generar tokens de acceso"
3. Verifica que el toggle esté en AZUL

#### Solución:
1. Desactiva el toggle (gris)
2. Espera 5 segundos
3. Actívalo de nuevo (azul)
4. Prueba enviar un mensaje

---

### 5. ⚠️ Token expirado o inválido

#### Verificación:
Ejecuta este comando:

\`\`\`bash
node diagnostic-instagram.js
\`\`\`

Si dice "Error 401" o "Invalid token", el token expiró.

#### Solución:
1. Ve a Meta → Instagram → Generar tokens
2. Haz clic en "Generar token" de nuevo
3. Copia el NUEVO token
4. Actualízalo en ZonoChat

---

### 6. ⚠️ Cuenta de Instagram no es de tipo "Negocio"

#### Verificación:
1. Abre Instagram
2. Ve al perfil de @morsalcorp
3. Toca "Editar perfil"
4. Verifica que diga "Cuenta profesional" o "Cuenta de empresa"

#### Solución:
Si es cuenta personal:
1. Ve a Configuración → Cuenta
2. Cambia a "Cuenta profesional"
3. Selecciona "Empresa" o "Creador"
4. Conecta con tu página de Facebook

---

## 🧪 PRUEBA DEFINITIVA

### Paso 1: Verificar que Meta puede alcanzar el webhook

Desde PowerShell, ejecuta:

\`\`\`powershell
Invoke-WebRequest -Uri "https://vinously-superobedient-mildred.ngrok-free.dev/api/webhooks/instagram" -Method POST -ContentType "application/json" -Body '{"object":"instagram","entry":[{"id":"test","time":1234567890,"messaging":[{"sender":{"id":"test"},"recipient":{"id":"test"},"timestamp":1234567890,"message":{"mid":"test","text":"test"}}]}]}'
\`\`\`

**Resultado esperado**: Deberías ver logs en el backend procesando el mensaje.

### Paso 2: Verificar permisos con Graph API

Ejecuta:

\`\`\`bash
curl "https://graph.instagram.com/v18.0/me/subscribed_apps?access_token=TU_TOKEN"
\`\`\`

**Resultado esperado**: Debe mostrar que tu app está suscrita.

---

## 📞 ACCIÓN INMEDIATA

Por favor haz lo siguiente EN ESTE ORDEN:

1. **Verifica el modo de la app** (Desarrollo vs Live)
2. **Verifica los permisos** (¿están aprobados?)
3. **Desactiva y reactiva el toggle** de suscripción
4. **Responde manualmente** un mensaje en Instagram
5. **Pide que te envíen otro mensaje**
6. **Observa ngrok** - ¿aparece POST?

Si después de esto SIGUE sin funcionar, comparte:
- Captura del modo de la app
- Captura de los permisos
- Captura de la sección de webhooks completa

---

**Creado**: 2026-01-02 00:13
**Prioridad**: CRÍTICA
**Estado**: Esperando verificación de permisos
