package com.collegecontest.repository;

import com.collegecontest.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findFirstByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(
            String tokenHash,
            LocalDateTime now
    );

    Optional<RefreshToken> findFirstByTokenHashAndRevokedAtIsNull(String tokenHash);

    void deleteByUserId(Long userId);

    long deleteByExpiresAtBefore(LocalDateTime now);
}
