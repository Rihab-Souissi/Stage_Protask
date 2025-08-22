package com.backend.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private String assignedTo;

    @Enumerated(EnumType.STRING)
    private TicketStatus status;

    private String assignedEmployeeUsername;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonBackReference
    private Project project;
    
    private LocalDate createdAt;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private LocalDate updatedAt;

    private boolean validatedByAdmin;

    @Column(name = "estimated_time")  
    private int estimatedTime; 



    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore 
    private List<Comment> comments;
  @Column(name = "worked_time_hours")
private double workedTimeHours;


public double getWorkedTimeHours() {
    return workedTimeHours;
}

public void setWorkedTimeHours(double workedTimeHours) {
    this.workedTimeHours = workedTimeHours;
}
}