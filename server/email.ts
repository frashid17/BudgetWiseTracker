import { Reminder } from "@shared/schema";
import { format } from "date-fns";

interface NotificationOptions {
  to: string;
  firstName: string;
  reminders: Reminder[];
}

// Simple notification system that logs to console instead of sending emails
export async function sendNotificationEmail(options: NotificationOptions): Promise<boolean> {
  const { to, firstName, reminders } = options;
  
  try {
    // Format the reminder information
    const reminderDetails = reminders.map(reminder => {
      const dueDate = format(new Date(reminder.dueDate), "MMMM d, yyyy");
      const amount = reminder.amount 
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KSH' }).format(Number(reminder.amount))
        : "N/A";
      
      return {
        title: reminder.title,
        amount,
        dueDate
      };
    });
    
    // Log notification information to console (for development)
    console.log(`
    ============= NOTIFICATION =============
    TO: ${to}
    SUBJECT: BudgetWise: Upcoming Bill Reminders
    
    Hello ${firstName},
    
    You have ${reminders.length} upcoming bills:
    
    ${reminderDetails.map(r => `- ${r.title}: ${r.amount} due on ${r.dueDate}`).join('\n    ')}
    
    Log in to your BudgetWise account to view more details.
    =======================================
    `);
    
    // In a real application, this would send an actual email
    // For now, we'll just simulate a successful send
    return true;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return false;
  }
}
