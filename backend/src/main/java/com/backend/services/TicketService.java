package com.backend.services;
import com.backend.entities.Project;
import com.backend.entities.Ticket;
import com.backend.entities.TicketStatus;
import com.backend.entities.TimeLog;
import com.backend.repository.ProjectRepository;
import com.backend.repository.TicketRepository;
import com.backend.repository.TimeLogRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@Service
@RequiredArgsConstructor

public class TicketService {

    private final TicketRepository ticketRepository;
    private final ProjectRepository projectRepository;
     private final NotificationService notificationService;

   public Ticket createTicket(Long projectId, Ticket ticket, @AuthenticationPrincipal Jwt jwt) {
    Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

    ticket.setProject(project);
    ticket.setStatus(TicketStatus.TODO);
    ticket.setCreatedAt(LocalDate.now());
    ticket.setUpdatedAt(LocalDate.now());

    Ticket savedTicket = ticketRepository.save(ticket);

   String assignedEmployee = ticket.getAssignedEmployeeUsername();
        if (assignedEmployee != null && !assignedEmployee.isEmpty()) {
            String managerUsername = jwt.getClaimAsString("preferred_username");
            
            // Utiliser la nouvelle méthode du NotificationService
            notificationService.notifyTicketAssignment(
                assignedEmployee, 
                managerUsername, 
                ticket.getTitle()
            );
        }

    return savedTicket;
}


   public Ticket assignTicket(Long ticketId, String employeeUsername, @AuthenticationPrincipal Jwt jwt) {
        Ticket ticket = getTicketById(ticketId);
        
        // Stocker l'ancien assigné pour comparaison
        String previousAssignee = ticket.getAssignedEmployeeUsername();
        
        ticket.setAssignedEmployeeUsername(employeeUsername);
        ticket.setUpdatedAt(LocalDate.now());
        
        Ticket savedTicket = ticketRepository.save(ticket);
        
        // 🚀 NOTIFICATION si changement d'assignation
        if (!employeeUsername.equals(previousAssignee)) {
            String managerUsername = jwt.getClaimAsString("preferred_username");
            notificationService.notifyTicketAssignment(
                employeeUsername, 
                managerUsername, 
                ticket.getTitle()
            );
        }
        
        return savedTicket;
    }



public Ticket updateStatus(Long ticketId, TicketStatus status, String currentUsername, List<String> roles) {
    Ticket ticket = getTicketById(ticketId);

    boolean isAdmin = roles != null && roles.contains("Admin");

    if (!ticket.getAssignedEmployeeUsername().equals(currentUsername) && !isAdmin) {
        throw new RuntimeException("Vous n'avez pas le droit de modifier ce ticket.");
    }

    if (ticket.getStatus() == TicketStatus.VALIDATED) {
        throw new RuntimeException("Ce ticket est déjà validé et ne peut plus être modifié.");
    }

    ticket.setStatus(status);
    ticket.setUpdatedAt(LocalDate.now());
    return ticketRepository.save(ticket);
}


    public Ticket validateTicket(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);

        if (ticket.getStatus() != TicketStatus.DONE) {
            throw new RuntimeException("Seuls les tickets terminés peuvent être validés.");
        }

        ticket.setStatus(TicketStatus.VALIDATED);
        ticket.setUpdatedAt(LocalDate.now());
        return ticketRepository.save(ticket);
    }

    public List<Ticket> getTicketsByEmployee(String employeeUsername) {
        return ticketRepository.findByAssignedEmployeeUsername(employeeUsername);
    }
    

    private Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }
    public List<Ticket> getValidatedTicketsForEmployee() {
    return ticketRepository.findByStatusAndValidatedByAdminTrue(TicketStatus.VALIDATED);
}
   public List<Ticket> getMyTicketsFiltered(String username, String projectName) {
        if (projectName != null && !projectName.isEmpty()) {
            return ticketRepository.findByAssignedEmployeeUsernameAndProjectName(username, projectName);
        } else {
            return ticketRepository.findByAssignedEmployeeUsername(username);
        }
    }
   public Map<TicketStatus, Long> countTicketsByStatus() {
    List<Object[]> results = ticketRepository.countTicketsGroupByStatus();
    Map<TicketStatus, Long> map = new HashMap<>();
    for (Object[] row : results) {
        TicketStatus status = (TicketStatus) row[0];
        Long count = (Long) row[1];
        map.put(status, count);
    }
    return map;
}

public static class WorkTimeEntry {
    private String projectName;
    private String employeeUsername;
    private Long totalWorkedMinutes;

    public WorkTimeEntry(String projectName, String employeeUsername, Long totalWorkedMinutes) {
        this.projectName = projectName;
        this.employeeUsername = employeeUsername;
        this.totalWorkedMinutes = totalWorkedMinutes;
    }


    public String getProjectName() { return projectName; }
    public String getEmployeeUsername() { return employeeUsername; }
    public Long getTotalWorkedMinutes() { return totalWorkedMinutes; }
}

public List<WorkTimeEntry> getWorkTimePerProjectAndEmployee() {
    List<Ticket> tickets = ticketRepository.findAll();

    Map<String, Map<String, Long>> projectEmployeeDurationMap = new HashMap<>();

    for (Ticket ticket : tickets) {
        if (ticket.getStartTime() != null && ticket.getEndTime() != null) {
            String project = ticket.getProject().getName();
            String employee = ticket.getAssignedEmployeeUsername();
            long duration = Duration.between(ticket.getStartTime(), ticket.getEndTime()).toMinutes();

            projectEmployeeDurationMap
                .computeIfAbsent(project, k -> new HashMap<>())
                .merge(employee, duration, Long::sum);
        }
    }

    List<WorkTimeEntry> result = new ArrayList<>();
    for (Map.Entry<String, Map<String, Long>> projectEntry : projectEmployeeDurationMap.entrySet()) {
        String projectName = projectEntry.getKey();
        for (Map.Entry<String, Long> empEntry : projectEntry.getValue().entrySet()) {
            result.add(new WorkTimeEntry(projectName, empEntry.getKey(), empEntry.getValue()));
        }
    }

    return result;
}


public Ticket logWorkTime(Long ticketId, LocalDateTime start, LocalDateTime end, String username) {
    Ticket ticket = getTicketById(ticketId);

    // Vérifier que l'utilisateur est bien assigné à ce ticket
    if (!ticket.getAssignedEmployeeUsername().equals(username)) {
        throw new RuntimeException("❌ Vous n'êtes pas assigné à ce ticket.");
    }

    // Calculer la durée du travail effectué
    long workedMinutes = Duration.between(start, end).toMinutes();
    long workedHours = workedMinutes / 60;

    // Calculer le temps déjà travaillé (s'il existe)
    long previousWorkedHours  = 0;
    if (ticket.getStartTime() != null && ticket.getEndTime() != null) {
        previousWorkedHours  = Duration.between(ticket.getStartTime(), ticket.getEndTime()).toMinutes();
    }

    double totalWorkedHours = previousWorkedHours + workedHours;

if (totalWorkedHours > ticket.getEstimatedTime()) {
    throw new RuntimeException("⛔ Temps estimé dépassé. Estimé: " + ticket.getEstimatedTime() + "h, Total: " + totalWorkedHours + "h");
}


    // Mettre à jour les temps
    ticket.setStartTime(start);
    ticket.setEndTime(end);
    ticket.setUpdatedAt(LocalDate.now());

    return ticketRepository.save(ticket);
}

public Map<String, Long> countTicketsByStatusForProject(String projectName) {
    List<Object[]> results = ticketRepository.countTicketsByStatusAndProjectName(projectName);
    Map<String, Long> stats = new HashMap<>();
    for (Object[] result : results) {
        // solution ici
        String status = ((TicketStatus) result[0]).name();
        Long count = (Long) result[1];
        stats.put(status, count);
    }
    return stats;
}


public Ticket findById(Long id) {
    return ticketRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Ticket non trouvé avec l'id : " + id));
}

private final TimeLogRepository timeLogRepository;
public TimeLog saveTimeLog(Long ticketId, LocalDate date, double duration, String username) {
    Ticket ticket = ticketRepository.findById(ticketId)
        .orElseThrow(() -> new RuntimeException("Ticket not found"));

    TimeLog timeLog = new TimeLog();
    timeLog.setTicket(ticket);
    timeLog.setDate(date);
    timeLog.setDuration(duration);  // durée en heures
    timeLog.setEmployeeUsername(username);

    TimeLog savedLog = timeLogRepository.save(timeLog);

    // Met à jour le temps total travaillé sur le ticket
    updateWorkedTimeHours(ticketId);

    return savedLog;
}


    public List<TimeLog> getTimeLogsByTicketId(Long ticketId) {
        return timeLogRepository.findByTicketId(ticketId); 
    }
  public void updateWorkedTimeHours(Long ticketId) {
    List<TimeLog> logs = timeLogRepository.findByTicketId(ticketId);

    // Somme des durées en heures (double)
    double totalHours = logs.stream()
        .mapToDouble(TimeLog::getDuration)
        .sum();

    Ticket ticket = ticketRepository.findById(ticketId)
        .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

    // Il te faudra un champ ticket.workedTimeHours (double) à créer dans l'entité Ticket
    ticket.setWorkedTimeHours(totalHours);

    ticketRepository.save(ticket);
}



}
