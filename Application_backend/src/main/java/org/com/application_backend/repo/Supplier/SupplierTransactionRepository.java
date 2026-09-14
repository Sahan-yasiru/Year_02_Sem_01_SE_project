package org.com.application_backend.repo.Supplier;

import org.com.application_backend.entity.Supplier.SupplierTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierTransactionRepository extends JpaRepository<SupplierTransaction, Long> {
}
