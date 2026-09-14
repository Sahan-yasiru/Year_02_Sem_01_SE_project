package org.com.application_backend.repo.Customer;

import org.com.application_backend.entity.Customer.CustomerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerTransactionRepository extends JpaRepository<CustomerTransaction, Integer> {
}
