package com.uranus.lms.modules.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import com.uranus.lms.config.RabbitMQConfig;
import com.uranus.lms.modules.auth.dto.SendEmailMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final RabbitTemplate rabbitTemplate;
    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String mailFrom;

    public void sendEmail(String to, String subject, String content) {
        try {
            SendEmailMessage message = SendEmailMessage.builder()
                    .to(to)
                    .subject(subject)
                    .content(content)
                    .build();
            rabbitTemplate.convertAndSend(RabbitMQConfig.EMAIL_QUEUE, message);
            log.info("Email task queued for {}", to);
        } catch (Exception e) {
            log.warn("Failed to queue email to {}, falling back to direct send. Error: {}", to, e.getMessage());
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(mailFrom);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, true);
                mailSender.send(mimeMessage);
                log.info("Successfully sent email directly to {}", to);
            } catch (Exception ex) {
                log.error("Failed to send email directly to {}", to, ex);
                throw new RuntimeException("Không thể gửi email. Vui lòng kiểm tra lại cấu hình SMTP.");
            }
        }
    }
}
