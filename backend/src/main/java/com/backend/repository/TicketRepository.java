package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.backend.entities.Project;
import com.backend.entities.Ticket;
import com.backend.entities.TicketStatus;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
  
    List<Ticket> findByProject(Project project);
    List<Ticket> findByStatus(TicketStatus status);
    List<Ticket> findByAssignedEmployeeUsername(String employeeUsername);
    List<Ticket> findByStatusAndValidatedByAdminTrue(TicketStatus status);
    List<Ticket> findByAssignedEmployeeUsernameAndProjectName(String username, String projectName);
        // Compter les tickets par status
    @Query("SELECT t.status AS status, COUNT(t) AS count FROM Ticket t GROUP BY t.status")
    List<Object[]> countTicketsGroupByStatus();


@Query("SELECT t.status, COUNT(t) FROM Ticket t WHERE t.project.name = :projectName GROUP BY t.status")
List<Object[]> countTicketsByStatusAndProjectName(@Param("projectName") String projectName);
@Query("""
    SELECT t.project.name, t.assignedEmployeeUsername, 
           SUM(FUNCTION('TIMESTAMPDIFF', MINUTE, t.startTime, t.endTime)) 
    FROM Ticket t
    WHERE t.startTime IS NOT NULL AND t.endTime IS NOT NULL
    GROUP BY t.project.name, t.assignedEmployeeUsername
""")
List<Object[]> findTotalWorkTimePerProjectAndEmployee();


}

