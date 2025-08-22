import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectStateService } from '../shared/project-state.service';
import { TicketService } from 'src/app/services/ticket.service'; // ✅ service

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit {
  ticketForm: FormGroup;
  projects: any[] = [];
  employees: any[] = [];
  statuses = ['TODO', 'IN_PROGRESS', 'DONE', 'VALIDATED'];
  priorities = ['LOW', 'MEDIUM', 'HIGH'];
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private projectState: ProjectStateService
  ) {
  this.ticketForm = this.fb.group({
  projectId: ['', Validators.required],
  title: ['', Validators.required],
  description: ['', Validators.required],
  priority: ['MEDIUM', Validators.required],
  status: ['TODO', Validators.required],
  reporter: ['', Validators.required],
  estimatedTime: ['', [Validators.required, Validators.min(1)]], 
});

  }

  ngOnInit() {
    this.ticketService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        const selected = this.projectState.getProject();
        if (selected) {
          this.ticketForm.patchValue({ projectId: selected.id });
          this.projectState.clearProject();
        }
      },
      error: err => console.error('Erreur chargement projets', err)
    });

    this.ticketService.getEmployees().subscribe({
      next: (employees) => this.employees = employees,
      error: err => console.error('Erreur chargement employés', err)
    });
  }
startTicket(ticketId: number) {
  this.ticketService.startTicket(ticketId).subscribe({
    next: () => alert('▶️ Travail commencé pour le ticket ' + ticketId),
    error: err => {
      console.error('Erreur au démarrage du ticket', err);
      alert('❌ Erreur lors du démarrage du ticket');
    }
  });
}

finishTicket(ticketId: number) {
  this.ticketService.finishTicket(ticketId).subscribe({
    next: (ticket) => {
      const start = new Date(ticket.startTime);
      const end = new Date(ticket.endTime);
      const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
      alert(`✅ Ticket terminé ! Temps total de travail : ${minutes} minutes`);
    },
    error: err => {
      console.error('Erreur à la fin du ticket', err);
      alert('❌ Erreur lors de la finalisation du ticket');
    }
  });
}

 submit() {
  if (this.ticketForm.invalid) return;

  const data = this.ticketForm.value;

  const currentDate = new Date();
  const estimatedHours = parseFloat(data.estimatedTime);
 const estimatedDate = new Date(currentDate.getTime() + estimatedHours * 60 * 60 * 1000);

  const ticketData = {
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: data.status,
    assignedEmployeeUsername: data.reporter,
  estimatedTime: estimatedHours
  };

  this.ticketService.createTicket(data.projectId, ticketData).subscribe({
    next: (ticket) => {
      console.log('✅ Ticket créé', ticket);
      const ticketId = ticket.id;

      this.ticketService.assignTicket(ticketId, data.reporter).subscribe({
        next: () => alert('✅ Ticket assigné avec succès'),
        error: err => {
          console.error(err);
          alert('⚠️ Ticket créé, mais assignation échouée');
        }
      });
    },
    error: err => {
      console.error(err);
      alert('❌ Erreur lors de la création du ticket');
    }
  });
}
 dismissMessage(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

}
