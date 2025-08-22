package com.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class WebSocketJwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtDecoder jwtDecoder;

    public WebSocketJwtAuthenticationFilter(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        System.out.println("[WebSocketJwtAuthenticationFilter] URI: " + request.getRequestURI());
        System.out.println("[WebSocketJwtAuthenticationFilter] Query string: " + request.getQueryString());
        
        // On cible uniquement le point de connexion WebSocket (handshake)
        if (request.getRequestURI().startsWith("/api/v1/notifications")) {
            String token = request.getParameter("token");
            System.out.println("[WebSocketJwtAuthenticationFilter] Token param: " + (token != null ? "Présent" : "Absent"));
            
            if (token != null) {
                try {
                    Jwt jwt = jwtDecoder.decode(token);
                    String username = jwt.getClaimAsString("preferred_username");
                    System.out.println("[WebSocketJwtAuthenticationFilter] Username extrait: " + username);
                    
                    if (username != null) {
                        // Crée une Authentication simple avec username
                        Authentication auth = new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                Collections.emptyList() // ici vous pouvez ajouter les rôles si besoin
                        );
                        // Place l'authentification dans le contexte de sécurité
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        System.out.println("[WebSocketJwtAuthenticationFilter] Authentification réussie pour: " + username);
                    } else {
                        System.err.println("[WebSocketJwtAuthenticationFilter] Username non trouvé dans le JWT");
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        return;
                    }
                } catch (JwtException e) {
                    System.err.println("[WebSocketJwtAuthenticationFilter] Erreur JWT: " + e.getMessage());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            } else {
                System.err.println("[WebSocketJwtAuthenticationFilter] Token manquant");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}