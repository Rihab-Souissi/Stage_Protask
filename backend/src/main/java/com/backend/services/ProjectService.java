package com.backend.services;
import com.backend.entities.Project;
import com.backend.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    public Project createProject(Project project, String managerUsername) {
        project.setManagerUsername(managerUsername);
        project.setStartDate(LocalDate.now());
        return projectRepository.save(project);
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
    public Project getProjectById(Long id) {
    return projectRepository.findByIdWithTickets(id).orElse(null);
}
}
