package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.backend.entities.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // Récupérer un projet avec ses tickets (fetch join)
    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.tickets WHERE p.id = :id")
    Optional<Project> findByIdWithTickets(@Param("id") Long id);

    // Récupérer tous les projets avec leurs tickets
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.tickets")
    List<Project> findAllWithTickets();
}
