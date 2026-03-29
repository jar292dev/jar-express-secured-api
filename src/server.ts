import app from './app';
import { Server } from 'http';
import { env } from './config/env';


let server: Server;

// ─── Arranque ─────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    // 1. Conectar a la DB
    // console.log('🔌  Conectando a la base de datos...');
    // await connectDB();
    // console.log('✅  Conexión a la base de datos establecida');

    // 2. Iniciar el servidor
    server = app.listen(env.PORT, env.HOST, () => {
      console.log(`🚀 Servidor escuchando en http://${env.HOST}:${env.PORT} en modo ${env.NODE_ENV}`);

      // 3. Arrancar workers (si los hubiera)
      // startWorkers();
    });

  } catch (error) {
    console.error('❌ Error arrancando el servidor:', error);
    process.exit(1);
  }
}


async function shutdown(signal: string): Promise<void> {
    console.log(`\n${signal} recibido — cerrando servidor...`);

    // 1. Dejar de aceptar nuevas conexiones
    server.close(async () => {
        try {
        // 2. Parar workers

        // 3. Desconectar de la DB
        // await disconnectDB();
        
        console.log('✅ Cierre limpio completado');
        process.exit(0);
        } catch (error) {
        console.error('❌ Error durante el cierre:', error);
        process.exit(1);
        }
    });

    // Forzar cierre si tarda más de 10 segundos
    setTimeout(() => {
        console.error('⚠️  Cierre forzado por timeout');
        process.exit(1);
    }, 10_000);
}


// ─── Señales del sistema ──────────────────────────────────────
process.on('SIGTERM', () => shutdown('SIGTERM')); // Podman stop
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C


// ─── Errores no capturados ────────────────────────────────────
process.on('uncaughtException', (error: Error) => {
  console.error('❌ uncaughtException:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ unhandledRejection:', reason);
  process.exit(1);
});

// ─── Iniciar ──────────────────────────────────────────────────
bootstrap();