@echo off
setlocal EnableDelayedExpansion

:: ============================================================
::  db_backup.bat — MySQL/MariaDB Backup Script
::  Uso: db_backup.bat [full|schema]
:: ============================================================

:: ── Configuración ───────────────────────────────────────────
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=jar-express-secured-api
set BACKUP_DIR=.\backup
set MYSQLDUMP_PATH=C:\xampp\mysql\bin\mysqldump.exe
set RETENTION_DAYS=365
:: ────────────────────────────────────────────────────────────

:: Validar parámetro
set MODE=%1
if "%MODE%"=="" (
    echo [ERROR] Debes indicar el tipo de backup.
    echo.
    echo   Uso: db_backup.bat [full^|schema]
    echo.
    echo   Opciones:
    echo     full    - Backup completo con datos
    echo     schema  - Solo estructura ^(sin datos^)
    echo.
    exit /b 1
)

if /i not "%MODE%"=="full" if /i not "%MODE%"=="schema" (
    echo [ERROR] Parametro no valido: "%MODE%"
    echo   Valores permitidos: full, schema
    exit /b 1
)

:: Crear directorios si no existen
if not exist "%BACKUP_DIR%\full"   mkdir "%BACKUP_DIR%\full"
if not exist "%BACKUP_DIR%\schema" mkdir "%BACKUP_DIR%\schema"
if not exist "%BACKUP_DIR%\logs"   mkdir "%BACKUP_DIR%\logs"

:: Fecha y hora para el nombre del archivo
for /f "tokens=1-3 delims=/" %%a in ("%DATE%") do (
    set DAY=%%a
    set MONTH=%%b
    set YEAR=%%c
)
for /f "tokens=1-2 delims=:." %%a in ("%TIME: =0%") do (
    set HOUR=%%a
    set MIN=%%b
)
set TIMESTAMP=%YEAR%-%MONTH%-%DAY%_%HOUR%%MIN%
set LOGFILE=%BACKUP_DIR%\logs\backup_%TIMESTAMP%.log

echo ============================================================  >> "%LOGFILE%"
echo  DB Backup - %DATE% %TIME%                                    >> "%LOGFILE%"
echo  Modo: %MODE%                                                  >> "%LOGFILE%"
echo ============================================================  >> "%LOGFILE%"

:: ── Verificar que mysqldump existe ──────────────────────────
if not exist "%MYSQLDUMP_PATH%" (
    echo [ERROR] No se encontro mysqldump en:
    echo   %MYSQLDUMP_PATH%
    echo Ajusta la variable MYSQLDUMP_PATH en el script.
    echo [ERROR] mysqldump no encontrado: %MYSQLDUMP_PATH% >> "%LOGFILE%"
    exit /b 1
)

:: ============================================================
::  MODO: SCHEMA
:: ============================================================
if /i "%MODE%"=="schema" (
    set OUTFILE=%BACKUP_DIR%\schema\schema_%DB_NAME%_%TIMESTAMP%.sql
    echo [INFO] Iniciando backup de ESQUEMA...
    echo [INFO] Base de datos : %DB_NAME%
    echo [INFO] Destino       : !OUTFILE!
    echo.

    "%MYSQLDUMP_PATH%" ^
        --host="%DB_HOST%" ^
        --port=%DB_PORT% ^
        --user="%DB_USER%" ^
        --password="%DB_PASSWORD%" ^
        --no-data ^
        --routines ^
        --triggers ^
        --events ^
        --single-transaction ^
        --hex-blob ^
        "%DB_NAME%" > "!OUTFILE!" 2>> "%LOGFILE%"

    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Fallo el backup de esquema. Revisa el log: %LOGFILE%
        echo [ERROR] mysqldump termino con codigo !ERRORLEVEL! >> "%LOGFILE%"
        exit /b 1
    )

    echo [OK] Esquema guardado en: !OUTFILE!
    echo [OK] Backup schema completado: !OUTFILE! >> "%LOGFILE%"
    goto :cleanup
)

:: ============================================================
::  MODO: FULL
:: ============================================================
if /i "%MODE%"=="full" (
    set OUTFILE=%BACKUP_DIR%\full\full_%DB_NAME%_%TIMESTAMP%.sql
    echo [INFO] Iniciando backup COMPLETO...
    echo [INFO] Base de datos : %DB_NAME%
    echo [INFO] Destino       : !OUTFILE!
    echo.

    "%MYSQLDUMP_PATH%" ^
        --host="%DB_HOST%" ^
        --port=%DB_PORT% ^
        --user="%DB_USER%" ^
        --password="%DB_PASSWORD%" ^
        --single-transaction ^
        --routines ^
        --triggers ^
        --events ^
        --hex-blob ^
        --compress ^
        "%DB_NAME%" > "!OUTFILE!" 2>> "%LOGFILE%"

    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Fallo el backup completo. Revisa el log: %LOGFILE%
        echo [ERROR] mysqldump termino con codigo !ERRORLEVEL! >> "%LOGFILE%"
        exit /b 1
    )

    echo [OK] Backup completo guardado en: !OUTFILE!
    echo [OK] Backup full completado: !OUTFILE! >> "%LOGFILE%"
    goto :cleanup
)

:: ============================================================
::  LIMPIEZA — eliminar backups antiguos
:: ============================================================
:cleanup
echo.
echo [INFO] Eliminando backups de mas de %RETENTION_DAYS% dias...

forfiles /p "%BACKUP_DIR%\full"   /s /m *.sql /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
forfiles /p "%BACKUP_DIR%\schema" /s /m *.sql /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
forfiles /p "%BACKUP_DIR%\logs"   /s /m *.log /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul

echo [INFO] Limpieza completada.
echo [INFO] Limpieza completada >> "%LOGFILE%"

echo.
echo ============================================================
echo  Backup finalizado correctamente  [%MODE%]
echo  Timestamp : %TIMESTAMP%
echo  Log       : %LOGFILE%
echo ============================================================
echo.

endlocal
exit /b 0
