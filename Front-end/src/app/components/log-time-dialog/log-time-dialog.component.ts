import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimeLogService } from 'src/app/services/time-log.service'; 
import { Ticket,TimeLog } from 'src/app/models/Ticket.model';


export interface LogTimeResult {
  timeLogs: TimeLog[];
  totalTime: number;
  totalWorkedMinutes: number;
  newSessionsTime: number;
  isTimeExceeded: boolean;
}



@Component({
  selector: 'app-log-time-dialog',
  templateUrl: './log-time-dialog.component.html',
  styleUrls: ['./log-time-dialog.component.scss']
})
export class LogTimeDialogComponent implements OnInit {
  form: FormGroup;
  timeLogs: TimeLog[] = [];
  totalLoggedTime = 0;
  remainingTime = 0;
  isTimeExceeded = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LogTimeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket },
    private timeLogService: TimeLogService

   
  ) {
    this.form = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      duration: ['', [Validators.required, Validators.min(0.1)]],
      description: ['']
    });
  }

  ngOnInit() {
    // Recharger les données du ticket pour avoir les valeurs à jour
    this.refreshTicketData();
    this.calculateTotalTime();
     this.loadSavedTimeLogs();
  }

  // Nouvelle méthode pour recharger les données du ticket
  private refreshTicketData(): void {
    // Pour debug, afficher les valeurs actuelles
    console.log('=== DEBUG TICKET DATA ===');
    console.log('Ticket ID:', this.data.ticket.id);
    console.log('Ticket title:', this.data.ticket.title);
    console.log('workedTimeMinutes:', this.data.ticket.workedTimeHours);
    console.log('estimatedTime:', this.data.ticket.estimatedTime);
    console.log('assignedEmployeeUsername:', this.data.ticket.assignedEmployeeUsername);
    console.log('Full ticket object:', this.data.ticket);
    
    // Chercher toutes les propriétés qui pourraient contenir le temps de travail
    console.log('=== RECHERCHE PROPRIETES TEMPS ===');
    Object.keys(this.data.ticket).forEach(key => {
      const value = (this.data.ticket as any)[key];
      if (key.toLowerCase().includes('time') || 
          key.toLowerCase().includes('worked') || 
          key.toLowerCase().includes('logged') ||
          key.toLowerCase().includes('minutes') ||
          key.toLowerCase().includes('hours')) {
        console.log(`${key}:`, value);
      }
    });
    console.log('========================');
  }

calculateTotalTime(): void {
  // workedTimeHours déjà totalisé par le back
  const workedTimeHours = this.data.ticket.workedTimeHours || 0; // déjà en heures

  // Ne pas rajouter newSessionsTime si ces logs sont déjà pris en compte dans workedTimeHours
  const totalLoggedTime = workedTimeHours;

  const estimatedTime = parseFloat(this.data.ticket.estimatedTime || '0');
  const remainingTime = estimatedTime - totalLoggedTime;

  console.log("workedTimeHours (from backend):", workedTimeHours);
  console.log("totalLoggedTime:", totalLoggedTime);
  console.log("remainingTime:", remainingTime);

  if (remainingTime < 0) {
    alert("⚠️ Vous avez dépassé le temps estimé !");
  }

  this.totalLoggedTime = totalLoggedTime;
  this.remainingTime = remainingTime;
  this.isTimeExceeded = totalLoggedTime > estimatedTime;
}




  addTimeLog() {
    if (this.form.valid) {
      const newLog: TimeLog = {
        date: this.form.value.date,
        duration: parseFloat(this.form.value.duration),
        description: this.form.value.description || ''
      };

      this.timeLogs.push(newLog);
      this.calculateTotalTime();

      // Réinitialiser le formulaire pour une nouvelle entrée
      this.form.patchValue({
        date: new Date().toISOString().split('T')[0],
        duration: '',
        description: ''
      });

      // Afficher l'alerte si le temps est dépassé
      if (this.isTimeExceeded) {
        const estimatedTime = parseFloat(this.data.ticket.estimatedTime || '0');
        const exceededTime = this.totalLoggedTime - estimatedTime;
        alert(`⚠️ Vous avez dépassé le temps estimé de ${estimatedTime}h de ${exceededTime.toFixed(1)}h !`);
      }
    }
  }

  removeTimeLog(index: number) {
    this.timeLogs.splice(index, 1);
    this.calculateTotalTime();
  }

saveAllTimeLogs() {
  if (this.timeLogs.length === 0) {
    alert('⚠️ Veuillez ajouter au moins une session de travail.');
    return;
  }

  const saveOperations = this.timeLogs.map(log =>
    this.timeLogService.logTime(this.data.ticket.id, log.date, log.duration).toPromise()
  );

  Promise.all(saveOperations)
    .then(() => {
      // Recharger les logs depuis le back pour avoir le vrai total
      this.loadSavedTimeLogs();
      this.dialogRef.close();
    })
    .catch(error => {
      console.error('Erreur lors de l’enregistrement des logs:', error);
      alert('❌ Une erreur est survenue lors de l’enregistrement.');
    });
}



  cancel() {
    this.dialogRef.close();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  // Méthode utilitaire pour le template
  parseFloat(value: string): number {
    return parseFloat(value || '0');
  }

  // Getter pour obtenir le temps déjà travaillé en heures (pour le template)
  get alreadyWorkedHours(): number {
    return (this.data.ticket.workedTimeHours|| 0) / 60;
  }

  // Getter pour obtenir le temps des nouvelles sessions (pour le template)
  get newSessionsTime(): number {
    return this.timeLogs.reduce((total, log) => total + log.duration, 0);
  }

  // Getter pour obtenir le nom de l'utilisateur assigné
  get assigneeName(): string {
    // Essayer d'abord assignedEmployeeUsername (propriété réelle)
    if (this.data.ticket.assignedEmployeeUsername) {
      return this.data.ticket.assignedEmployeeUsername;
    }
    
    // Fallback sur assignee si elle existe
    if (this.data.ticket.assignee) {
      return this.data.ticket.assignee;
    }
    
    return 'Non assigné';
  }
  loadSavedTimeLogs() {
  this.timeLogService.getTimeLogsByTicketId(this.data.ticket.id).subscribe(
    (logs: TimeLog[]) => {
      this.timeLogs = logs;
      this.calculateTotalTime();
    },
    error => {
      console.error('Erreur lors du chargement des logs:', error);
    }
  );
}

}