@echo off
echo ========================================
echo   CONFIGURACION DE ZONOCHAT - BACKEND
echo ========================================
echo.
echo Este script te ayudara a crear el archivo .env
echo.
echo Por favor, responde las siguientes preguntas:
echo.

set /p DB_PASSWORD="Password de MySQL (dejar vacio si no tiene): "
set /p DB_USER="Usuario de MySQL (default: root): "
if "%DB_USER%"=="" set DB_USER=root

echo.
echo Creando archivo .env...
echo.

(
echo # Variables de Entorno - Backend ZonoChat
echo.
echo # BASE DE DATOS
echo DB_HOST=localhost
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_NAME=zonochat
echo DB_PORT=3306
echo.
echo # JWT AUTHENTICATION
echo JWT_SECRET=zonochat_super_secret_key_change_in_production_2025_abc123xyz
echo JWT_EXPIRES_IN=7d
echo.
echo # SERVIDOR
echo PORT=3000
echo NODE_ENV=development
echo FRONTEND_URL=http://localhost:5173
echo.
echo # WHATSAPP BUSINESS API
echo WHATSAPP_API_TOKEN=
echo WHATSAPP_PHONE_ID=
echo WHATSAPP_VERIFY_TOKEN=zonochat_webhook_verify_token
echo WHATSAPP_API_VERSION=v18.0
echo.
echo # FACEBOOK / MESSENGER
echo FB_APP_ID=
echo FB_APP_SECRET=
echo FB_PAGE_ACCESS_TOKEN=
echo FB_VERIFY_TOKEN=zonochat_fb_verify_token
echo.
echo # INSTAGRAM
echo INSTAGRAM_ACCOUNT_ID=
echo INSTAGRAM_ACCESS_TOKEN=
echo.
echo # ARCHIVOS Y UPLOADS
echo MAX_FILE_SIZE=10485760
echo UPLOAD_PATH=./uploads
echo.
echo # SEGURIDAD
echo BCRYPT_ROUNDS=10
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
) > .env

echo.
echo ========================================
echo   Archivo .env creado exitosamente!
echo ========================================
echo.
echo Ubicacion: backend\.env
echo.
echo Ahora puedes iniciar el servidor con:
echo   npm run dev
echo.
pause
