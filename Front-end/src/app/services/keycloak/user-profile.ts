export interface UserProfile {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  token: string;
  roles?: string[];
  
  // Propriétés Keycloak standard
  emailVerified?: boolean;
  createdTimestamp?: number;
  enabled?: boolean;
  totp?: boolean;
  
  // Attributs personnalisés
  attributes?: { [key: string]: string[] };
  
  // Préférences utilisateur (optionnel)
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      browser?: boolean;
      sound?: boolean;
    };
  };
}