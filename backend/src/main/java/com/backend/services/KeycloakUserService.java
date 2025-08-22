package com.backend.services;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;

import jakarta.ws.rs.core.Response;

import java.util.Collections;
import java.util.List;

@Service
public class KeycloakUserService {

    private final Keycloak keycloak;
    private final String realm = "ProTask"; // Ton realm

    public KeycloakUserService() {
        this.keycloak = KeycloakBuilder.builder()
            .serverUrl("http://localhost:9090") // Port Keycloak
            .realm("ProTask")
            .clientId("Retours_client_front")
            .username("maha@gmail.com")
            .password("maha")
            .build();
    }

    public List<UserRepresentation> getEmployees() {
        return keycloak.realm(realm)
                .roles()
                .get("Employee")
                .getUserMembers();
    }
public String getUserFullNameById(String userId) {
    try {
        UserRepresentation user = keycloak.realm(realm)
                .users()
                .get(userId)
                .toRepresentation();

        return user.getFirstName() + " " + user.getLastName();
    } catch (Exception e) {
        throw new RuntimeException("Utilisateur non trouvé (par ID) : " + userId, e);
    }
}


public String getUserFullNameByUsername(String username) {
    List<UserRepresentation> users = keycloak.realm(realm).users().search(username);
    if (users.isEmpty()) {
        throw new RuntimeException("Utilisateur non trouvé (par username) : " + username);
    }
    UserRepresentation user = users.get(0);
    return user.getFirstName() + " " + user.getLastName();
}

    
     public void createEmployee( String email, String password) {
        UserRepresentation user = new UserRepresentation();
     
        user.setEmail(email);
        user.setEnabled(true);

        Response response = keycloak.realm(realm).users().create(user);
        if (response.getStatus() != 201) {
            throw new RuntimeException("Erreur lors de la création utilisateur dans Keycloak: " + response.getStatus());
        }

        String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");

       
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setTemporary(false);
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);

        keycloak.realm(realm).users().get(userId).resetPassword(credential);

      RoleRepresentation employeeRole = keycloak.realm(realm).roles().get("Employee").toRepresentation();

        keycloak.realm(realm).users().get(userId).roles().realmLevel().add(Collections.singletonList(employeeRole));
    }
}
