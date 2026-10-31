package com.uranus.lms.modules.auth;

import com.uranus.lms.config.RabbitMQConfig;
import com.uranus.lms.modules.auth.dto.SendEmailMessage;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailRabbitListener {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${app.mail.from:${spring.mail.username}}")
    private String mailFrom;

    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void processEmailTask(SendEmailMessage message) {
        try {
            log.info("Processing email task for: {}", message.getTo());
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailFrom);

            helper.setTo(message.getTo());
            helper.setSubject(message.getSubject());
            helper.setText(message.getContent(), true);

            mailSender.send(mimeMessage);
            log.info("Successfully sent email to {}", message.getTo());
        } catch (Exception e) {
            log.error("Failed to send email to {}", message.getTo(), e);
            // Ném lỗi này để RabbitMQ hủy bỏ (discard) message, không retry vô tận gây sập server
            throw new org.springframework.amqp.AmqpRejectAndDontRequeueException("Lỗi gửi mail, hủy bỏ task", e);
        }
    }
}
