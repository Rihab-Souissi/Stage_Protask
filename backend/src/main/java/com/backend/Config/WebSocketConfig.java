package com.backend.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.backend.security.HttpHandshakeInterceptor;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebSocketHandler WebSocketHandler;

    public WebSocketConfig(WebSocketHandler WebSocketHandler) {
        this.WebSocketHandler = WebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(WebSocketHandler, "/api/v1/notifications")
                .addInterceptors(new HttpHandshakeInterceptor())
                .setAllowedOrigins("*");  
                
    }
}

