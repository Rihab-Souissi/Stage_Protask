import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'src/app/services/keycloak/keycloak.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isEmployee = false;
isManager = false;
isAdmin = false;

  constructor(private router: Router, private keycloakServie : KeycloakService) {}
ngOnInit(): void {
  const roles = this.keycloakServie.getUserRoles();
  console.log('Roles utilisateur:', roles);

  // Convertir tous les rôles en majuscules pour comparaison
  const rolesUpper = roles.map(r => r.toUpperCase());

  this.isEmployee = rolesUpper.includes('EMPLOYEE');
  this.isManager = rolesUpper.includes('MANAGER');
  this.isAdmin = rolesUpper.includes('ADMIN');
}


  @Output() toggleSidebar = new EventEmitter<boolean>();
  isCollapsed = false;
  
  toggle() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSidebar.emit(this.isCollapsed); // Envoie l’état vers app.component
  }
  

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  logout(): void {
  this.keycloakServie.logout();
  }
}