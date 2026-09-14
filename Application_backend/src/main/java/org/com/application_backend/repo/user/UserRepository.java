package org.com.application_backend.repo.user;

import org.com.application_backend.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
}
