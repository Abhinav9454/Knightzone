package com.collegecontest.repository;

import com.collegecontest.model.User;
import com.collegecontest.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByPublicUserId(String publicUserId);

    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsername(String username);
    boolean existsByPublicUserId(String publicUserId);
    long countByRatingGreaterThan(Integer rating);
    Optional<User> findFirstByOrderByIdAsc();

    List<User> findByRoleIn(List<Role> roles);
}
