import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8088/api/v1/api/projects';

  constructor(private http: HttpClient) {}

  createProject(projectData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, projectData);
  }
}
