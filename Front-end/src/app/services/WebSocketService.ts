import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KeycloakService } from './keycloak/keycloak.service';

export interface Notification {
  id: string;
  message: string;
  type: string;
  timestamp: Date;
  sender: string;
  read: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0
  });

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  public notifications$ = this.notificationsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private keycloakService: KeycloakService) {
    this.requestBrowserNotificationPermission();
  }

  connect(): void {
    const currentStatus = this.connectionStatusSubject.value;

    if (currentStatus.isConnected) {
      console.log('✅ WebSocket déjà connecté');
      return;
    }
    if (currentStatus.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre max de tentatives atteint');
      return;
    }

    try {
      const token = this.keycloakService.getToken();
      if (!token) {
        console.error('❌ Token Keycloak non disponible');
        return;
      }

      console.log('🔗 Token disponible, longueur:', token.length);
      console.log('🔗 Token (premiers 50 chars):', token.substring(0, 50) + '...');

      // Construire l'URL WebSocket avec le token
      const wsUrl = `ws://localhost:8088/api/v1/notifications?token=${encodeURIComponent(token)}`;
      console.log('🔗 URL WebSocket:', wsUrl.substring(0, 100) + '...');

      this.socket = new WebSocket(wsUrl);

      console.log('🔗 Tentative de connexion WebSocket...');
      console.log('🔗 ReadyState:', this.socket.readyState);

      this.socket.onopen = (event) => {
        console.log('🎉 WebSocket connecté avec succès!');
        console.log('🎉 Event:', event);
        console.log('🎉 ReadyState:', this.socket?.readyState);
        this.updateConnectionStatus(true, 0);
        this.startHeartbeat();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          console.log('📨 Message brut reçu:', event.data);
          const data = JSON.parse(event.data);
          console.log('📨 Message parsé:', data);
          this.handleIncomingNotification(data);
        } catch (error) {
          console.error('❌ Erreur parsing notification:', error);
          console.log('📨 Traitement comme message texte simple');
          this.handleIncomingNotification({
            message: event.data,
            type: 'info',
            timestamp: new Date(),
            sender: 'system',
            id: Date.now().toString()
          });
        }
      };

      this.socket.onclose = (event: CloseEvent) => {
        console.log('🔌 WebSocket fermé');
        console.log('🔌 Code:', event.code);
        console.log('🔌 Raison:', event.reason);
        console.log('🔌 Was Clean:', event.wasClean);
        
        // Codes d'erreur WebSocket courants
        switch(event.code) {
          case 1000:
            console.log('✅ Fermeture normale');
            break;
          case 1006:
            console.log('❌ Connexion fermée anormalement (problème réseau/serveur)');
            break;
          case 1011:
            console.log('❌ Erreur serveur inattendue');
            break;
          case 1002:
            console.log('❌ Erreur de protocole WebSocket');
            break;
          case 1003:
            console.log('❌ Type de données non supporté');
            break;
          default:
            console.log('❓ Code de fermeture:', event.code);
        }
        
        this.updateConnectionStatus(false);
        this.stopHeartbeat();
        
        if (event.code !== 1000) { // Ne pas reconnecter si fermeture normale
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (event: Event) => {
        console.error('❌ Erreur WebSocket détaillée:', event);
        console.log('❌ Type d\'erreur:', event.type);
        console.log('❌ ReadyState au moment de l\'erreur:', this.socket?.readyState);
        
        // Logging des différents états possibles
        if (this.socket) {
          switch(this.socket.readyState) {
            case WebSocket.CONNECTING:
              console.log('❌ État: CONNECTING (0) - Connexion en cours');
              break;
            case WebSocket.OPEN:
              console.log('❌ État: OPEN (1) - Connexion ouverte');
              break;
            case WebSocket.CLOSING:
              console.log('❌ État: CLOSING (2) - Connexion en cours de fermeture');
              break;
            case WebSocket.CLOSED:
              console.log('❌ État: CLOSED (3) - Connexion fermée');
              break;
          }
        }
        
        this.updateConnectionStatus(false);
        this.stopHeartbeat();
      };

      // Timeout de sécurité pour la connexion
      setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.log('⏰ Timeout de connexion WebSocket');
          this.socket.close();
        }
      }, 10000);

    } catch (error) {
      console.error('❌ Erreur lors de la création WebSocket:', error);
      this.updateConnectionStatus(false);
      this.scheduleReconnect();
    }
  }

  private handleIncomingNotification(data: any): void {
    const notification: Notification = {
      id: data.id || Date.now().toString(),
      message: data.message,
      type: data.type || 'info',
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      sender: data.sender || 'system',
      read: false
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];

    if (updatedNotifications.length > 100) {
      updatedNotifications.splice(100);
    }

    this.notificationsSubject.next(updatedNotifications);
    this.showBrowserNotification(notification);
    this.playNotificationSound(notification.type);
  }

  private updateConnectionStatus(isConnected: boolean, reconnectAttempts?: number): void {
    const currentStatus = this.connectionStatusSubject.value;
    const newStatus: ConnectionStatus = {
      isConnected,
      lastConnected: isConnected ? new Date() : currentStatus.lastConnected,
      reconnectAttempts: reconnectAttempts !== undefined ? reconnectAttempts :
        (isConnected ? 0 : currentStatus.reconnectAttempts + 1)
    };

    this.connectionStatusSubject.next(newStatus);
  }

  private scheduleReconnect(): void {
    const currentStatus = this.connectionStatusSubject.value;

    if (currentStatus.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, currentStatus.reconnectAttempts);
      console.log(`🔄 Reconnexion programmée dans ${delay}ms (tentative ${currentStatus.reconnectAttempts + 1})`);

      this.reconnectTimer = setTimeout(() => {
        console.log('🔄 Tentative de reconnexion...');
        this.connect();
      }, delay);
    } else {
      console.error('❌ Reconnexion impossible après plusieurs tentatives');
    }
  }

  private startHeartbeat(): void {
    console.log('💓 Démarrage heartbeat');
    this.heartbeatInterval = setInterval(() => {
      if (this.socket &&
        this.connectionStatusSubject.value.isConnected &&
        this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send('ping');
          console.log('💓 Ping envoyé');
        } catch (error) {
          console.error('❌ Erreur envoi ping:', error);
        }
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      console.log('💓 Arrêt heartbeat');
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification('Nouvelle notification', {
        body: notification.message,
        icon: this.getIconForType(notification.type),
        tag: notification.id,
      });
      setTimeout(() => browserNotification.close(), 5000);
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    }
  }

  private playNotificationSound(type: string): void {
    try {
      let audioFile = '/assets/sounds/notification.mp3';
      switch (type) {
        case 'ticket_assignment': audioFile = '/assets/sounds/assignment.mp3'; break;
        case 'deadline_warning':
        case 'deadline_exceeded': audioFile = '/assets/sounds/warning.mp3'; break;
        case 'welcome': audioFile = '/assets/sounds/welcome.mp3'; break;
      }
      const audio = new Audio(audioFile);
      audio.volume = 0.3;
      audio.play().catch(() => {
        console.log('🔇 Lecture audio impossible (interaction utilisateur requise)');
      });
    } catch {
      console.log('🔇 Son de notification non disponible');
    }
  }

  private getIconForType(type: string): string {
    switch (type) {
      case 'ticket_assignment': return '/assets/icons/ticket-icon.png';
      case 'deadline_warning':
      case 'deadline_exceeded': return '/assets/icons/warning-icon.png';
      case 'welcome': return '/assets/icons/welcome-icon.png';
      case 'announcement': return '/assets/icons/announcement-icon.png';
      default: return '/assets/icons/notification-icon.png';
    }
  }

  // Méthode pour tester la validation du token
  async testTokenValidation(): Promise<void> {
    const token = this.keycloakService.getToken();
    if (!token) {
      console.error('❌ Token non disponible pour le test');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8088/api/v1/test/validate-token?token=${encodeURIComponent(token)}`);
      const result = await response.json();
      console.log('🧪 Test validation token:', result);
    } catch (error) {
      console.error('❌ Erreur test validation:', error);
    }
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    this.notificationsSubject.next(notifications);
    this.saveNotificationsToStorage(notifications);
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(notif =>
      ({ ...notif, read: true })
    );
    this.notificationsSubject.next(notifications);
    this.saveNotificationsToStorage(notifications);
  }

  removeNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(
      notif => notif.id !== notificationId
    );
    this.notificationsSubject.next(notifications);
    this.saveNotificationsToStorage(notifications);
  }

  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
    this.saveNotificationsToStorage([]);
  }

  getUnreadCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.read).length)
    );
  }

  getNotificationsByType(type: string): Observable<Notification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => n.type === type))
    );
  }

  requestBrowserNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permission notifications:', permission);
      });
    }
  }

  disconnect(): void {
    console.log('🔌 Déconnexion manuelle WebSocket');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.socket) {
      if (this.connectionStatusSubject.value.isConnected) {
        this.socket.close(1000, 'Déconnexion manuelle');
      }
      this.socket = null;
    }
    this.updateConnectionStatus(false, 0);
  }

  forceReconnect(): void {
    console.log('🔄 Reconnexion forcée...');
    this.disconnect();
    this.updateConnectionStatus(false, 0);
    setTimeout(() => this.connect(), 1000);
  }

  isConnected(): boolean {
    return this.connectionStatusSubject.value.isConnected;
  }

  getConnectionStats(): ConnectionStatus {
    return this.connectionStatusSubject.value;
  }

  private saveNotificationsToStorage(notifications: Notification[]): void {
    try {
      const username = this.keycloakService.profile?.username;
      if (username) {
        localStorage.setItem(`notifications_${username}`, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde notifications:', error);
    }
  }

  loadNotificationsFromStorage(): void {
    try {
      const username = this.keycloakService.profile?.username;
      if (username) {
        const stored = localStorage.getItem(`notifications_${username}`);
        if (stored) {
          const notifications = JSON.parse(stored);
          this.notificationsSubject.next(notifications);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    }
  }
}