# 🔍 Diagnóstico de Messenger - Checklist

## 1. Verificar que ngrok está funcionando
- [ ] Abrir http://localhost:4040 en el navegador
- [ ] Copiar la URL pública de ngrok (ejemplo: https://xxxx.ngrok-free.app)

## 2. Verificar configuración en Meta for Developers
- [ ] Ir a https://developers.facebook.com/apps
- [ ] Seleccionar tu app
- [ ] Ir a Messenger > Configuración
- [ ] Verificar que la URL del webhook es: `https://TU-URL-NGROK.app/api/webhooks/messenger`
- [ ] Verificar que los siguientes eventos están suscritos:
  - messages
  - messaging_postbacks
  - message_deliveries
  - message_reads

## 3. Verificar variables de entorno (.env)
Asegúrate de tener estas variables configuradas:
```
MESSENGER_PAGE_ACCESS_TOKEN=tu_token_aqui
MESSENGER_VERIFY_TOKEN=tu_verify_token_aqui
```

## 4. Probar el flujo completo

### Paso 1: Enviar mensaje desde Facebook
1. Abre Messenger
2. Busca tu página de Facebook
3. Envía un mensaje de prueba: "Hola desde Messenger"

### Paso 2: Verificar logs del backend
Deberías ver en la consola del backend:
```
📥 Webhook de Messenger recibido: {...}
📨 Procesando mensaje de Messenger: [sender_id]
👤 Nuevo contacto creado: [contact_id]
🎫 Nuevo ticket creado: [ticket_id]
💾 Mensaje guardado: [message_id]
```

### Paso 3: Verificar en el frontend
1. Abre http://localhost:5173
2. Inicia sesión como agente
3. Deberías ver un nuevo ticket en la lista
4. Al hacer clic, deberías ver el mensaje

## 5. Problemas comunes

### El webhook no recibe mensajes
- Verificar que ngrok está corriendo
- Verificar que la URL en Meta está actualizada
- Verificar que los eventos están suscritos

### El mensaje no aparece en el frontend
- Verificar que Socket.IO está conectado (ver consola del navegador)
- Verificar que el agente se unió a la sala del ticket
- Verificar que el evento `message:new` se está emitiendo

### Error de autenticación
- Verificar que el PAGE_ACCESS_TOKEN es correcto
- Verificar que el token no ha expirado

## 6. Comandos útiles para debugging

### Ver logs del backend en tiempo real
```bash
# Los logs ya deberían estar visibles en la terminal donde corre npm run dev
```

### Ver requests de ngrok
```
http://localhost:4040/inspect/http
```

### Probar webhook manualmente
```bash
curl -X POST https://TU-URL-NGROK.app/api/webhooks/messenger \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "messaging": [{
        "sender": {"id": "123456"},
        "message": {"mid": "test", "text": "Test message"}
      }]
    }]
  }'
```
