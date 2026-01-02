# 🔐 PERMISOS DE INSTAGRAM - PROBLEMA IDENTIFICADO

## ❌ PROBLEMA ACTUAL

Cuando desactivas `message_edit` en los campos del webhook, NO llega nada.
Cuando lo activas, SÍ llegan eventos.

**Esto significa**: Instagram solo está enviando eventos de `message_edit`, NO mensajes normales.

---

## 🎯 CAUSA RAÍZ

Tu app está en **modo desarrollo** sin permisos aprobados. Meta restringe qué eventos puede recibir:

| Permiso | Estado Actual | Eventos que Permite |
|---------|---------------|---------------------|
| `instagram_basic` | ✅ Agregado | Información básica |
| `instagram_manage_comments` | ✅ Agregado | Comentarios |
| `instagram_manage_messages` | ⚠️ NO APROBADO | **Solo message_edit** |

---

## ✅ SOLUCIÓN 1: AGREGAR TESTERS (RÁPIDO)

### Paso 1: Agregar Testers
1. Ve a https://developers.facebook.com
2. Selecciona tu app "ZonoChat"
3. Ve a **"Roles"** en el menú lateral
4. Haz clic en **"Testers"** o **"Roles de prueba"**
5. Haz clic en **"Add Testers"**
6. Ingresa las cuentas de Instagram que quieres probar
7. Haz clic en **"Submit"**

### Paso 2: Aceptar Invitación
1. Abre Instagram con las cuentas invitadas
2. Ve a Configuración → Cuenta → Apps y sitios web
3. Acepta la invitación de "ZonoChat"

### Paso 3: Probar
1. Envía un mensaje desde una cuenta tester
2. Debería llegar como `message` normal, no `message_edit`

---

## ✅ SOLUCIÓN 2: SOLICITAR APROBACIÓN (DEFINITIVO)

### Paso 1: Ir a App Review
1. Ve a https://developers.facebook.com
2. Selecciona tu app "ZonoChat"
3. Ve a **"App Review"** → **"Permissions and Features"**

### Paso 2: Solicitar Permiso
1. Busca **`instagram_manage_messages`**
2. Haz clic en **"Request Advanced Access"**
3. Completa el formulario:

**¿Para qué usarás este permiso?**
```
Sistema de atención al cliente omnicanal (ZonoChat) que permite a empresas 
recibir y responder mensajes de Instagram Direct de manera centralizada, 
junto con otros canales como Messenger, WhatsApp y Telegram.
```

**¿Cómo lo usarás?**
```
- Recibir mensajes de clientes vía webhook
- Mostrar mensajes en panel de atención al cliente
- Permitir a agentes responder mensajes
- Gestionar tickets de soporte
- Mejorar tiempo de respuesta a clientes
```

4. Adjunta capturas de pantalla de ZonoChat funcionando
5. Haz clic en **"Submit"**

### Paso 3: Esperar Aprobación
- Meta revisará en 1-7 días
- Recibirás un email con la decisión
- Si aprueban, los mensajes normales funcionarán inmediatamente

---

## 🧪 VERIFICAR ESTADO ACTUAL

Ejecuta este comando para ver qué permisos tienes:

```bash
curl "https://graph.instagram.com/v18.0/me/permissions?access_token=TU_TOKEN"
```

Deberías ver algo como:
```json
{
  "data": [
    {
      "permission": "instagram_basic",
      "status": "granted"
    },
    {
      "permission": "instagram_manage_messages",
      "status": "declined" // ← Este es el problema
    }
  ]
}
```

---

## 📋 CHECKLIST

Mientras esperas aprobación:

- [ ] Deja `message_edit` activado en webhooks
- [ ] Agrega cuentas como testers
- [ ] Solicita aprobación de `instagram_manage_messages`
- [ ] Configura WhatsApp (no tiene estas restricciones)
- [ ] Configura Telegram (no tiene estas restricciones)

---

## 💡 RECOMENDACIÓN

**Mientras esperas la aprobación de Instagram**:

1. ✅ **Usa Messenger** - Ya funciona perfectamente
2. ✅ **Configura WhatsApp** - No tiene restricciones
3. ✅ **Configura Telegram** - Más simple, sin restricciones

El código de Instagram está 100% listo. Solo falta que Meta apruebe los permisos.

---

**Creado**: 2026-01-02 01:10
**Estado**: Esperando aprobación de Meta
**Prioridad**: Configurar otros canales mientras tanto
