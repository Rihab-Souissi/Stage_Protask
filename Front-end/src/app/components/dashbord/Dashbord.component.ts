import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Ticket } from 'src/app/models/Ticket.model';
import { Comment } from 'src/app/models/Comment.model';
import { Project } from 'src/app/models/Project.model';
import { StatusColumn } from 'src/app/models/StatusColumn.model';
import { DashboardService } from 'src/app/services/dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { TicketDetailsComponent } from '../ticket-details/ticket-details.component';
import { TicketService } from 'src/app/services/ticket.service';
import { LogTimeDialogComponent } from '../log-time-dialog/log-time-dialog.component';
import { forkJoin } from 'rxjs';
import { LogTimeResult } from '../log-time-dialog/log-time-dialog.component';
export interface TimeLog {
  date: string;
  duration: number;
  description?: string;
}

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.scss']
})
export class DashboardComponent implements OnInit {

  statusColumns: StatusColumn[] = [
    { key: 'TODO', label: 'TO DO', color: '#f8f9fa', tickets: [], disabled: true },
    { key: 'IN_PROGRESS', label: 'IN PROGRESS', color: '#fff3cd', tickets: [], disabled: true },
    { key: 'IN_REVIEW', label: 'IN REVIEW', color: '#e2e3ff', tickets: [], disabled: true },
    { key: 'DONE', label: 'DONE', color: '#d4edda', tickets: [], disabled: false },
    { key: 'VALIDATED', label: 'VALIDATED', color: '#d1ecf1', tickets: [], disabled: false }
  ];

  projects: Project[] = [];
  selectedProject?: Project;

  currentUsername = '';
  isAdmin = false;

  isLoading = false;
  error: string | null = null;

 selectedTicket: any = null;
  selectedTicketComments: Comment[] = [];
  newCommentContent = '';

  constructor(
    private dashboardService: DashboardService,
    private ticketService: TicketService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadProjects();
  }

  refreshTickets(): void {
    this.loadTickets();
  }

  loadCurrentUser(): void {
    this.dashboardService.getCurrentUser().subscribe({
      next: user => {
        this.currentUsername = user.id;
        this.isAdmin = user.roles.includes('ROLE_ADMIN');
      },
      error: err => {
        console.error("Impossible de récupérer les infos utilisateur", err);
        this.error = "Impossible de récupérer les infos utilisateur";
      }
    });
  }

  loadProjects(): void {
    this.dashboardService.getProjects().subscribe({
      next: projects => {
        this.projects = projects;
        if (projects.length > 0) {
          this.selectedProject = projects[0];
          this.loadTickets();
        }
      },
      error: err => {
        console.error('Erreur lors du chargement des projets', err);
        this.error = 'Erreur lors du chargement des projets';
      }
    });
  }

  onProjectChange(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    if (!this.selectedProject) {
      this.error = 'Aucun projet sélectionné';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.dashboardService.getTickets(this.selectedProject.name).subscribe({
      next: tickets => {
        this.distributeTickets(tickets);
        this.isLoading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement des tickets :', err);
        this.error = 'Erreur lors du chargement des tickets';
        this.isLoading = false;
      }
    });
  }



  private distributeTickets(tickets: Ticket[]): void {
    this.statusColumns.forEach(col => col.tickets = []);
    tickets.forEach(ticket => {
      console.log('Ticket:', ticket.id, 'estimated:', ticket.estimatedTime);
      const status = ticket.status.toUpperCase() as Ticket['status'];
      const col = this.statusColumns.find(c => c.key === status);
      if (col) {
        col.tickets.push(ticket);
      }
    });
  }

  onSelectTicket(ticket: Ticket): void {
    if (!this.canAccessComments(ticket)) {
      alert("Vous n'êtes pas autorisé à voir les commentaires de ce ticket.");
      return;
    }

    this.selectedTicket = ticket;
    this.loadComments(ticket.id);
  }

  canAccessComments(ticket: Ticket): boolean {
    return this.isAdmin || ticket.assignee === this.currentUsername;
  }

  loadComments(ticketId: number): void {
    this.selectedTicketComments = [];

    this.dashboardService.getComments(ticketId).subscribe({
      next: comments => {
        this.selectedTicketComments = comments;
      },
      error: err => {
        if (err.status === 403) {
          alert("Accès refusé aux commentaires.");
        } else {
          console.error('Erreur lors du chargement des commentaires', err);
        }
      }
    });
  }

 


  newCommentText: string = '';
  commentsByTicket: { [key: string]: any[] } = {}; // Typage explicite


showTicketPopup = false;
showCommentPopup = false;



// Méthode pour ajouter un commentaire
addComment(ticketId: number, content: string): void {
  if (!content.trim()) return;

  this.dashboardService.addComment(ticketId, content).subscribe({
    next: (response) => {
      // Vider le champ de texte
      this.newCommentText = '';
      
      // Recharger les commentaires pour ce ticket
      this.getComments(ticketId);
      
      console.log('Commentaire ajouté avec succès');
    },
    error: (err) => {
      console.error('Erreur ajout commentaire', err);
    }
  });
}


// Vérifier si un ticket a des commentaires
hasComments(ticketId: any): boolean {
  return this.commentsByTicket[ticketId] && this.commentsByTicket[ticketId].length > 0;
}
getComments(ticketId: number): void {
  this.dashboardService.getCommentsByTicketId(ticketId).subscribe({
    next: (comments) => {
      this.commentsByTicket[ticketId] = comments;
    },
    error: (err) => {
      console.error('Erreur récupération commentaires', err);
      this.commentsByTicket[ticketId] = [];
    }
  });
}

// Ouvrir la popup de détails du ticket
openTicketPopup(ticket: any): void {
  console.log('Ticket sélectionné:', ticket);
  this.selectedTicket = ticket;
  this.showTicketPopup = true;
  this.showCommentPopup = false;
  
  // Charger les commentaires pour ce ticket s'ils ne sont pas déjà chargés
  if (!this.commentsByTicket[ticket.id]) {
    this.getComments(ticket.id);
  }
}

// Ouvrir directement la popup de commentaires depuis un ticket
openCommentPopup(ticket: any): void {
  this.selectedTicket = ticket;
  this.showCommentPopup = true;
  this.showTicketPopup = false;
  
  // Charger les commentaires pour ce ticket s'ils ne sont pas déjà chargés
  if (!this.commentsByTicket[ticket.id]) {
    this.getComments(ticket.id);
  }
}

// Ouvrir la popup de commentaires depuis la popup de détails
openCommentPopupFromDetails(): void {
  if (this.selectedTicket) {
    this.showTicketPopup = false;
    this.showCommentPopup = true;
    
    // Charger les commentaires si pas déjà fait
    if (!this.commentsByTicket[this.selectedTicket.id]) {
      this.getComments(this.selectedTicket.id);
    }
  }
}

// Fermer la popup de détails du ticket
closeTicketPopup(): void {
  this.showTicketPopup = false;
  // Ne pas réinitialiser selectedTicket ici pour permettre la navigation entre popups
}

// Fermer la popup de commentaires
closeCommentPopup(): void {
  this.showCommentPopup = false;
  // Vider le texte du nouveau commentaire
  this.newCommentText = '';
  // Ne réinitialiser selectedTicket que si aucune autre popup n'est ouverte
  if (!this.showTicketPopup) {
    this.selectedTicket = null;
  }
}

// Fermer toutes les popups (méthode utilitaire)
closeAllPopups(): void {
  this.showTicketPopup = false;
  this.showCommentPopup = false;
  this.selectedTicket = null;
  this.newCommentText = '';
}

// Méthode pour naviguer de la popup commentaires vers la popup détails
backToTicketDetails(): void {
  if (this.selectedTicket) {
    this.showCommentPopup = false;
    this.showTicketPopup = true;
    this.newCommentText = '';
  }
}



  // Méthode pour vérifier si le temps de travail loggé dépasse le temps estimé
  isTimeExceeded(ticket: Ticket): boolean {
    if (!ticket.estimatedTime || !ticket.workedTimeHours) {
      return false;
    }
    
    // Si le ticket est terminé, pas besoin de vérifier
    if (ticket.status === 'DONE' || ticket.status === 'VALIDATED') {
      return false;
    }

    // Convertir le temps estimé (string) en heures
    const estimatedHours = parseFloat(ticket.estimatedTime);
    if (isNaN(estimatedHours)) return false;

    // Convertir les minutes travaillées en heures
    const workedHours = ticket.workedTimeHours;
    
    return workedHours > estimatedHours;
  }

  // Méthode pour calculer le temps total loggé (en utilisant workedTimeMinutes)
  getTotalLoggedTime(ticket: Ticket): number {
    if (!ticket.workedTimeHours) return 0;
    // Retourner en heures
    return ticket.workedTimeHours;
  }

  onDrop(event: CdkDragDrop<Ticket[]>, targetStatus: Ticket['status']): void {
    const ticket = event.previousContainer.data[event.previousIndex];
    const oldStatus = ticket.status;

    if (targetStatus === 'VALIDATED' && !this.isAdmin) {
      alert("Seul un administrateur peut valider un ticket.");
      this.loadTickets();
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      ticket.status = targetStatus;
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

      this.dashboardService.updateTicketStatus(ticket.id, targetStatus).subscribe({
        next: () => console.log(`Ticket ${ticket.id} mis à jour`),
        error: err => {
          console.error('Erreur lors de la mise à jour du statut :', err);
          ticket.status = oldStatus;
          this.loadTickets();
        }
      });
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
  }


// Méthode pour ouvrir le dialog de log time - VERSION CORRIGÉE
openLogTimeDialog(ticket: Ticket): void {
  // IMPORTANT: Recharger le ticket depuis le serveur avant d'ouvrir le dialog
  this.ticketService.getTicketById(ticket.id).subscribe({
    next: (freshTicket) => {
      // Ouvrir le dialog avec les données fraîches
      const dialogRef = this.dialog.open(LogTimeDialogComponent, {
        width: '600px',
        maxWidth: '90vw',
        data: { ticket: freshTicket }
      });

      dialogRef.afterClosed().subscribe((result: LogTimeResult | undefined) => {
        if (result) {
          const requests = result.timeLogs.map(timeLog => 
            this.dashboardService.logTimeEntry(freshTicket.id, timeLog.date, timeLog.duration)
          );

          if (requests.length === 0) return;

          const handleSuccess = () => {
            const successMessage = requests.length === 1 
              ? "✅ Session de travail enregistrée avec succès."
              : `✅ ${result.timeLogs.length} sessions de travail enregistrées avec succès.`;
            
            alert(successMessage);
            
            // Mise à jour locale immédiate
            freshTicket.workedTimeMinutes = result.totalWorkedMinutes;
            this.updateTicketInColumns(freshTicket);
          };

          const handleError = (err: any) => {
            console.error("Erreur lors de la sauvegarde:", err);
            alert("❌ Erreur lors de l'enregistrement des sessions de travail.");
          };

          if (requests.length === 1) {
            requests[0].subscribe({ next: handleSuccess, error: handleError });
          } else {
            forkJoin(requests).subscribe({ next: handleSuccess, error: handleError });
          }
        }
      });
    },
    error: (err) => {
      console.error('Erreur lors du rechargement du ticket:', err);
      alert('❌ Erreur lors du chargement des données du ticket');
    }
  });
}

// Améliorer la méthode updateTicketInColumns pour une mise à jour complète
private updateTicketInColumns(updatedTicket: Ticket): void {
  this.statusColumns.forEach(column => {
    const ticketIndex = column.tickets.findIndex(t => t.id === updatedTicket.id);
    if (ticketIndex !== -1) {
      // Remplacer complètement le ticket pour s'assurer que toutes les propriétés sont à jour
      column.tickets[ticketIndex] = { ...updatedTicket };
    }
  });
}

  }
