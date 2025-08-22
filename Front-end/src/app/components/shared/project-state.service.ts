import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProjectStateService {
  private createdProject: any = null;

  setProject(project: any) {
    this.createdProject = project;
  }

  getProject() {
    return this.createdProject;
  }

  clearProject() {
    this.createdProject = null;
  }
}
