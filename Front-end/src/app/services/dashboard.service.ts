import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../models/Ticket.model';
import { Comment } from '../models/Comment.model';
import { Project } from '../models/Project.model';

export interface TimeLog {
  date: string;
  duration: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'  
})
export class DashboardService {
  private baseUrl = 'http://localhost:8088/api/v1/api';

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<{ username: string; id: string; roles: string[] }> {
    return this.http.get<{ username: string; id: string; roles: string[] }>(`${this.baseUrl}/employees/me`);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects`);
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  getTickets(projectName: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl}/tickets/my-tickets?project=${projectName}`);
  }

  getComments(ticketId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.baseUrl}/comments/ticket/${ticketId}`);
  }

  addComment(ticketId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.baseUrl}/comments/ticket/${ticketId}`, { content });
  }

  updateTicketStatus(ticketId: number, status: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/tickets/${ticketId}/status?status=${status}`, null);
  }

  validateTicket(ticketId: number): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.baseUrl}/tickets/${ticketId}/validate`, null);
  }

  // Votre méthode existante pour logger le temps
  logTimeEntry(ticketId: number, date: string, duration: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/timelogs`, {
      ticketId: ticketId.toString(),
      date: date,
      duration: duration.toString()
    });
  }

  // Méthode optionnelle pour récupérer les temps loggés d'un ticket
  // (Ajoutez ceci si votre backend supporte cette fonctionnalité)
  getTimeLogsByTicket(ticketId: number): Observable<TimeLog[]> {
    return this.http.get<TimeLog[]>(`${this.baseUrl}/timelogs/ticket/${ticketId}`);
  }

  // Méthode optionnelle pour logger avec description
  // (Ajoutez ceci si vous voulez supporter les descriptions)
  logTimeEntryWithDescription(ticketId: number, date: string, duration: number, description?: string): Observable<any> {
    const payload: any = {
      ticketId: ticketId.toString(),
      date: date,
      duration: duration.toString()
    };
    
    if (description) {
      payload.description = description;
    }
    
    return this.http.post(`${this.baseUrl}/timelogs`, payload);
  }
  // Dans votre service
getCommentsByTicketId(ticketId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/comments/ticket/${ticketId}`);
}
}