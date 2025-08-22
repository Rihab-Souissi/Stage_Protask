import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectStateService } from 'src/app/components/shared/project-state.service';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-projectservice',
  templateUrl: './projectservice.component.html',
  styleUrls: ['./projectservice.component.scss']
})
export class ProjectserviceComponent {
  form: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private projectState: ProjectStateService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.isLoading = true;
      const projectData = this.form.value;

      this.projectService.createProject(projectData).subscribe({
        next: (createdProject) => {
          setTimeout(() => {
            this.isLoading = false;
            this.successMessage = `Le projet "${projectData.name}" a été créé avec succès !`;

            this.projectState.setProject(createdProject);
            this.router.navigate(['/tickets']);

            setTimeout(() => {
              this.resetForm();
            }, 3000);
          }, 2000);
        },
        error: err => {
          console.error(err);
          setTimeout(() => {
            this.isLoading = false;
            this.errorMessage = 'Une erreur est survenue lors de la création du projet. Veuillez réessayer.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          }, 2000);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  private resetForm(): void {
    this.form.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.markFormGroupUntouched();
  }

  private markFormGroupUntouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsUntouched();
    });
  }

  dismissMessage(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  get nameControl() {
    return this.form.get('name');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  getCharacterCount(controlName: string): number {
    return this.form.get(controlName)?.value?.length || 0;
  }
}
