import { Server as HttpServer } from 'http';

/**
 * WebSocket setup is disabled in development to prevent unwanted client connections
 * or bundling issues. Re-enable when actual WebSocket server is implemented.
 */
export function setupWebSockets(server: HttpServer) {
  if (process.env.ENABLE_WEBSOCKETS === "true") {
    console.log("🟢 WebSocket support enabled.");
    // Place actual WebSocket setup logic here when ready
  } else {
    console.log("🔇 WebSocket functionality disabled to prevent bundling issues");
  }

  return { on: () => {} }; // Stubbed return to keep usage safe
}

/**
 * Mock notification sender — logs to console
 */
export function sendNotification(userId: number, notification: any) {
  console.log(`[NOTIFICATION for user ${userId}]:`, notification);
  return true;
}
