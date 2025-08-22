package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.backend.entities.TimeLog;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {
    List<TimeLog> findByTicketId(Long ticketId);

    @Query("SELECT SUM(t.duration) FROM TimeLog t WHERE t.ticket.id = :ticketId")
    Integer getTotalDurationByTicketId(@Param("ticketId") Long ticketId);
}

