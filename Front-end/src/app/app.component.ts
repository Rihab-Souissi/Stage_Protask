import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'front-end';
  isSidebarCollapsed = false;

  // Méthode appelée quand le sidebar émet un événement toggleSidebar
  onToggleSidebar(event: any) {
    this.isSidebarCollapsed = event.detail ?? !this.isSidebarCollapsed;
  }
}