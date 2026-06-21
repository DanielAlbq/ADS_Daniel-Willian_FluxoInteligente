package com.fluxointeligente.api.controllers;

import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.repositories.UsuarioRepository;
import com.fluxointeligente.api.repositories.LancamentoRepository; // Adicionado import
import com.fluxointeligente.api.service.TokenService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional; // Adicionado import

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private LancamentoRepository lancamentoRepository; // Injetado para limpar os dados na exclusão

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    public ResponseEntity<Usuario> criarUsuario(@RequestBody Usuario usuario) {
        String senhaCriptografada = passwordEncoder.encode(usuario.getSenhaHash());
        usuario.setSenhaHash(senhaCriptografada);
        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioSalvo);
    }

    @GetMapping("/me")
    public ResponseEntity<Usuario> obterMeuPerfil() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = (String) auth.getPrincipal();

        java.util.Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(emailLogado);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok(usuarioOpt.get());
    }

    // --- NOVA ROTA: EDITAR PERFIL ---
    @PutMapping("/me")
    public ResponseEntity<Usuario> atualizarPerfil(@RequestBody Usuario dadosAtualizados) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = (String) auth.getPrincipal();

        Usuario usuario = usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        // Atualiza apenas os campos cadastrais permitidos
        usuario.setNome(dadosAtualizados.getNome());
        usuario.setCnpj(dadosAtualizados.getCnpj());
        usuario.setTelefone(dadosAtualizados.getTelefone());

        // Se o usuário digitou uma nova senha, criptografa e atualiza
        if (dadosAtualizados.getSenhaHash() != null && !dadosAtualizados.getSenhaHash().isEmpty()) {
            usuario.setSenhaHash(passwordEncoder.encode(dadosAtualizados.getSenhaHash()));
        }

        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        return ResponseEntity.ok(usuarioSalvo);
    }

    // --- NOVA ROTA: EXCLUIR CONTA ---
    @DeleteMapping("/me")
    @Transactional // Garante que se der erro ao apagar algo, ele faz o rollback no banco
    public ResponseEntity<Void> excluirConta() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = (String) auth.getPrincipal();

        Usuario usuario = usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        // 1. Busca e apaga todos os lançamentos vinculados a este usuário primeiro
        var lancamentosDoUsuario = lancamentoRepository.findByUsuarioIdUsuario(usuario.getIdUsuario());
        lancamentoRepository.deleteAll(lancamentosDoUsuario);

        // 2. Apaga o registro do usuário definitivamente
        usuarioRepository.delete(usuario);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<String> esqueciSenha(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");

        java.util.Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado.");
        }

        Usuario usuario = usuarioOpt.get();

        String codigo = String.format("%06d", new java.util.Random().nextInt(999999));
        usuario.setCodigoRecuperacao(codigo);
        usuario.setValidadeCodigo(java.time.LocalDateTime.now().plusMinutes(15));
        usuarioRepository.save(usuario);

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

        if (usuario.getCodigoRecuperacao() == null || !usuario.getCodigoRecuperacao().equals(codigo)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Código inválido.");
        }

        if (usuario.getValidadeCodigo().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Código expirado. Solicite outro.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
        usuario.setCodigoRecuperacao(null);
        usuario.setValidadeCodigo(null);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok("Senha updated com sucesso!");
    }

    @PostMapping("/login")
    public ResponseEntity<java.util.Map<String, String>> login(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String senha = payload.get("senha");

        java.util.Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Usuario usuario = usuarioOpt.get();

        if (passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            String token = tokenService.gerarToken(usuario);

            java.util.Map<String, String> resposta = new java.util.HashMap<>();
            resposta.put("token", token);
            resposta.put("mensagem", "Login realizado com sucesso!");
            resposta.put("nome", usuario.getNome());

            return ResponseEntity.ok(resposta);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}