package com.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = true)
public class SecurityConfig {

    private final KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter;
    
    // IMPORTANT: Supprimer complètement la référence au WebSocketJwtAuthenticationFilter
    // private final WebSocketJwtAuthenticationFilter webSocketJwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(req ->
                req
                    .requestMatchers(
                        "/auth/**",
                        "/v2/api-docs",
                        "/v3/api-docs",
                        "/v3/api-docs/**",
                        "/swagger-resources",
                        "/swagger-resources/**",
                        "/configuration/ui",
                        "/configuration/security",
                        "/swagger-ui/**",
                        "/webjars/**",
                        "/swagger-ui.html",
                        // CRUCIAL: Permettre le handshake WebSocket sans authentification Spring Security
                        // L'authentification sera gérée par l'interceptor personnalisé
                        "/api/v1/notifications",
                        "/api/v1/notifications/**"
                    ).permitAll()
                    
                    .requestMatchers(HttpMethod.POST, "/api/projects/create").hasRole("MANAGER")
                    .requestMatchers(HttpMethod.GET, "/api/projects").hasAnyRole("MANAGER", "ADMIN","EMPLOYEE")
                    .requestMatchers(HttpMethod.GET, "/api/employees/emails").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET,  "/api/v1/api/comments/**").hasAnyRole("EMPLOYEE", "ADMIN")
                    .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt ->
                    jwt.jwtAuthenticationConverter(keycloakJwtAuthenticationConverter)
                )
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        // SUPPRIMER CETTE LIGNE - c'est elle qui cause le problème
        // http.addFilterBefore(webSocketJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}