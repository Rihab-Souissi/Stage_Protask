package com.backend.Controllers;

import com.backend.entities.Ticket;
import com.backend.entities.TimeLog;
import com.backend.services.TicketService;
import com.backend.repository.TimeLogRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;


import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
@RestController
@RequestMapping("/api/timelogs")
@RequiredArgsConstructor
public class TimeLogController {

    private final TicketService ticketService;
    private final TimeLogRepository timeLogRepository;


@PostMapping
public TimeLog logTime(@RequestBody Map<String, String> payload, @AuthenticationPrincipal Jwt jwt) {
    Long ticketId = Long.parseLong(payload.get("ticketId"));
    LocalDate date = LocalDate.parse(payload.get("date"));
     double duration = Double.parseDouble(payload.get("duration"));
    String username = jwt.getClaimAsString("preferred_username");

    return ticketService.saveTimeLog(ticketId, date, duration, username);
}
    @GetMapping("/ticket/{ticketId}")
public ResponseEntity<Ticket> getTicketById(@PathVariable Long ticketId) {
    Ticket ticket = ticketService.findById(ticketId);
    return ResponseEntity.ok(ticket);
}
}
