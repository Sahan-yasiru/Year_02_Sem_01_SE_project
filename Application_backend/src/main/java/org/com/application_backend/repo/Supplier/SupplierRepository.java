package org.com.application_backend.repo.Supplier;

import org.com.application_backend.entity.Supplier.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, String> {
}
