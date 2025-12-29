# ✅ Checklist de Configuración - ZonoChat

Marca cada paso a medida que lo completes:

---

## 📱 FASE 1: Configuración de Meta (Facebook)

### Cuenta y App
- [ ] Tengo cuenta de Facebook
- [ ] Entré a https://developers.facebook.com/
- [ ] Creé una nueva app tipo "Business"
- [ ] Nombre de mi app: ___________________

---

## 💬 FASE 2: WhatsApp Business API

### Configuración Básica
- [ ] Agregué el producto "WhatsApp" a mi app
- [ ] Estoy en la página "Getting Started"
- [ ] Veo el número de prueba de WhatsApp

### Obtener Tokens
- [ ] Copié el `Access Token` (empieza con EAA...)
- [ ] Copié el `Phone Number ID` (números)
- [ ] Copié el `WhatsApp Business Account ID` (números)

### Número de Prueba
- [ ] Agregué mi número personal para pruebas
- [ ] Recibí el código de verificación en WhatsApp
- [ ] Ingresé el código correctamente

### Prueba de Envío
- [ ] Envié un mensaje de prueba desde Meta
- [ ] **RECIBÍ el mensaje en mi WhatsApp** ✅

---

## 📘 FASE 3: Facebook Messenger

### Página de Facebook
- [ ] Tengo una página de Facebook
  - Si NO: [ ] Creé una nueva página
  - Nombre de mi página: ___________________

### Configuración
- [ ] Agregué el producto "Messenger" a mi app
- [ ] Conecté mi página de Facebook
- [ ] Generé el `Page Access Token`
- [ ] Copié el token

### Prueba
- [ ] Envié un mensaje a mi página
- [ ] Veo el mensaje en la bandeja de la página ✅

---

## 📸 FASE 4: Instagram

### Cuenta de Instagram
- [ ] Tengo cuenta de Instagram
- [ ] Es una cuenta **Business** (no personal)
- [ ] Está conectada a mi página de Facebook

### Configuración
- [ ] Agregué el producto "Instagram" a mi app
- [ ] Conecté mi cuenta de Instagram Business
- [ ] Generé el `Access Token`
- [ ] Copié el token

---

## ⚙️ FASE 5: Configuración del Backend

### Archivo .env
- [ ] Abrí el archivo `backend/.env`
- [ ] Agregué `WHATSAPP_ACCESS_TOKEN`
- [ ] Agregué `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Agregué `WHATSAPP_BUSINESS_ACCOUNT_ID`
- [ ] Agregué `WHATSAPP_VERIFY_TOKEN` (lo inventé yo)
- [ ] Agregué `MESSENGER_PAGE_ACCESS_TOKEN`
- [ ] Agregué `MESSENGER_VERIFY_TOKEN` (lo inventé yo)
- [ ] Agregué `INSTAGRAM_ACCESS_TOKEN`
- [ ] Agregué `INSTAGRAM_VERIFY_TOKEN` (lo inventé yo)
- [ ] Guardé el archivo

### Reiniciar Backend
- [ ] Detuve el backend (Ctrl+C)
- [ ] Reinicié con `npm run dev`
- [ ] No hay errores en la consola ✅

---

## 🌐 FASE 6: Configurar Webhooks (Desarrollo Local)

### Instalar ngrok
- [ ] Instalé ngrok: `npm install -g ngrok`
  - O descargué de https://ngrok.com/download

### Iniciar ngrok
- [ ] Abrí una terminal nueva
- [ ] Ejecuté: `ngrok http 3000`
- [ ] Copié la URL: `https://__________.ngrok.io`

### Configurar WhatsApp Webhook
- [ ] Fui a mi app → WhatsApp → Configuration
- [ ] Click en "Edit" en Webhook
- [ ] Callback URL: `https://__________.ngrok.io/api/webhooks/whatsapp`
- [ ] Verify Token: (el que puse en .env)
- [ ] Click "Verify and Save"
- [ ] **Apareció ✅ verificado**
- [ ] Me suscribí a: `messages`

### Configurar Messenger Webhook
- [ ] Fui a Messenger → Settings → Webhooks
- [ ] Callback URL: `https://__________.ngrok.io/api/webhooks/messenger`
- [ ] Verify Token: (el que puse en .env)
- [ ] Click "Verify and Save"
- [ ] **Apareció ✅ verificado**
- [ ] Me suscribí a: `messages`, `messaging_postbacks`

### Configurar Instagram Webhook
- [ ] Fui a Instagram → Configuration
- [ ] Callback URL: `https://__________.ngrok.io/api/webhooks/instagram`
- [ ] Verify Token: (el que puse en .env)
- [ ] Click "Verify and Save"
- [ ] **Apareció ✅ verificado**
- [ ] Me suscribí a: `messages`

---

## 🧪 FASE 7: PRUEBAS

### Probar WhatsApp
- [ ] Envié un mensaje al número de prueba de Meta
- [ ] Vi en la consola: `📥 Webhook de WhatsApp recibido`
- [ ] Vi en la consola: `📨 Procesando mensaje`
- [ ] Vi en la consola: `💾 Mensaje guardado`
- [ ] **El mensaje apareció en ZonoChat** ✅

### Probar Messenger
- [ ] Envié un mensaje a mi página de Facebook
- [ ] Vi en la consola: `📥 Webhook de Messenger recibido`
- [ ] **El mensaje apareció en ZonoChat** ✅

### Probar Instagram
- [ ] Envié un DM a mi cuenta de Instagram Business
- [ ] Vi en la consola: `📥 Webhook de Instagram recibido`
- [ ] **El mensaje apareció en ZonoChat** ✅

### Probar Respuestas
- [ ] Respondí desde ZonoChat a un mensaje de WhatsApp
- [ ] **El usuario recibió mi respuesta** ✅
- [ ] Respondí desde ZonoChat a un mensaje de Messenger
- [ ] **El usuario recibió mi respuesta** ✅
- [ ] Respondí desde ZonoChat a un mensaje de Instagram
- [ ] **El usuario recibió mi respuesta** ✅

---

## 🎉 RESULTADO FINAL

### Todo Funcionando
- [ ] WhatsApp: Recibo y envío mensajes ✅
- [ ] Messenger: Recibo y envío mensajes ✅
- [ ] Instagram: Recibo y envío mensajes ✅
- [ ] Los mensajes aparecen en tiempo real ✅
- [ ] Los agentes pueden responder ✅

---

## 📊 Mi Progreso

**Completado**: _____ / 70 pasos

**Estado actual**: 
- [ ] Aún no empecé
- [ ] En progreso (Fase ___)
- [ ] ¡Todo funcionando! 🎉

---

## 🆘 Si algo no funciona

**Anota aquí el problema**:
```
Paso donde me quedé: _______________________

Error que veo: _______________________

Logs de la consola: _______________________
```

**Comparte esto para recibir ayuda específica** 🚀

---

## 📝 Notas Importantes

- Los tokens temporales de Meta expiran en 24 horas
- ngrok debe estar corriendo mientras pruebas
- El backend debe estar corriendo (npm run dev)
- Para producción, necesitarás un servidor con dominio y SSL
