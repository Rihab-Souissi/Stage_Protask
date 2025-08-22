package com.backend.repository;

import com.backend.entities.Comment;
import com.backend.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTicket(Ticket ticket);
    boolean existsByTicketIdAndSenderUsername(Long ticketId, String senderUsername);
boolean existsByTicketIdAndSenderId(Long ticketId, String senderId);

}
