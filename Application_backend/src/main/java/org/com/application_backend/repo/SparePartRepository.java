package org.com.application_backend.repo;

import org.com.application_backend.entity.SparePart;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SparePartRepository extends JpaRepository<SparePart, String> {
}
