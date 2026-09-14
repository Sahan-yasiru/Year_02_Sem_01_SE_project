package org.com.application_backend.repo.Customer;

import org.com.application_backend.entity.Customer.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, String> {
}
