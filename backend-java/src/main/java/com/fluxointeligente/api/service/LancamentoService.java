package com.fluxointeligente.api.service;

import com.fluxointeligente.api.models.Lancamento;
import com.fluxointeligente.api.models.TipoLancamento;
import com.fluxointeligente.api.models.Usuario;
import com.fluxointeligente.api.repositories.LancamentoRepository;
import com.fluxointeligente.api.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LancamentoService {

    @Autowired
    private LancamentoRepository repository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // --- MÉTODOS DE SEGURANÇA ---

    /**
     * Recupera o usuário logado com base no Token JWT processado pelo
     * SecurityFilter.
     */
    private Usuario getUsuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String emailLogado = (String) auth.getPrincipal();

        return usuarioRepository.findByEmail(emailLogado)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado ou token inválido"));
    }

    // --- REGRAS DE NEGÓCIO ---

    /**
     * Salva um lançamento vinculando-o automaticamente ao dono do token.
     */
    public Lancamento salvar(Lancamento lancamento) {
        Usuario usuario = getUsuarioLogado();
        lancamento.setUsuario(usuario);
        return repository.save(lancamento);
    }

    /**
     * NOVO MÉTODO: Consolida saldo, receitas e despesas direto pelo Banco de Dados.
     * Utiliza o padrão DTO (Data Transfer Object) em formato de Map para a
     * HomeScreen.
     */
    public Map<String, BigDecimal> obterResumoDashboard() {
        Usuario usuario = getUsuarioLogado();
        UUID idUsuario = usuario.getIdUsuario();

        Map<String, BigDecimal> dashboard = new HashMap<>();

        // Usando o banco de dados (Queries) para fazer a soma pesada (muito mais
        // rápido)
        BigDecimal saldo = repository.calcularSaldoAtual(idUsuario);
        BigDecimal receitas = repository.somarPorUsuarioETipo(idUsuario, TipoLancamento.RECEITA);
        BigDecimal despesas = repository.somarPorUsuarioETipo(idUsuario, TipoLancamento.DESPESA);

        // Previne valores nulos caso o usuário seja novo e ainda não tenha lançamentos
        dashboard.put("saldo", saldo != null ? saldo : BigDecimal.ZERO);
        dashboard.put("receitas", receitas != null ? receitas : BigDecimal.ZERO);
        dashboard.put("despesas", despesas != null ? despesas : BigDecimal.ZERO);

        return dashboard;
    }

    /**
     * Lista lançamentos garantindo privacidade (apenas os do usuário logado).
     */
    public List<Lancamento> listarPorUsuarioLogado() {
        Usuario usuario = getUsuarioLogado();
        return repository.findByUsuarioIdUsuario(usuario.getIdUsuario());
    }

    /**
     * Deleta um registro com verificação de propriedade (Trava de Segurança).
     */
    public void deletar(UUID idLancamento) {
        Lancamento lancamento = repository.findById(idLancamento)
                .orElseThrow(() -> new RuntimeException("Lançamento não encontrado."));

        Usuario usuarioLogado = getUsuarioLogado();

        // Impede que um usuário delete o lançamento de outro via URL/Postman
        if (!lancamento.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new RuntimeException("Acesso negado: Você não tem permissão para deletar este registro.");
        }

        repository.delete(lancamento);
    }
}