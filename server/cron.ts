import { storage } from './storage';
import { sendNotificationEmail } from './email';

// Initialize cron jobs for scheduled notifications
export function initCronJobs() {
  console.log('Reminder notification system initialized');
  
  // In a production app, we would set up actual scheduled tasks
  // For this demo, we'll provide an endpoint to manually check for reminders
}

// Check for upcoming bills and send reminders
export async function checkUpcomingBills(userId?: number) {
  try {
    // If userId is provided, check reminders only for that user
    // Otherwise get all users
    const userIds = userId ? [userId] : await getUserIds();
    const notificationsSent = [];
    
    for (const id of userIds) {
      try {
        // Get user info for notifications
        const user = await storage.getUser(id);
        if (!user || !user.email) continue;
        
        // Get reminders due in the next 3 days
        const upcomingReminders = await storage.getUpcomingReminders(id, 3);
        
        // Filter reminders that haven't had notifications sent
        const remindersToSend = upcomingReminders.filter(reminder => !reminder.notificationSent);
        
        if (remindersToSend.length === 0) continue;
        
        // Send notification (in our case, this logs to console)
        const success = await sendNotificationEmail({
          to: user.email,
          firstName: user.firstName,
          reminders: remindersToSend
        });
        
        if (success) {
          // Mark reminders as notified
          for (const reminder of remindersToSend) {
            await storage.updateReminder(reminder.id, { notificationSent: true });
          }
          
          notificationsSent.push({
            userId: id,
            email: user.email,
            reminderCount: remindersToSend.length
          });
          
          console.log(`Processed ${remindersToSend.length} reminder notifications for ${user.email}`);
        }
      } catch (error) {
        console.error(`Error processing reminders for user ${id}:`, error);
      }
    }
    
    return notificationsSent;
  } catch (error) {
    console.error('Error in bill reminder check:', error);
    return [];
  }
}

// Helper to get all user IDs
async function getUserIds(): Promise<number[]> {
  try {
    // For this demo, we'll do a simple query to get all users with reminders
    const reminderUsers = new Set<number>();
    
    // Get all reminders (this would be implemented in a real database)
    const allReminders = await getAllReminders();
    
    for (const reminder of allReminders) {
      reminderUsers.add(reminder.userId);
    }
    
    return Array.from(reminderUsers);
  } catch (error) {
    console.error('Error getting user IDs:', error);
    return [];
  }
}

// Get all reminders (this would be implemented with a DB query in production)
async function getAllReminders() {
  // For now we'll return an empty array since this is just a demo
  return [];
}
