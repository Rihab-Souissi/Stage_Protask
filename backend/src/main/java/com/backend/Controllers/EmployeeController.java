package com.backend.Controllers;

import com.backend.entities.CreateEmployeeRequest;
import com.backend.services.KeycloakUserService;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employees")

public class EmployeeController {

    private final KeycloakUserService keycloakUserService;

    public EmployeeController(KeycloakUserService keycloakUserService) {
        this.keycloakUserService = keycloakUserService;
    }
    

    @GetMapping
    public List<String> getEmployeeUsernames() {
        return keycloakUserService.getEmployees().stream()
                .map(UserRepresentation::getUsername)
                .collect(Collectors.toList());
    }
    @PostMapping("/create")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<String> addEmployee(@RequestBody CreateEmployeeRequest request) {
        keycloakUserService.createEmployee( request.getEmail(), request.getPassword());
        return ResponseEntity.ok("Employé créé avec succès");
    }
    @GetMapping("/me")
public ResponseEntity<?> getCurrentUserInfo(@AuthenticationPrincipal Jwt jwt) {
    String username = jwt.getClaimAsString("preferred_username");
    List<String> roles = jwt.getClaimAsMap("realm_access") != null
            ? (List<String>) ((Map<?, ?>) jwt.getClaim("realm_access")).get("roles")
            : List.of();

    Map<String, Object> response = new HashMap<>();
    response.put("username", username);
    response.put("roles", roles);

    return ResponseEntity.ok(response);
}


}
