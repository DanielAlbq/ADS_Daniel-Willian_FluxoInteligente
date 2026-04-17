package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.repositories.UsuarioRepository;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    public ResponseEntity<Usuario> criarUsuario(@RequestBody Usuario usuario) {
        String senhaCriptografada = passwordEncoder.encode(usuario.getSenhaHash());
        usuario.setSenhaHash(senhaCriptografada);
        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioSalvo);
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> ListarUsuarios() {
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<String> esqueciSenha(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");

        java.util.Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado.");
        }

        Usuario usuario = usuarioOpt.get();

        // Gerar o código de 6 digitos com validade de 15 minutos
        String codigo = String.format("%06d", new java.util.Random().nextInt(999999));
        usuario.setCodigoRecuperacao(codigo);
        usuario.setValidadeCodigo(java.time.LocalDateTime.now().plusMinutes(15));
        usuarioRepository.save(usuario);

        // Chama o n8n
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        String n8nWebhookUrl = "http://localhost:5678/webhook/recuperar-senha";

        java.util.Map<String, String> n8nPayload = new java.util.HashMap<>();
        n8nPayload.put("email", email);
        n8nPayload.put("codigo", codigo);

        try {
            restTemplate.postForEntity(n8nWebhookUrl, n8nPayload, String.class);
        } catch (Exception e) {
            System.out.println("Erro ao chamar o n8n: " + e.getMessage());
        }

        return ResponseEntity.ok("Código enviado com sucesso.");
    }

    // rota para redefinir a senha
    @PostMapping("/redefinir-senha")
    public ResponseEntity<String> redefinirSenha(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String codigo = payload.get("codigo");
        String novaSenha = payload.get("novaSenha");

        java.util.Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado.");
        }

        Usuario usuario = usuarioOpt.get();

        // verificar se o código é valido
        if (usuario.getCodigoRecuperacao() == null || !usuario.getCodigoRecuperacao().equals(codigo)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Código inválido.");
        }

        // verificar se o codigo nao expirou
        if (usuario.getValidadeCodigo().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Código expirado. Solicite outro.");
        }

        // atualiza para a senha nova
        usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
        usuario.setCodigoRecuperacao(null);
        usuario.setValidadeCodigo(null);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok("Senha atualizada com sucesso!");
    }

    // rota para login
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String senha = payload.get("senha"); // A senha pura que o usuário digitou

        java.util.Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        // acesso negado se o email ou a senha estiverem errados
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha incorretos.");
        }

        Usuario usuario = usuarioOpt.get();

        // verifica se a senha confere
        if (passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            return ResponseEntity.ok("Login realizado com sucesso!");
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha incorretos.");
        }
    }
}
