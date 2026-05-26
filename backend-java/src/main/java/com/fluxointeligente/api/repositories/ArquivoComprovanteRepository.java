package com.fluxointeligente.api.repositories;

import com.fluxointeligente.api.models.ArquivoComprovante;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ArquivoComprovanteRepository extends JpaRepository<ArquivoComprovante, UUID> {
}