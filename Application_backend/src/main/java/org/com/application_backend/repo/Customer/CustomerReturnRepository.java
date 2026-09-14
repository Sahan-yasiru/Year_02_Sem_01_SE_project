package org.com.application_backend.repo.Customer;

import org.com.application_backend.entity.Customer.CustomerReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerReturnRepository extends JpaRepository<CustomerReturn, String> {
}
