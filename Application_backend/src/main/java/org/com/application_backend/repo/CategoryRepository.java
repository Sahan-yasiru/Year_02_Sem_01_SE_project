package org.com.application_backend.repo;

import org.com.application_backend.entity.category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<category, Integer> {
}
