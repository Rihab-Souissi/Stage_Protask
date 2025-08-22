
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TimeLog } from './dashboard.service';
@Injectable({
  providedIn: 'root'
})
export class TimeLogService {
  private apiUrl = 'http://localhost:8088/api/v1/api/timelogs'; 

  constructor(private http: HttpClient) {}

  logTime(ticketId: number, date: string, duration: number) {
    return this.http.post(this.apiUrl, {
      ticketId,
      date,
      duration
    });
  }
  getTimeLogsByTicketId(ticketId: number) {
  return this.http.get<TimeLog[]>(`/ticket/${ticketId}`);
}

}
