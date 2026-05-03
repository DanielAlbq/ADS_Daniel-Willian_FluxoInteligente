package com.fluxointeligente.api.config;

import com.fluxointeligente.api.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections; // Importação necessária para as authorities

@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String token = recuperarToken(request);

        // Log de debug para o console do IntelliJ
        System.out.println("Token recebido no filtro: " + token);

        if (token != null) {
            String emailLogado = tokenService.validarToken(token);
            System.out.println("Email extraído do token: " + emailLogado);

            // Verificamos se o email não é nulo nem vazio
            if (emailLogado != null && !emailLogado.isEmpty()) {
                // Mudança crucial: passamos Collections.emptyList() para indicar um usuário autenticado sem roles específicas
                var authentication = new UsernamePasswordAuthenticationToken(emailLogado, null, Collections.emptyList());

                // Define a autenticação no contexto do Spring
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        // Segue para o próximo filtro (ou para o Controller)
        filterChain.doFilter(request, response);
    }

    private String recuperarToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        // Validação mais robusta do cabeçalho Bearer
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        // Remove exatamente os 7 caracteres iniciais ("Bearer ")
        return authHeader.substring(7);
    }
}