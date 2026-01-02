# ✅ VERIFICACIÓN DE WEBHOOKS - ZONOCHAT

## 🔍 ESTADO ACTUAL

### ✅ Rutas Registradas
```
GET  /api/webhooks/messenger     ✅ Verificación
POST /api/webhooks/messenger     ✅ Recibir mensajes

GET  /api/webhooks/instagram     ✅ Verificación
POST /api/webhooks/instagram     ✅ Recibir mensajes

GET  /api/webhooks/whatsapp      ✅ Verificación
POST /api/webhooks/whatsapp      ✅ Recibir mensajes

POST /api/webhooks/telegram      ✅ Recibir mensajes
POST /api/webhooks/telegram/set  ✅ Configurar webhook
```

---

## 🧪 PRUEBAS RÁPIDAS

### 1. Verificar que el servidor esté corriendo
```bash
# Deberías ver:
# Server running on port 3000
# ✅ Conexión a MySQL exitosa
```

### 2. Probar Webhook de Instagram
Desde Meta for Developers:
1. Ve a tu App → Instagram → Webhooks
2. Haz clic en "Editar suscripción"
3. URL: `https://tu-dominio.com/api/webhooks/instagram`
4. Token: `zonochat_verify_2024`
5. Haz clic en "Verificar y guardar"

**Resultado esperado**: ✅ Verificación exitosa

### 3. Probar Webhook de Messenger
Desde Meta for Developers:
1. Ve a tu App → Messenger → Webhooks
2. Haz clic en "Editar suscripción"
3. URL: `https://tu-dominio.com/api/webhooks/messenger`
4. Token: `zonochat_verify_2024`
5. Haz clic en "Verificar y guardar"

**Resultado esperado**: ✅ Verificación exitosa

### 4. Probar Webhook de WhatsApp
Desde Meta for Developers:
1. Ve a tu App → WhatsApp → Configuración
2. Haz clic en "Editar" en Webhooks
3. URL: `https://tu-dominio.com/api/webhooks/whatsapp`
4. Token: `zonochat_verify_2024`
5. Haz clic en "Verificar y guardar"

**Resultado esperado**: ✅ Verificación exitosa

### 5. Probar Webhook de Telegram
Desde tu terminal o Postman:
```bash
curl -X POST http://localhost:3000/api/webhooks/telegram/set
```

**Resultado esperado**: 
```json
{
  "success": true,
  "message": "Webhook configurado correctamente"
}
```

---

## 📊 LOGS A VERIFICAR

### Cuando configures un webhook, deberías ver:
```
🔍 Verificando webhook de Instagram...
✅ Webhook de Instagram verificado
```

### Cuando llegue un mensaje, deberías ver:
```
📨 Webhook de Instagram recibido
📨 Procesando mensaje de Instagram: 123456789
📡 Canal de Instagram encontrado y activo
👤 Nuevo contacto creado: 5
🎫 Nuevo ticket creado: 10
💾 Mensaje guardado: 25
📊 Ticket actualizado emitido con unread_count: 1
```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error 404 en webhook
**Problema**: `GET /api/webhooks/instagram 404`
**Solución**: 
- Verifica que el servidor esté corriendo
- Verifica que las rutas estén registradas en `routes/webhooks.js`
- Reinicia el servidor con `npm run dev`

### Error 403 en verificación
**Problema**: Webhook no se verifica
**Solución**:
- Verifica que el `verify_token` sea correcto
- Debe ser exactamente `zonochat_verify_2024`
- Verifica que esté configurado en el panel o en `.env`

### No llegan mensajes
**Problema**: Webhook verificado pero no llegan mensajes
**Solución**:
- Verifica que la página/cuenta esté suscrita al webhook
- Verifica que los tokens de acceso sean correctos
- Revisa los logs del backend para ver errores
- Verifica que el canal esté activo en la BD

### Error de conexión a BD
**Problema**: No se crean contactos/tickets
**Solución**:
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que exista el canal en `channel_configs`

---

## 🔧 COMANDOS ÚTILES

### Ver logs en tiempo real
```bash
cd backend
npm run dev
```

### Verificar estado de webhooks en Meta
```bash
# Para Messenger/Instagram/WhatsApp
curl -X GET "https://graph.facebook.com/v18.0/me/subscribed_apps?access_token=TU_TOKEN"
```

### Verificar webhook de Telegram
```bash
curl -X GET "https://api.telegram.org/botTU_BOT_TOKEN/getWebhookInfo"
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Servidor backend corriendo en puerto 3000
- [ ] Servidor frontend corriendo en puerto 5173
- [ ] MySQL corriendo y conectado
- [ ] Ngrok corriendo (si es desarrollo local)
- [ ] Webhook de Messenger verificado
- [ ] Webhook de Instagram verificado
- [ ] Webhook de WhatsApp verificado
- [ ] Webhook de Telegram configurado
- [ ] Canal de Messenger activo en BD
- [ ] Canal de Instagram activo en BD
- [ ] Canal de WhatsApp activo en BD
- [ ] Canal de Telegram activo en BD
- [ ] Tokens configurados correctamente
- [ ] Mensaje de prueba recibido en cada canal

---

## 📞 SIGUIENTE PASO

Una vez que todos los webhooks estén verificados:

1. **Envía un mensaje de prueba** desde cada canal
2. **Verifica que llegue a ZonoChat**
3. **Responde desde ZonoChat**
4. **Verifica que se envíe correctamente**

Si todo funciona, ¡estás listo para usar ZonoChat! 🎉

---

**Última actualización**: 2026-01-01
**Estado**: ✅ Rutas actualizadas y listas
