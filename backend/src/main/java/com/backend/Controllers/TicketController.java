package com.backend.Controllers;
import com.backend.entities.Ticket;
import com.backend.entities.TicketStatus;

import com.backend.services.TicketService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

  
@PostMapping(value = "/{projectId}", 
             consumes = MediaType.APPLICATION_JSON_VALUE,
             produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('MANAGER')")
public ResponseEntity<Ticket> createTicket(
        @PathVariable Long projectId,
        @RequestBody Ticket ticket,
        @AuthenticationPrincipal Jwt jwt
) {
    Ticket created = ticketService.createTicket(projectId, ticket, jwt);
    return ResponseEntity.ok(created);
}

    
   @PutMapping("/{ticketId}/assign")
@PreAuthorize("hasRole('MANAGER')")
public ResponseEntity<Ticket> assignTicket(
        @PathVariable Long ticketId,
        @RequestParam String employeeUsername,
        @AuthenticationPrincipal Jwt jwt  // récupère le token JWT pour le username
) {
    Ticket assigned = ticketService.assignTicket(ticketId, employeeUsername,jwt);

    
    String managerUsername = jwt.getClaimAsString("preferred_username");


    return ResponseEntity.ok(assigned);
}

  
  @PutMapping("/{ticketId}/status")
@PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN')")
public ResponseEntity<Ticket> updateStatus(
        @PathVariable Long ticketId,
        @RequestParam TicketStatus status,
        @AuthenticationPrincipal Jwt jwt
) {
    String username = jwt.getClaim("preferred_username");
    Map<String, Object> realmAccess = jwt.getClaim("realm_access");
    List<String> roles = (List<String>) realmAccess.get("roles");

    Ticket updated = ticketService.updateStatus(ticketId, status, username, roles);
    return ResponseEntity.ok(updated);
}


@GetMapping("/{ticketId}")
@PreAuthorize("hasAnyRole('EMPLOYEE','ADMIN','MANAGER')")
public ResponseEntity<Ticket> getTicketById(@PathVariable Long ticketId,
                                            @AuthenticationPrincipal Jwt jwt) {
    Ticket ticket = ticketService.findById(ticketId);
    return ResponseEntity.ok(ticket);
}
@PutMapping("/{ticketId}/log-time")
public ResponseEntity<Ticket> logTime(
        @PathVariable Long ticketId,
        @RequestParam String start,
        @RequestParam String end,
        @AuthenticationPrincipal Jwt jwt
) {
    LocalDateTime startTime = LocalDateTime.parse(start);
    LocalDateTime endTime = LocalDateTime.parse(end);
    String username = jwt.getClaimAsString("preferred_username");

    Ticket updated = ticketService.logWorkTime(ticketId, startTime, endTime, username);
    return ResponseEntity.ok(updated);
}

    

    /**
     * 👤 Rôle : ADMIN
     * Valider un ticket terminé (DONE → VALIDATED)
     */
    @PutMapping("/{ticketId}/validate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Ticket> validateTicket(@PathVariable Long ticketId) {
        Ticket validated = ticketService.validateTicket(ticketId);
        return ResponseEntity.ok(validated);
    }
@GetMapping("my-tickets/validated")
@PreAuthorize("hasRole('EMPLOYEE')")
public ResponseEntity<List<Ticket>> getValidatedTicketsForEmployee() {
    List<Ticket> validatedTickets = ticketService.getValidatedTicketsForEmployee();
    return ResponseEntity.ok(validatedTickets);
}


    /**
     * 👤 Rôle : EMPLOYEE
     * Voir tous les tickets assignés à l'utilisateur connecté
     */
    @GetMapping("/my-tickets")
     @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<Ticket>> getMyTickets(
            @RequestParam(required = false) String project,
            @AuthenticationPrincipal Jwt jwt) {

        // On récupère le nom de l’employé connecté depuis le token
        String connectedUsername = jwt.getClaim("preferred_username");

        List<Ticket> tickets = ticketService.getMyTicketsFiltered(connectedUsername, project);

        return ResponseEntity.ok(tickets);
    }
      @GetMapping("/stats/status-count")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<?> getTicketStatsByStatus() {
        var stats = ticketService.countTicketsByStatus();
        return ResponseEntity.ok(stats);
    } 
    @GetMapping("/stats/by-project")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public ResponseEntity<Map<String, Long>> getStats(@RequestParam String projectName) {
    return ResponseEntity.ok(ticketService.countTicketsByStatusForProject(projectName));
}
@GetMapping("/work-time/by-project")
public List<TicketService.WorkTimeEntry> getWorkTimeByProjectAndEmployee() {
    return ticketService.getWorkTimePerProjectAndEmployee();
}


  
}
