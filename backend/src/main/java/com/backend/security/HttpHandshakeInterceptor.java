package com.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Collections;
import java.util.Map;

@Component
public class HttpHandshakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private JwtDecoder jwtDecoder;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, 
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        
        System.out.println("\n=== HANDSHAKE INTERCEPTOR DEBUT ===");
        System.out.println("🔗 URI: " + request.getURI());
        System.out.println("🔗 Method: " + request.getMethod());
        System.out.println("🔗 Headers: " + request.getHeaders());
        System.out.println("🔗 Remote Address: " + request.getRemoteAddress());
        
        try {
            // Extraire le token depuis l'URL
            String token = extractTokenFromUri(request.getURI());
            System.out.println("🎫 Token extrait: " + (token != null ? "✓ Présent (" + token.length() + " chars)" : "✗ ABSENT"));
            
            if (token == null || token.trim().isEmpty()) {
                System.err.println("❌ ECHEC: Token manquant dans l'URL");
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                System.out.println("=== HANDSHAKE INTERCEPTOR FIN (ECHEC) ===\n");
                return false;
            }

            // Log du début du token pour vérification
            if (token.length() > 50) {
                System.out.println("🎫 Début token: " + token.substring(0, 50) + "...");
            }

            // Décoder et valider le JWT
            System.out.println("🔓 Tentative de décodage JWT...");
            Jwt jwt = jwtDecoder.decode(token.trim());
            System.out.println("✅ JWT décodé avec succès!");
            
            // Log des claims principaux
            System.out.println("📋 Claims disponibles: " + jwt.getClaims().keySet());
            System.out.println("📋 Issuer: " + jwt.getIssuer());
            System.out.println("📋 Subject: " + jwt.getSubject());
            System.out.println("📋 Expiration: " + jwt.getExpiresAt());
            
            String username = jwt.getClaimAsString("preferred_username");
            System.out.println("👤 Username extrait: '" + username + "'");
            
            if (username == null || username.trim().isEmpty()) {
                System.err.println("❌ ECHEC: Username non trouvé dans le JWT");
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                System.out.println("=== HANDSHAKE INTERCEPTOR FIN (ECHEC) ===\n");
                return false;
            }

            // Créer un principal d'authentification
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    username.trim(), null, Collections.emptyList());
            
            // Stocker les informations dans les attributs de session WebSocket
            attributes.put("principal", auth);
            attributes.put("username", username.trim());
            attributes.put("jwt", jwt);
            
            System.out.println("✅ SUCCES: Handshake autorisé pour l'utilisateur: '" + username + "'");
            System.out.println("📦 Attributs stockés dans la session WebSocket");
            System.out.println("=== HANDSHAKE INTERCEPTOR FIN (SUCCES) ===\n");
            return true;

        } catch (JwtException e) {
            System.err.println("❌ ECHEC: Erreur JWT - " + e.getClass().getSimpleName() + ": " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("❌ Cause: " + e.getCause().getMessage());
            }
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            System.out.println("=== HANDSHAKE INTERCEPTOR FIN (ECHEC JWT) ===\n");
            return false;
        } catch (Exception e) {
            System.err.println("❌ ECHEC: Erreur inattendue - " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            response.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            System.out.println("=== HANDSHAKE INTERCEPTOR FIN (ECHEC INATTENDU) ===\n");
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, 
                               WebSocketHandler wsHandler, Exception exception) {
        System.out.println("\n=== AFTER HANDSHAKE ===");
        if (exception != null) {
            System.err.println("❌ Erreur après handshake: " + exception.getClass().getSimpleName() + ": " + exception.getMessage());
            exception.printStackTrace();
        } else {
            System.out.println("✅ Handshake terminé avec succès - WebSocket établi");
        }
        System.out.println("=== AFTER HANDSHAKE FIN ===\n");
    }

    private String extractTokenFromUri(URI uri) {
        String query = uri.getQuery();
        System.out.println("🔍 Query string: '" + query + "'");
        
        if (query != null && !query.trim().isEmpty()) {
            String[] params = query.split("&");
            System.out.println("🔍 Nombre de paramètres: " + params.length);
            
            for (String param : params) {
                System.out.println("🔍 Paramètre: '" + param + "'");
                if (param.startsWith("token=")) {
                    String token = param.substring(6); // Enlever "token="
                    System.out.println("🎯 Token trouvé, longueur brute: " + token.length());
                    
                    // Décoder l'URL si nécessaire
                    try {
                        String decodedToken = java.net.URLDecoder.decode(token, "UTF-8");
                        System.out.println("🎯 Token décodé, longueur finale: " + decodedToken.length());
                        return decodedToken;
                    } catch (Exception e) {
                        System.err.println("⚠️ Erreur décodage URL, utilisation token brut: " + e.getMessage());
                        return token;
                    }
                }
            }
        }
        System.err.println("❌ Token non trouvé dans les paramètres");
        return null;
    }
}