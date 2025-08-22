package com.backend.Controllers;

import java.time.LocalDateTime;
import java.util.List;

import com.backend.entities.Comment;
import com.backend.entities.Ticket;
import com.backend.repository.CommentRepository;
import com.backend.repository.TicketRepository;
import com.backend.services.KeycloakUserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private KeycloakUserService keycloakUserService; 

    @GetMapping("/ticket/{ticketId}")
     @PreAuthorize("hasAnyRole( 'ADMIN','EMPLOYEE')")
    public List<Comment> getCommentsByTicket(@PathVariable Long ticketId, Authentication authentication) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket non trouvé"));


        return commentRepository.findByTicket(ticket);
    }

    
    @PostMapping("/ticket/{ticketId}")
@PreAuthorize("hasAnyRole( 'ADMIN','EMPLOYEE')")
    public Comment addComment(@PathVariable Long ticketId,
                              @RequestBody Comment comment,
                              Authentication authentication) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket non trouvé"));

        String userId = authentication.getName(); // UUID Keycloak
       


 
String fullName = keycloakUserService.getUserFullNameById(userId);

comment.setSenderId(userId);
comment.setSenderUsername(fullName);
comment.setCreatedAt(LocalDateTime.now());
comment.setTicket(ticket);


        return commentRepository.save(comment);
    }
}
