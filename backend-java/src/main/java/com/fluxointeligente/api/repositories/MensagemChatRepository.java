package com.fluxointeligente.api.repositories;

import com.fluxointeligente.api.models.MensagemChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MensagemChatRepository extends JpaRepository<MensagemChat, UUID> {

    List<MensagemChat> findTop4ByUsuarioIdUsuarioOrderByDataHoraDesc(UUID usuarioId);
}