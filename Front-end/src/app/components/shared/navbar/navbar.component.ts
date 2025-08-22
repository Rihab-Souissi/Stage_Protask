import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'src/app/services/keycloak/keycloak.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  
    currentModule: string = '';
    isDropdownOpen: boolean = false;
    unreadNotificationCount: number = 0;
 
    name = this.keycloakService.profile?.firstName+' '+this.keycloakService.profile?.lastName;
    username= this.keycloakService.profile?.username;
    constructor(
      private router: Router,
      private keycloakService: KeycloakService
  

    ) { 
      this.keycloakService.profile;
    }
  
    ngOnInit(): void {
      // Get the current path to highlight the appropriate tab
      this.router.events.subscribe(() => {
        const url = this.router.url;
        if (url.includes('/discover')) {
          this.currentModule = 'discover';
        } else if (url.includes('/papers')) {
          this.currentModule = 'papers';
        } else if (url.includes('/network')) {
          this.currentModule = 'network';
        } else if (url.includes('/notifications')) {
          this.currentModule = 'notifications';
        } else {
          this.currentModule = '';
        }
      });
      
      // Subscribe to unread notification count
   
    }
  
    async logout() {
      await this.keycloakService.logout();
    }
  
    profile(){
     this.keycloakService.manageAccount();
    }
    
    // Toggle user dropdown
    toggleDropdown(event: Event): void {
      event.stopPropagation();
      this.isDropdownOpen = !this.isDropdownOpen;
    }
    
    // Close dropdown when clicking outside
    closeDropdown(): void {
      this.isDropdownOpen = false;
    }
    
    // Close dropdown when clicking escape
    @HostListener('document:keydown.escape')
    onEscapePressed(): void {
      this.isDropdownOpen = false;
    }
    
    // Handle image loading errors
    handleImageError(event: Event): void {
      // Set a default profile icon as background
      const img = event.target as HTMLImageElement;
      if (img) {
        img.style.display = 'none';
        if (img.parentElement) {
          img.parentElement.classList.add('profile-fallback');
        }
      }
    }
  } 