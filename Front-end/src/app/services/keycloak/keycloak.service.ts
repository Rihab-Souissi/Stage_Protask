import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { UserProfile } from './user-profile';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {
  private _keycloak: Keycloak | undefined;
  private _profile: UserProfile | undefined;
  private _isInitialized = new BehaviorSubject<boolean>(false);
  
  public isInitialized$ = this._isInitialized.asObservable();

  get keycloak() {
    if (!this._keycloak) {
      this._keycloak = new Keycloak({
        url: 'http://localhost:9090',
        realm: 'ProTask',
        clientId: 'Retours_client_front'
      });
    }
    return this._keycloak;
  }

  get profile(): UserProfile | undefined {
    return this._profile;
  }

  /**
   * Récupère les rôles de l'utilisateur
   */
  getUserRoles(): string[] {
    return this.keycloak.tokenParsed?.realm_access?.roles || [];
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  /**
   * Vérifie si l'utilisateur est un manager
   */
  isManager(): boolean {
    return this.hasRole('MANAGER') || this.hasRole('manager');
  }

  /**
   * Vérifie si l'utilisateur est un employé
   */
  isEmployee(): boolean {
    return this.hasRole('EMPLOYEE') || this.hasRole('employee');
  }

  /**
   * Vérifie si l'utilisateur est un admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN') || this.hasRole('admin');
  }

  /**
   * Récupère le token JWT actuel
   */
  getToken(): string | undefined {
    if (this.keycloak.token) {
      // Vérifier si le token va expirer dans les 30 prochaines secondes
      if (this.keycloak.isTokenExpired(30)) {
        console.warn('⚠️ Token JWT proche de l\'expiration, actualisation...');
        this.refreshToken();
      }
      return this.keycloak.token;
    }
    return undefined;
  }

  /**
   * Récupère le refresh token
   */
  getRefreshToken(): string | undefined {
    return this.keycloak.refreshToken;
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.keycloak.authenticated || false;
  }

  /**
   * Récupère le nom d'utilisateur
   */
  getUsername(): string | undefined {
    return this.keycloak.tokenParsed?.['preferred_username'];
  }

  /**
   * Récupère l'email de l'utilisateur
   */
  getEmail(): string | undefined {
    return this.keycloak.tokenParsed?.['email'];
  }

  /**
   * Récupère le nom complet de l'utilisateur
   */
  getFullName(): string | undefined {
    const tokenParsed = this.keycloak.tokenParsed;
    if (tokenParsed) {
      return `${tokenParsed['given_name'] || ''} ${tokenParsed['family_name'] || ''}`.trim();
    }
    return undefined;
  }

  /**
   * Initialise Keycloak
   */
  async init(): Promise<boolean> {
    try {
      console.log('🔐 Initialisation de Keycloak...');
      
      const authenticated = await this.keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false, // Désactive la vérification iframe pour éviter les problèmes de CORS
        pkceMethod: 'S256' // Active PKCE pour plus de sécurité
      });

      if (authenticated) {
        console.log('✅ Utilisateur authentifié');
        
        // Charger le profil utilisateur
        this._profile = (await this.keycloak.loadUserProfile()) as UserProfile;
        this._profile.token = this.keycloak.token || '';
        this._profile.username = this.getUsername() || '';
        this._profile.roles = this.getUserRoles();
        
        console.log('👤 Profil utilisateur chargé:', {
          username: this._profile.username,
          email: this._profile.email,
          roles: this._profile.roles
        });

        // Configurer l'actualisation automatique du token
        this.setupTokenRefresh();
        
        this._isInitialized.next(true);
        return true;
      } else {
        console.warn('❌ Utilisateur non authentifié');
        this._isInitialized.next(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de Keycloak:', error);
      this._isInitialized.next(false);
      return false;
    }
  }

  /**
   * Configure l'actualisation automatique du token
   */
  private setupTokenRefresh(): void {
    // Actualiser le token toutes les 5 minutes
    setInterval(async () => {
      if (this.isAuthenticated()) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('❌ Erreur lors de l\'actualisation automatique du token:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Écouter les événements Keycloak
    this.keycloak.onTokenExpired = () => {
      console.warn('⚠️ Token expiré, actualisation...');
      this.refreshToken();
    };

    this.keycloak.onAuthRefreshSuccess = () => {
      console.log('✅ Token actualisé avec succès');
      if (this._profile) {
        this._profile.token = this.keycloak.token || '';
      }
    };

    this.keycloak.onAuthRefreshError = () => {
      console.error('❌ Erreur actualisation token, redirection vers login...');
      this.login();
    };

    this.keycloak.onAuthLogout = () => {
      console.log('🚪 Utilisateur déconnecté');
      this._profile = undefined;
      this._isInitialized.next(false);
    };
  }

  /**
   * Actualise le token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshed = await this.keycloak.updateToken(30);
      if (refreshed) {
        console.log('🔄 Token actualisé');
        if (this._profile) {
          this._profile.token = this.keycloak.token || '';
        }
      }
      return refreshed;
    } catch (error) {
      console.error('❌ Erreur actualisation token:', error);
      return false;
    }
  }

  /**
   * Connexion
   */
  login(): Promise<void> {
    return this.keycloak.login();
  }

  /**
   * Déconnexion
   */
  logout(): Promise<void> {
    return this.keycloak.logout({
      redirectUri: 'http://localhost:4200'
    });
  }

  /**
   * Gestion du compte
   */
  manageAccount(): Promise<void> {
    return this.keycloak.accountManagement();
  }

  /**
   * Vérifie les permissions pour une action
   */
  hasPermission(resource: string, action: string): boolean {
    // Logique personnalisée de permissions basée sur les rôles
    const roles = this.getUserRoles();
    
    switch (action) {
      case 'CREATE_TICKET':
        return roles.includes('MANAGER') || roles.includes('manager');
      
      case 'ASSIGN_TICKET':
        return roles.includes('MANAGER') || roles.includes('manager');
      
      case 'VIEW_TICKETS':
        return roles.includes('MANAGER') || roles.includes('EMPLOYEE') || 
               roles.includes('manager') || roles.includes('employee');
      
      case 'UPDATE_TICKET_STATUS':
        return roles.includes('EMPLOYEE') || roles.includes('employee');
      
      case 'DELETE_TICKET':
        return roles.includes('MANAGER') || roles.includes('manager');
      
      default:
        return false;
    }
  }

  /**
   * Récupère les informations détaillées du token
   */
  getTokenInfo(): any {
    if (this.keycloak.tokenParsed) {
      return {
        username: this.keycloak.tokenParsed['preferred_username'],
        email: this.keycloak.tokenParsed['email'],
        firstName: this.keycloak.tokenParsed['given_name'],
        lastName: this.keycloak.tokenParsed['family_name'],
        roles: this.getUserRoles(),
        issuedAt: new Date(this.keycloak.tokenParsed.iat! * 1000),
        expiresAt: new Date(this.keycloak.tokenParsed.exp! * 1000),
        issuer: this.keycloak.tokenParsed.iss
      };
    }
    return null;
  }

  /**
   * Vérifie si le token va expirer bientôt
   */
  willTokenExpireSoon(minValidity: number = 30): boolean {
    return this.keycloak.isTokenExpired(minValidity);
  }
}