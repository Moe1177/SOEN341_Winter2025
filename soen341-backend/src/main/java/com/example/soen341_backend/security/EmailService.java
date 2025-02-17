package com.example.soen341_backend.security;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Sends an email to the specified recipient.
     *
     * This method creates a MIME email message and sends it using the configured
     * JavaMailSender. It supports sending plain text or HTML content.
     *
     * @param to      the recipient's email address
     * @param subject the subject of the email
     * @param text    the body of the email (can be plain text or HTML)
     *
     * @throws RuntimeException if there is a failure during email sending
     */
    public void sendEmail(String to, String subject, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}

