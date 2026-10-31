package com.uranus.lms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor authChannelInterceptor;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // KHONG dua "/user" vao day: no la prefix cua user destination, khong phai cua broker.
        // Neu khai bao, broker se tu xu ly "/user/**" va convertAndSendToUser() gui vao
        // dich khong ai subscribe -> tin nhan bi roi lang le.
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split(",");

        // WebSocket thuan: @stomp/stompjs o frontend noi thang toi ws(s)://host/ws.
        // Truoc day chi co bien the SockJS nen duong nay khong bat tay duoc.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins);

        // Giu SockJS lam duong du phong cho trinh duyet/proxy chan WebSocket.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
                .withSockJS();
    }

    /** Gan Principal luc CONNECT va chan SUBSCRIBE trai phep. */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}
