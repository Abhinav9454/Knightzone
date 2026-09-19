package com.collegecontest.intercollege;

import com.collegecontest.model.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserCollegeRepository extends CrudRepository<User, Long> {
    @Query(value = "SELECT college_id FROM users WHERE id = :userId", nativeQuery = true)
    Long findCollegeIdByUserId(@Param("userId") Long userId);
}
