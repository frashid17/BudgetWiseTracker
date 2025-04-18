import { Server as HttpServer } from 'http';

// Simple mock implementation without actual WebSockets to avoid bundling issues
export function setupWebSockets(server: HttpServer) {
  console.log('WebSocket functionality disabled to prevent bundling issues');
  return { on: () => {} };
}

// Simplified notification function that just logs to console
export function sendNotification(userId: number, notification: any) {
  console.log(`[NOTIFICATION for user ${userId}]:`, notification);
  return true;
}
