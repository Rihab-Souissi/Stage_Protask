import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { WebSocketService, Notification, ConnectionStatus } from 'src/app/services/WebSocketService';
import { KeycloakService } from 'src/app/services/keycloak/keycloak.service';

@Component({
  selector: 'app-notifications',

  template: `
    <div class="notifications-container">
      <div class="notifications-header">
        <div class="header-left">
          <h3>
            <i class="fas fa-bell"></i>
            Notifications
            <span *ngIf="unreadCount > 0" class="badge">{{unreadCount}}</span>
          </h3>
        </div>
        
        <div class="header-right">
          <div class="connection-status" [ngClass]="{
            'connected': connectionStatus.isConnected,
            'disconnected': !connectionStatus.isConnected,
            'reconnecting': connectionStatus.reconnectAttempts > 0 && !connectionStatus.isConnected
          }">
            <i class="fas" [ngClass]="{
              'fa-wifi text-success': connectionStatus.isConnected,
              'fa-exclamation-triangle text-warning': connectionStatus.reconnectAttempts > 0 && !connectionStatus.isConnected,
              'fa-times-circle text-danger': !connectionStatus.isConnected && connectionStatus.reconnectAttempts === 0
            }"></i>
            <span>
              <ng-container *ngIf="connectionStatus.isConnected">Connecté</ng-container>
              <ng-container *ngIf="!connectionStatus.isConnected && connectionStatus.reconnectAttempts > 0">
                Reconnexion... ({{connectionStatus.reconnectAttempts}}/5)
              </ng-container>
              <ng-container *ngIf="!connectionStatus.isConnected && connectionStatus.reconnectAttempts === 0">
                Déconnecté
              </ng-container>
            </span>
          </div>

          <div class="header-actions">
            <button 
              class="btn btn-sm btn-outline-primary me-2" 
              (click)="markAllAsRead()" 
              [disabled]="unreadCount === 0"
              title="Marquer tout comme lu">
              <i class="fas fa-check-double"></i>
            </button>
            
            <button 
              class="btn btn-sm btn-outline-warning me-2" 
              (click)="forceReconnect()"
              [disabled]="connectionStatus.isConnected"
              title="Forcer la reconnexion">
              <i class="fas fa-sync-alt"></i>
            </button>
            
            <button 
              class="btn btn-sm btn-outline-danger" 
              (click)="clearAll()" 
              [disabled]="notifications.length === 0"
              title="Effacer toutes les notifications">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="notifications-filters">
        <div class="filter-buttons">
          <button 
            *ngFor="let filter of availableFilters" 
            class="btn btn-sm" 
            [ngClass]="selectedFilter === filter.value ? 'btn-primary' : 'btn-outline-secondary'"
            (click)="setFilter(filter.value)">
            <i [class]="filter.icon"></i>
            {{filter.label}}
            <span *ngIf="getCountByType(filter.value) > 0" class="badge ms-1">
              {{getCountByType(filter.value)}}
            </span>
          </button>
        </div>
      </div>

      <div class="notifications-list" #notificationsList>
        <div *ngIf="filteredNotifications.length === 0" class="empty-state">
          <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
          <p class="text-muted">
            <ng-container *ngIf="selectedFilter === 'all'">
              Aucune notification pour le moment
            </ng-container>
            <ng-container *ngIf="selectedFilter !== 'all'">
              Aucune notification de type "{{getFilterLabel(selectedFilter)}}"
            </ng-container>
          </p>
        </div>

        <div 
          *ngFor="let notification of filteredNotifications; trackBy: trackByNotificationId" 
          class="notification-item" 
          [ngClass]="{
            'unread': !notification.read,
            'notification-ticket': notification.type === 'ticket_assignment',
            'notification-warning': notification.type === 'deadline_warning' || notification.type === 'deadline_exceeded',
            'notification-success': notification.type === 'welcome' || notification.type === 'connection',
            'notification-info': notification.type === 'info' || notification.type === 'announcement'
          }"
          [attr.data-notification-id]="notification.id">
          
          <div class="notification-icon">
            <i class="fas" [ngClass]="{
              'fa-ticket-alt': notification.type === 'ticket_assignment',
              'fa-exclamation-triangle': notification.type === 'deadline_warning' || notification.type === 'deadline_exceeded',
              'fa-hand-point-right': notification.type === 'welcome',
              'fa-bullhorn': notification.type === 'announcement',
              'fa-info-circle': notification.type === 'info',
              'fa-plug': notification.type === 'connection',
              'fa-bell': !['ticket_assignment', 'deadline_warning', 'deadline_exceeded', 'welcome', 'announcement', 'info', 'connection'].includes(notification.type)
            }"></i>
          </div>

          <div class="notification-content">
            <div class="notification-message">
              {{notification.message}}
            </div>
            
            <div class="notification-meta">
              <span class="notification-time" [title]="notification.timestamp | date:'dd/MM/yyyy HH:mm:ss'">
                {{getRelativeTime(notification.timestamp)}}
              </span>
              
              <span class="notification-sender" *ngIf="notification.sender !== 'system'">
                de {{notification.sender}}
              </span>
              
              <span class="notification-type-badge" [ngClass]="'badge-' + notification.type">
                {{getTypeLabel(notification.type)}}
              </span>
            </div>
          </div>

          <div class="notification-actions">
            <button 
              *ngIf="!notification.read"
              class="btn btn-sm btn-outline-success" 
              (click)="markAsRead(notification.id)"
              title="Marquer comme lu">
              <i class="fas fa-check"></i>
            </button>
            
            <button 
              class="btn btn-sm btn-outline-danger" 
              (click)="removeNotification(notification.id)"
              title="Supprimer">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="debug-info" *ngIf="showDebugInfo">
        <details>
          <summary>Informations de débogage</summary>
          <div class="debug-content">
            <p><strong>Utilisateur:</strong> {{username}}</p>
            <p><strong>Rôles:</strong> {{userRoles.join(', ')}}</p>
            <p><strong>Total notifications:</strong> {{notifications.length}}</p>
            <p><strong>Non lues:</strong> {{unreadCount}}</p>
            <p><strong>Statut connexion:</strong> {{connectionStatus.isConnected ? 'Connecté' : 'Déconnecté'}}</p>
            <p><strong>Tentatives reconnexion:</strong> {{connectionStatus.reconnectAttempts}}</p>
            <p><strong>Dernière connexion:</strong> {{connectionStatus.lastConnected | date:'dd/MM/yyyy HH:mm:ss'}}</p>
          </div>
        </details>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    /*... ici le reste de tes styles exactement comme tu l'as déjà écrit ...*/
    /* Je ne les recopie pas pour ne pas alourdir, mais tu peux les reprendre tels quels */
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  connectionStatus: ConnectionStatus = { isConnected: false, reconnectAttempts: 0 };
  unreadCount = 0;
  selectedFilter = 'all';
  
  username: string = '';
  userRoles: string[] = [];
  showDebugInfo = false; // Pour activer ou non l'affichage debug

  availableFilters = [
    { value: 'all', label: 'Toutes', icon: 'fas fa-list' },
    { value: 'unread', label: 'Non lues', icon: 'fas fa-eye' },
    { value: 'ticket_assignment', label: 'Tickets', icon: 'fas fa-ticket-alt' },
    { value: 'deadline_warning', label: 'Échéances', icon: 'fas fa-clock' },
    { value: 'announcement', label: 'Annonces', icon: 'fas fa-bullhorn' }
  ];

  constructor(
    private webSocketService: WebSocketService,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.username = this.keycloakService.getUsername() || 'Utilisateur';
    this.userRoles = this.keycloakService.getUserRoles();

    this.webSocketService.loadNotificationsFromStorage();

    this.webSocketService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications: Notification[]) => {
        this.notifications = notifications;
        this.updateFilteredNotifications();
        this.updateUnreadCount();
      });

    this.webSocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: any) => {
        this.connectionStatus = status;
      });

    this.webSocketService.connect();
  }

  private updateFilteredNotifications(): void {
    switch (this.selectedFilter) {
      case 'unread':
        this.filteredNotifications = this.notifications.filter(n => !n.read);
        break;
      case 'all':
        this.filteredNotifications = this.notifications;
        break;
      default:
        this.filteredNotifications = this.notifications.filter(n => n.type === this.selectedFilter);
        break;
    }
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
    this.updateFilteredNotifications();
  }

  getFilterLabel(filterValue: string): string {
    const filter = this.availableFilters.find(f => f.value === filterValue);
    return filter ? filter.label : filterValue;
  }

  getCountByType(type: string): number {
    if (type === 'all') {
      return this.notifications.length;
    } else if (type === 'unread') {
      return this.unreadCount;
    } else {
      return this.notifications.filter(n => n.type === type).length;
    }
  }

  markAsRead(notificationId: string): void {
    this.webSocketService.markAsRead(notificationId);
  }

  markAllAsRead(): void {
    this.webSocketService.markAllAsRead();
  }

  removeNotification(notificationId: string): void {
    this.webSocketService.removeNotification(notificationId);
  }

  clearAll(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      this.webSocketService.clearAllNotifications();
    }
  }

  forceReconnect(): void {
    this.webSocketService.forceReconnect();
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  getRelativeTime(timestamp: Date | string): string {
    const now = new Date();
    const ts = new Date(timestamp);
    const diff = now.getTime() - ts.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return "À l'instant";
    } else if (minutes < 60) {
      return `Il y a ${minutes} min`;
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else if (days < 7) {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else {
      return ts.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  getTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'ticket_assignment': 'Ticket',
      'deadline_warning': 'Échéance',
      'deadline_exceeded': 'Retard',
      'welcome': 'Bienvenue',
      'info': 'Info',
      'announcement': 'Annonce',
      'connection': 'Connexion',
      'project_creation': 'Projet',
      'ticket_comment': 'Commentaire',
      'ticket_status': 'Statut'
    };
    
    return typeLabels[type] || 'Notification';
  }
}
