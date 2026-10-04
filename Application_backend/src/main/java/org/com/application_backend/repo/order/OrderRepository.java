package org.com.application_backend.repo.order;

import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.order.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findAllBySpareParts(SparePart sparePart);
    List<Order> findAllByCustomer(Customer customer);

    @Modifying(clearAutomatically = true)
    @Query(
            value = "DELETE FROM customer_order_spare_part WHERE part_id = :id",
            nativeQuery = true
    )
    void removeSparePartFromOrders(@Param("id") String id);
}
