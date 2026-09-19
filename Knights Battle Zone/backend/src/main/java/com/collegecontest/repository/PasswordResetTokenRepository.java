package com.collegecontest.repository;

import com.collegecontest.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findFirstByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
            String tokenHash,
            LocalDateTime now
    );

    void deleteByUserId(Long userId);
}
