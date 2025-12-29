# 🔧 Solución: Instalar ngrok Manualmente

## El problema:
ngrok se cierra inmediatamente en PowerShell

## Solución (5 minutos):

### Paso 1: Descargar ngrok

1. Ve a: https://ngrok.com/download
2. Click en **"Download for Windows"**
3. Se descargará un archivo: `ngrok-v3-stable-windows-amd64.zip`

### Paso 2: Extraer ngrok

1. Ve a tu carpeta de **Descargas**
2. Click derecho en `ngrok-v3-stable-windows-amd64.zip`
3. **"Extraer todo..."**
4. Extrae a: `C:\ngrok\`
   - O cualquier carpeta que prefieras

### Paso 3: Ejecutar ngrok

#### Opción A: Desde la carpeta de ngrok
1. Abre **Explorador de Archivos**
2. Ve a `C:\ngrok\` (o donde lo extrajiste)
3. En la barra de direcciones, escribe: `cmd` y presiona Enter
4. Se abrirá CMD en esa carpeta
5. Ejecuta:
```cmd
ngrok http 3000
```

#### Opción B: Agregar al PATH (para usarlo desde cualquier lugar)
1. Presiona `Win + R`
2. Escribe: `sysdm.cpl` y Enter
3. Pestaña **"Opciones avanzadas"**
4. Click en **"Variables de entorno"**
5. En **"Variables del sistema"**, busca **"Path"**
6. Click **"Editar"**
7. Click **"Nuevo"**
8. Agrega: `C:\ngrok\` (o tu ruta)
9. Click **"Aceptar"** en todo
10. **Cierra y abre una terminal nueva**
11. Ahora puedes ejecutar `ngrok http 3000` desde cualquier lugar

---

## Alternativa RÁPIDA: Usar localtunnel

Si ngrok sigue dando problemas, puedes usar **localtunnel** que es más simple:

### Instalar localtunnel:
```bash
npm install -g localtunnel
```

### Usar localtunnel:
```bash
lt --port 3000
```

Te dará una URL como:
```
your url is: https://funny-cat-12.loca.lt
```

**Ventaja**: Funciona sin problemas en Windows
**Desventaja**: La URL cambia cada vez que lo reinicias

---

## ¿Qué prefieres?

**A)** Descargar ngrok manualmente (más estable)
**B)** Usar localtunnel (más rápido de configurar)
**C)** Intentar arreglar ngrok con npm

Dime cuál prefieres y te guío paso a paso 🚀
