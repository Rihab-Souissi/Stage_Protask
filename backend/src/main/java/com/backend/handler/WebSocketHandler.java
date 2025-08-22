package com.backend.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;

@Component
public class WebSocketHandler extends TextWebSocketHandler {
    
    // Map pour stocker les sessions utilisateur par username
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("🔗 Nouvelle connexion WebSocket établie: " + session.getId());

        // Récupérer le nom d'utilisateur depuis les attributs (défini dans l'interceptor)
        String username = (String) session.getAttributes().get("username");
        Authentication principal = (Authentication) session.getAttributes().get("principal");
        
        if (username != null && principal != null) {
            // Fermer l'ancienne session si elle existe
            WebSocketSession oldSession = userSessions.get(username);
            if (oldSession != null && oldSession.isOpen()) {
                oldSession.close();
                System.out.println("🔄 Ancienne session fermée pour: " + username);
            }
            
            // Stocker la nouvelle session
            userSessions.put(username, session);
            session.getAttributes().put("username", username);
            session.getAttributes().put("principal", principal);
            
            System.out.println("🔗 Utilisateur connecté: " + username);
            sendWelcomeMessage(session, username);
        } else {
            System.err.println("❌ Informations d'authentification manquantes, fermeture de la session");
            session.close();
        }
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String username = (String) session.getAttributes().get("username");
        if (username != null) {
            userSessions.remove(username);
            System.out.println("🔌 Utilisateur déconnecté: " + username + " - Status: " + status);
        }
    }
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("❌ Erreur WebSocket: " + exception.getMessage());
        String username = (String) session.getAttributes().get("username");
        if (username != null) {
            userSessions.remove(username);
        }
        session.close();
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Gérer les messages entrants si nécessaire (ping/pong, accusés de réception, etc.)
        String payload = message.getPayload();
        System.out.println("📨 Message reçu de " + session.getAttributes().get("username") + ": " + payload);
        
        // Répondre avec un ping/pong pour maintenir la connexion
        if ("ping".equals(payload)) {
            session.sendMessage(new TextMessage("pong"));
        }
    }
    
    /**
     * Méthode pour envoyer une notification à un utilisateur spécifique
     */
    public boolean sendNotificationToUser(String username, String message) {
        return sendNotificationToUser(username, message, "info");
    }
    
    /**
     * Méthode pour envoyer une notification avec type à un utilisateur spécifique
     */
    public boolean sendNotificationToUser(String username, String message, String type) {
        WebSocketSession session = userSessions.get(username);
        if (session != null && session.isOpen()) {
            try {
                NotificationMessage notification = new NotificationMessage(
                    message, 
                    type, 
                    LocalDateTime.now(), 
                    username
                );
                
                String jsonMessage = objectMapper.writeValueAsString(notification);
                session.sendMessage(new TextMessage(jsonMessage));
                System.out.println("📨 Notification envoyée à " + username + ": " + message);
                return true;
            } catch (IOException e) {
                System.err.println("❌ Erreur envoi notification à " + username + ": " + e.getMessage());
                // Supprimer la session défaillante
                userSessions.remove(username);
                return false;
            }
        } else {
            System.out.println("⚠️ Utilisateur " + username + " non connecté ou session fermée");
            return false;
        }
    }
    
    /**
     * Méthode pour obtenir le nombre d'utilisateurs connectés
     */
    public int getConnectedUsersCount() {
        return userSessions.size();
    }
    
    /**
     * Méthode pour obtenir la liste des utilisateurs connectés
     */
    public String[] getConnectedUsers() {
        return userSessions.keySet().toArray(new String[0]);
    }
    
    /**
     * Méthode pour vérifier si un utilisateur est connecté
     */
    public boolean isUserConnected(String username) {
        WebSocketSession session = userSessions.get(username);
        return session != null && session.isOpen();
    }
    
    /**
     * Méthode pour envoyer un message à tous les utilisateurs connectés
     */
    public void broadcastMessage(String message) {
        broadcastMessage(message, "broadcast");
    }
    
    /**
     * Méthode pour envoyer un message avec type à tous les utilisateurs connectés
     */
    public void broadcastMessage(String message, String type) {
        NotificationMessage notification = new NotificationMessage(
            message, 
            type, 
            LocalDateTime.now(), 
            "system"
        );
        
        try {
            String jsonMessage = objectMapper.writeValueAsString(notification);
            userSessions.forEach((username, session) -> {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(new TextMessage(jsonMessage));
                    } catch (IOException e) {
                        System.err.println("❌ Erreur broadcast à " + username + ": " + e.getMessage());
                        userSessions.remove(username);
                    }
                }
            });
        } catch (Exception e) {
            System.err.println("❌ Erreur création message broadcast: " + e.getMessage());
        }
    }
    
    private void sendWelcomeMessage(WebSocketSession session, String username) {
        try {
            NotificationMessage welcome = new NotificationMessage(
                "Connexion établie avec succès", 
                "connection", 
                LocalDateTime.now(), 
                "system"
            );
            String jsonMessage = objectMapper.writeValueAsString(welcome);
            session.sendMessage(new TextMessage(jsonMessage));
        } catch (Exception e) {
            System.err.println("❌ Erreur envoi message de bienvenue: " + e.getMessage());
        }
    }
    
    /**
     * Classe interne pour structurer les messages de notification
     */
    public static class NotificationMessage {
        private String message;
        private String type;
        private LocalDateTime timestamp;
        private String sender;
        private String id;
        
        public NotificationMessage(String message, String type, LocalDateTime timestamp, String sender) {
            this.message = message;
            this.type = type;
            this.timestamp = timestamp;
            this.sender = sender;
            this.id = String.valueOf(System.currentTimeMillis());
        }
        
        // Getters et setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
    }
}