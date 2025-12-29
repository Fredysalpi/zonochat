# INSTRUCCIONES PARA EJECUTAR EL SCRIPT SQL

## Opción 1: MySQL Workbench (Recomendado)
1. Abre MySQL Workbench
2. Conecta a tu servidor MySQL
3. Abre el archivo: `c:\Users\Fredy\Downloads\zonochat\database\create_quick_replies.sql`
4. Haz clic en el botón "Execute" (rayo) o presiona Ctrl+Shift+Enter
5. Verifica que se hayan creado las respuestas rápidas

## Opción 2: phpMyAdmin
1. Abre phpMyAdmin en tu navegador
2. Selecciona la base de datos `zonochat`
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido del archivo `create_quick_replies.sql`
5. Haz clic en "Go" o "Ejecutar"

## Opción 3: Línea de Comandos (si MySQL está instalado)
```bash
# Navega al directorio del proyecto
cd c:\Users\Fredy\Downloads\zonochat

# Ejecuta el script (te pedirá la contraseña)
mysql -u root -p zonochat < database/create_quick_replies.sql
```

## Verificación
Después de ejecutar el script, verifica que la tabla se haya creado correctamente:

```sql
USE zonochat;
SELECT * FROM quick_replies;
```

Deberías ver 8 respuestas rápidas globales de ejemplo.

---

**IMPORTANTE:** Una vez ejecutado el script, recarga el navegador para que los cambios surtan efecto.
