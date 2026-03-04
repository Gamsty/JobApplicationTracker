package com.adrian.jobtracker.service

import com.adrian.jobtracker.exception.EmailSendException
import com.adrian.jobtracker.entity.Reminder
import jakarta.mail.internet.MimeMessage
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class EmailService(
    // Spring's mail sender — configured via spring.mail.* in application.yml
    private val mailSender: JavaMailSender,

    // The "from" address shown in the recipient's inbox (the Gmail address in application-local.yml)
    @Value("\${spring.mail.username}")
    private val fromEmail: String,

    // Base URL of the frontend — used to build "View in Job Tracker" links in emails
    @Value("\${app.frontend-url}")
    private val frontendUrl: String
) {

    // Sends a general reminder email (follow-up, deadline, custom)
    fun sendReminderEmail(reminder: Reminder) {
        try {
            val message: MimeMessage = mailSender.createMimeMessage()
            // MimeMessageHelper with multipart=true enables HTML content
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom(fromEmail)
            helper.setTo(reminder.user.email)
            helper.setSubject(reminder.title)
            helper.setText(buildReminderEmailHtml(reminder), true)  // true = send as HTML

            mailSender.send(message)

            println("✅ Email sent to ${reminder.user.email}: ${reminder.title}")
        } catch (ex: Exception) {
            println("❌ Failed to send email to ${reminder.user.email}: ${ex.message}")
            throw EmailSendException("Failed to send reminder email", ex)
        }
    }

    // Sends a confirmation email when the user first enables email notifications
    fun sendTestEmail(toEmail: String, userName: String) {
        try {
            val message: MimeMessage = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom(fromEmail)
            helper.setTo(toEmail)
            helper.setSubject("Job Tracker - Email Notifications Enabled")
            helper.setText(buildTestEmailHtml(userName), true)

            mailSender.send(message)

            println("✅ Test email sent to $toEmail")
        } catch (ex: Exception) {
            println("❌ Failed to send test email to $toEmail: ${ex.message}")
            throw EmailSendException("Failed to send test email", ex)
        }
    }

    // Sends an interview-specific reminder with company, position, round, time, and location
    fun sendInterviewReminderEmail(
        userEmail: String,
        userName: String,
        companyName: String,
        positionTitle: String,
        interviewRound: String,
        interviewDateTime: LocalDateTime,
        location: String?
    ) {
        try {
            val message: MimeMessage = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom(fromEmail)
            helper.setTo(userEmail)
            helper.setSubject("Reminder: Interview with $companyName - $interviewRound")
            helper.setText(
                buildInterviewReminderHtml(
                    userName, companyName, positionTitle,
                    interviewRound, interviewDateTime, location
                ),
                true
            )

            mailSender.send(message)

            println("✅ Interview reminder sent to $userEmail")
        } catch (ex: Exception) {
            println("❌ Failed to send interview reminder to $userEmail: ${ex.message}")
            throw EmailSendException("Failed to send interview reminder", ex)
        }
    }

    // Builds the HTML body for a general reminder email.
    // Optionally includes a linked application box if the reminder is tied to an application.
    private fun buildReminderEmailHtml(reminder: Reminder): String {
        // Only render the application box if this reminder is linked to a job application
        val applicationInfo = reminder.application?.let {
            """
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Application:</strong> ${it.companyName} - ${it.positionTitle}
            </div>
            """
        } ?: ""                                                    

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">📋 Job Tracker Reminder</h1>
                    </div>

                    <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #667eea; margin-top: 0;">Hi ${reminder.user.fullName}!</h2>

                        <p style="font-size: 16px;">This is a reminder about:</p>

                        <h3 style="color: #333;">${reminder.title}</h3>

                        ${reminder.message?.let { "<p>$it</p>" } ?: ""}

                        $applicationInfo

                        <p style="margin-top: 30px;">
                            <a href="$frontendUrl"
                               style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                View in Job Tracker
                            </a>
                        </p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                        <p style="font-size: 12px; color: #999;">
                            You're receiving this because you have email notifications enabled in Job Tracker.
                            <a href="$frontendUrl/settings" style="color: #667eea;">Manage your notification preferences</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }

    // Builds the HTML body for the confirmation email sent when notifications are first enabled
    private fun buildTestEmailHtml(userName: String): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">📋 Job Tracker</h1>
                    </div>

                    <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #667eea; margin-top: 0;">Hi $userName! 👋</h2>

                        <p style="font-size: 16px;">
                            Email notifications are now enabled for your Job Tracker account!
                        </p>

                        <p>You'll receive reminders for:</p>
                        <ul>
                            <li>Upcoming interviews</li>
                            <li>Application follow-ups</li>
                            <li>Custom reminders you create</li>
                        </ul>

                        <p style="margin-top: 30px;">
                            <a href="$frontendUrl"
                               style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Go to Job Tracker
                            </a>
                        </p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                        <p style="font-size: 12px; color: #999;">
                            If you didn't enable email notifications, please contact support.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }

    // Builds the HTML body for an interview reminder email with full interview details
    private fun buildInterviewReminderHtml(
        userName: String,
        companyName: String,
        positionTitle: String,
        interviewRound: String,
        interviewDateTime: LocalDateTime,
        location: String?
    ): String {
        // Format the date as e.g. "Monday, March 3, 2026 at 2:30 PM"
        val formatter = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a")
        val formattedDateTime = interviewDateTime.format(formatter)

        // Only render the location box if a location was provided
        val locationInfo = location?.let {
            """
            <div style="background-color: #e3f2fd; padding: 10px; border-radius: 6px; margin: 10px 0;">
                <strong>📍 Location:</strong> $it
            </div>
            """
        } ?: ""

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">🎯 Interview Reminder</h1>
                    </div>

                    <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #667eea; margin-top: 0;">Hi $userName!</h2>

                        <p style="font-size: 16px;">You have an upcoming interview:</p>

                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">$companyName</h3>
                            <p style="margin: 5px 0;"><strong>Position:</strong> $positionTitle</p>
                            <p style="margin: 5px 0;"><strong>Round:</strong> $interviewRound</p>
                            <p style="margin: 5px 0;"><strong>When:</strong> $formattedDateTime</p>
                        </div>

                        $locationInfo

                        <p style="margin-top: 30px;">
                            <a href="$frontendUrl"
                               style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                View Interview Details
                            </a>
                        </p>

                        <p style="margin-top: 20px; font-size: 14px; color: #666;">
                            💡 <strong>Tip:</strong> Review your notes and prepare any questions you want to ask!
                        </p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                        <p style="font-size: 12px; color: #999;">
                            You're receiving this because you have email notifications enabled.
                            <a href="$frontendUrl/settings" style="color: #667eea;">Manage preferences</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }
}
