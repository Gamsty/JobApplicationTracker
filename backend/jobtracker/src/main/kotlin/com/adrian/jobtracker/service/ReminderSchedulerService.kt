package com.adrian.jobtracker.service

import com.adrian.jobtracker.repository.ReminderRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class ReminderSchedulerService(
    private val reminderRepository: ReminderRepository,
    private val emailService: EmailService
) {
    // Runs every 5 minutes — queries for all unsent, enabled reminders whose scheduled time has passed
    @Scheduled(cron = "0 */5 * * * *") // cron: second=0, minute=every 5, hour/day/month/weekday=any
    fun checkAndSendReminders() {
        println("🔍 Checking for reminders to send at ${LocalDateTime.now()}") 

        val now = LocalDateTime.now()
        val remindersToSend = reminderRepository.findRemindersToSend(now)

        println("📧 Found ${remindersToSend.size} reminder(s) to send")

        // Query already filters out users with emailNotificationsEnabled = false,
        // so every reminder here is guaranteed to want an email
        remindersToSend.forEach { reminder ->
            try {
                emailService.sendReminderEmail(reminder)

                // Mark as sent so the scheduler won't pick it up again on the next run
                reminder.sent = true
                reminder.sentAt = LocalDateTime.now()
                reminderRepository.save(reminder)

                println("✅ Sent reminder: ${reminder.title} to ${reminder.user.email}")
            } catch (ex: Exception) {
                // Log and continue — one failed email should not stop the rest from being sent
                println("❌ Failed to send reminder ${reminder.id}: ${ex.message}")
            }
        }
    }

    // Runs every hour — placeholder for automatically creating reminders before upcoming interviews
    @Scheduled(cron = "0 0 * * * *") // cron: second=0, minute=0, every hour
    fun createAutomaticInterviewReminders() {       
        println("🔍 Checking for automatic interview reminders at ${LocalDateTime.now()}")
    }
}
