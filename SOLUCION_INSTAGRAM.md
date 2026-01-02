# 🔍 SOLUCIÓN: Mensajes de Instagram no llegan

## ✅ DIAGNÓSTICO COMPLETADO

Tu configuración en ZonoChat está **100% correcta**:
- ✅ Canal activo
- ✅ Token configurado
- ✅ App suscrita a webhooks

## ❌ PROBLEMA IDENTIFICADO

Los mensajes **no están llegando al webhook** porque:

1. **La URL del webhook no está configurada correctamente en Meta**
2. **O la URL no es accesible desde Internet**

---

## 🔧 SOLUCIÓN PASO A PASO

### PASO 1: Verificar que tu servidor sea accesible

Si estás en **desarrollo local**, necesitas usar **ngrok**:

```bash
# En una terminal nueva
ngrok http 3000
```

Copia la URL que te da ngrok, ejemplo:
```
https://abc123.ngrok.io
```

### PASO 2: Configurar el webhook en Meta for Developers

1. Ve a https://developers.facebook.com
2. Selecciona tu App
3. Ve a **Instagram** → **Webhooks**
4. Haz clic en **"Editar suscripción"**

5. **Configura así**:
   ```
   URL de devolución de llamada: https://abc123.ngrok.io/api/webhooks/instagram
   Token de verificación: zonochat_verify_2024
   ```

6. **Campos a suscribir**: Marca `messages`

7. Haz clic en **"Verificar y guardar"**

### PASO 3: Suscribir tu cuenta de Instagram

1. En la misma página de Webhooks
2. Busca la sección **"Suscripciones de página"**
3. Selecciona tu cuenta de Instagram Business
4. Haz clic en **"Suscribirse"**

### PASO 4: Verificar en los logs

Después de configurar, deberías ver en los logs del backend:

```
🔍 Verificando webhook de Instagram...
✅ Webhook de Instagram verificado
```

### PASO 5: Enviar mensaje de prueba

1. Desde tu cuenta personal de Instagram
2. Envía un mensaje a tu cuenta de negocio
3. Deberías ver en los logs:

```
📨 Webhook de Instagram recibido
📨 Procesando mensaje de Instagram: 123456789
📡 Canal de Instagram encontrado y activo
👤 Nuevo contacto creado: 1
🎫 Nuevo ticket creado: 1
💾 Mensaje guardado: 1
```

---

## 🚨 PROBLEMAS COMUNES

### 1. Error 404 al verificar webhook
**Causa**: La URL no es correcta o el servidor no está corriendo
**Solución**: 
- Verifica que el servidor esté corriendo (`npm run dev`)
- Verifica que la URL sea correcta
- Si usas ngrok, verifica que esté corriendo

### 2. Error 403 al verificar webhook
**Causa**: El verify_token no coincide
**Solución**:
- Usa exactamente `zonochat_verify_2024`
- Sin espacios ni caracteres extra

### 3. Webhook verificado pero no llegan mensajes
**Causa**: La cuenta de Instagram no está suscrita
**Solución**:
- Ve a Webhooks en Meta
- Verifica que tu cuenta de Instagram esté en la lista de suscripciones
- Si no está, haz clic en "Suscribirse"

### 4. Mensajes llegan pero no se crean tickets
**Causa**: Problema en el backend
**Solución**:
- Revisa los logs del backend
- Busca errores en rojo
- Verifica que MySQL esté corriendo

---

## 📋 CHECKLIST FINAL

Antes de enviar un mensaje de prueba, verifica:

- [ ] Servidor backend corriendo (`npm run dev`)
- [ ] Ngrok corriendo (si es desarrollo local)
- [ ] Webhook configurado en Meta con la URL correcta
- [ ] Verify token es `zonochat_verify_2024`
- [ ] Webhook verificado exitosamente (✅ en Meta)
- [ ] Cuenta de Instagram suscrita al webhook
- [ ] Campo `messages` seleccionado en webhooks

---

## 🎯 COMANDO RÁPIDO PARA VERIFICAR

Ejecuta este comando para ver si el webhook es accesible:

```bash
# Reemplaza TU_URL con tu URL de ngrok
curl -X GET "TU_URL/api/webhooks/instagram?hub.mode=subscribe&hub.challenge=test&hub.verify_token=zonochat_verify_2024"
```

**Resultado esperado**: `test`

---

## 📞 SIGUIENTE PASO

1. **Configura el webhook en Meta** con la URL correcta
2. **Envía un mensaje de prueba** desde Instagram
3. **Revisa los logs del backend**
4. **Deberías ver el mensaje en ZonoChat**

Si después de esto aún no funciona, comparte:
- Los logs del backend cuando envías el mensaje
- Una captura de la configuración del webhook en Meta

---

**Última actualización**: 2026-01-01
