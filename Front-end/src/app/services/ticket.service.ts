import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private baseUrl = 'http://localhost:8088/api/v1/api';

  constructor(private http: HttpClient) {}

  getProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/projects`);
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees`);
  }

  createTicket(projectId: number, ticketData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.baseUrl}/tickets/${projectId}`, ticketData, { headers });
  }

  assignTicket(ticketId: number, employeeUsername: string): Observable<any> {
    const params = new HttpParams().set('employeeUsername', employeeUsername);
    return this.http.put(`${this.baseUrl}/tickets/${ticketId}/assign`, null, { params });
  }
  startTicket(ticketId: number): Observable<any> {
  return this.http.put(`${this.baseUrl}/tickets/${ticketId}/start`, null);
}

finishTicket(ticketId: number): Observable<any> {
  return this.http.put(`${this.baseUrl}/tickets/${ticketId}/finish`, null);
}
getTicketById(ticketId: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/tickets/${ticketId}`);
}



}
