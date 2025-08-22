import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { MatDialogModule } from '@angular/material/dialog';

import { SidebarComponent } from './components/shared/sidebar/sidebar.component';

import { NavbarComponent } from './components/shared/navbar/navbar.component';

import { KeycloakService } from './services/keycloak/keycloak.service';
import { TokenInjectInterceptor } from './services/interceptor/token-inject.interceptor';
import { ProjectserviceComponent } from './components/projectservice/Projectservice.component';
import { DashboardComponent } from './components/dashbord/Dashbord.component';
import { TicketsComponent } from './components/tickets/tickets.component';
import { DashboardadminComponent } from './components/dashbord-admin/dashbord-admin.component';
import { AddEmployeeComponent } from './components/add-employee/add-employee.component';
import { StaticComponent } from './services/static/static.component';
import { NotificationComponent } from './components/notification/notification.component';
import { TicketDetailsComponent } from './components/ticket-details/ticket-details.component';
import { LogTimeDialogComponent } from './components/log-time-dialog/log-time-dialog.component';



export function kcFactory(kcService: KeycloakService) {
  return () => kcService.init();
}

@NgModule({
  declarations: [
  
  
    SidebarComponent,
     AppComponent,
    NavbarComponent,
    ProjectserviceComponent,
    DashboardComponent,
    TicketsComponent,
    DashboardadminComponent,
    AddEmployeeComponent,
    StaticComponent,
   NotificationComponent,
   TicketDetailsComponent,
   LogTimeDialogComponent
 
 
   
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DragDropModule,
    FormsModule,
    ReactiveFormsModule,  MatDialogModule, 
    
    
    HttpClientModule,
    RouterModule.forRoot([
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

        { path: 'create-project', component: ProjectserviceComponent },
      { path: 'board', component: DashboardComponent},
      { path: 'tickets', component: TicketsComponent},
       { path: 'Dashboard', component: DashboardadminComponent},
        { path: 'add-employee', component: AddEmployeeComponent},
         { path: 'static', component:  StaticComponent },
             { path: 'notif', component:  NotificationComponent },
{ path: 'detilsticket/:id', component: TicketDetailsComponent },

   
    ])
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInjectInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: kcFactory,
      deps: [KeycloakService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}