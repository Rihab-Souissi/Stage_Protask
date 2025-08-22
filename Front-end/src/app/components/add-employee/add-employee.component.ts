import { Component, OnInit } from '@angular/core';
import { EmployeeService } from 'src/app/services/employee.service';

@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.scss']
})
export class AddEmployeeComponent implements OnInit {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {}

  CreateEmployee(): void {
    // Réinitialiser les messages
    this.successMessage = '';
    this.errorMessage = '';
    this.isLoading = true;

    this.employeeService.createEmployee(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Réponse backend :', response);
        this.isLoading = false;
        this.successMessage = `Employé créé avec succès ! Un e-mail a été envoyé à ${this.email}`;
        
        // Réinitialiser le formulaire après succès
        setTimeout(() => {
          this.resetForm();
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur lors de la création de l\'employé', err);
        this.isLoading = false;
        
        // Gérer différents types d'erreurs
        if (err.status === 400) {
          this.errorMessage = 'Données invalides. Veuillez vérifier les informations saisies.';
        } else if (err.status === 409) {
          this.errorMessage = 'Un employé avec cette adresse e-mail existe déjà.';
        } else if (err.status === 500) {
          this.errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          this.errorMessage = 'Une erreur est survenue lors de la création de l\'employé.';
        }

        // Masquer le message d'erreur après 5 secondes
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }

  private resetForm(): void {
    this.email = '';
    this.password = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Méthode pour masquer les messages manuellement
  dismissMessage(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}