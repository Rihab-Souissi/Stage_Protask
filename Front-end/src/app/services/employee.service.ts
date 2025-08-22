import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:8088/api/v1/api/employees';

  constructor(private http: HttpClient) {}

  createEmployee(email: string, password: string): Observable<string> {
    const body = { email, password };
    return this.http.post(`${this.apiUrl}/create`, body, { responseType: 'text' });
  }
}
