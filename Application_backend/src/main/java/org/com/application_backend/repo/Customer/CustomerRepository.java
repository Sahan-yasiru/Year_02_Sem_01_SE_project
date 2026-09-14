package org.com.application_backend.repo.Customer;

import org.com.application_backend.entity.Customer.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT c.customerID FROM Customer c ORDER BY  c.customerID DESC")
    List<String> getLastCustomer();
}
