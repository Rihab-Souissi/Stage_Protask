package com.backend.services;

import org.springframework.stereotype.Service;
import com.backend.handler.WebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final WebSocketHandler webSocketHandler;
    
    /**
     * Envoie une notification générale à un utilisateur
     */
    public boolean notifyUser(String username, String message) {
        return notifyUser(username, message, "info");
    }
    
    /**
     * Envoie une notification avec type à un utilisateur
     */
    public boolean notifyUser(String username, String message, String type) {
        if (username == null || username.trim().isEmpty()) {
            log.warn("⚠️ Tentative d'envoi de notification à un username vide");
            return false;
        }
        
        if (message == null || message.trim().isEmpty()) {
            log.warn("⚠️ Tentative d'envoi de notification vide à {}", username);
            return false;
        }
        
        boolean sent = webSocketHandler.sendNotificationToUser(username, message, type);
        
        if (sent) {
            log.info("📢 Notification envoyée avec succès: {} -> {}", username, message);
        } else {
            log.warn("⚠️ Échec envoi notification à {} (utilisateur déconnecté?)", username);
        }
        
        return sent;
    }
    
    /**
     * Notifie l'assignation d'un ticket à un employé
     */
    public boolean notifyTicketAssignment(String employeeUsername, String managerUsername, String ticketTitle) {
        if (employeeUsername == null || managerUsername == null || ticketTitle == null) {
            log.error("❌ Paramètres invalides pour notification d'assignation de ticket");
            return false;
        }
        
        String message = String.format(
            "🎫 Nouveau ticket assigné par %s : \"%s\"", 
            managerUsername, 
            ticketTitle
        );
        
        return notifyUser(employeeUsername, message, "ticket_assignment");
    }
    
    /**
     * Notifie un changement de statut de ticket
     */
    public boolean notifyTicketStatusChange(String employeeUsername, String ticketTitle, String oldStatus, String newStatus) {
        String message = String.format(
            "🔄 Statut du ticket \"%s\" changé : %s → %s", 
            ticketTitle, 
            oldStatus, 
            newStatus
        );
        
        return notifyUser(employeeUsername, message, "ticket_status");
    }
    
    /**
     * Notifie un nouveau commentaire sur un ticket
     */
    public boolean notifyTicketComment(String employeeUsername, String commenterUsername, String ticketTitle) {
        String message = String.format(
            "💬 Nouveau commentaire de %s sur le ticket \"%s\"", 
            commenterUsername, 
            ticketTitle
        );
        
        return notifyUser(employeeUsername, message, "ticket_comment");
    }
    
    /**
     * Notifie la création d'un nouveau projet
     */
    public boolean notifyProjectCreation(String[] teamMembers, String projectName, String managerUsername) {
        String message = String.format(
            "🚀 Nouveau projet créé par %s : \"%s\"", 
            managerUsername, 
            projectName
        );
        
        int successCount = 0;
        for (String member : teamMembers) {
            if (notifyUser(member, message, "project_creation")) {
                successCount++;
            }
        }
        
        log.info("📊 Notification projet envoyée à {}/{} membres", successCount, teamMembers.length);
        return successCount > 0;
    }
    
    /**
     * Notifie une date limite approchante
     */
    public boolean notifyDeadlineApproaching(String employeeUsername, String ticketTitle, int daysRemaining) {
        String message = String.format(
            "⏰ Date limite proche pour \"%s\" : %d jour(s) restant(s)", 
            ticketTitle, 
            daysRemaining
        );
        
        return notifyUser(employeeUsername, message, "deadline_warning");
    }
    
    /**
     * Notifie une date limite dépassée
     */
    public boolean notifyDeadlineExceeded(String employeeUsername, String ticketTitle) {
        String message = String.format(
            "🚨 Date limite dépassée pour le ticket \"%s\"", 
            ticketTitle
        );
        
        return notifyUser(employeeUsername, message, "deadline_exceeded");
    }
    
    /**
     * Envoie une notification de bienvenue
     */
    public boolean notifyWelcome(String username, String roleName) {
        String message = String.format(
            "👋 Bienvenue %s ! Vous êtes connecté en tant que %s", 
            username, 
            roleName
        );
        
        return notifyUser(username, message, "welcome");
    }
    
    /**
     * Envoie un message de diffusion à tous les utilisateurs connectés
     */
    public void broadcastAnnouncement(String announcement, String senderUsername) {
        String message = String.format(
            "📢 Annonce de %s : %s", 
            senderUsername, 
            announcement
        );
        
        webSocketHandler.broadcastMessage(message, "announcement");
        log.info("📢 Annonce diffusée par {}: {}", senderUsername, announcement);
    }
    
    /**
     * Vérifie si un utilisateur est connecté
     */
    public boolean isUserOnline(String username) {
        return webSocketHandler.isUserConnected(username);
    }
    
    /**
     * Obtient le nombre d'utilisateurs connectés
     */
    public int getOnlineUsersCount() {
        return webSocketHandler.getConnectedUsersCount();
    }
    
    /**
     * Obtient la liste des utilisateurs connectés
     */
    public String[] getOnlineUsers() {
        return webSocketHandler.getConnectedUsers();
    }
    
    /**
     * Notifie les administrateurs d'un événement système
     */
    public void notifyAdmins(String event, String details) {
        String message = String.format(
            "🔧 Événement système : %s - %s", 
            event, 
            details
        );
        
        // Ici, vous pourriez avoir une liste d'administrateurs ou une requête pour les récupérer
        // Pour l'exemple, on diffuse à tous
        webSocketHandler.broadcastMessage(message, "system_admin");
        log.info("🔧 Notification admin envoyée: {} - {}", event, details);
    }
}