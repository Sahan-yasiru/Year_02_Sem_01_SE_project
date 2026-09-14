package org.com.application_backend.repo.Supplier;

import org.com.application_backend.entity.Supplier.SupplierTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierTransactionRepository extends JpaRepository<SupplierTransaction, Long> {
}
