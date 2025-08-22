package com.backend.entities;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;
@Column(name = "sender_id")
private String senderId; 

@Column(name = "sender_username")
private String senderUsername; 


    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "ticket_id")
     @JsonIgnore
    private Ticket ticket;
}
