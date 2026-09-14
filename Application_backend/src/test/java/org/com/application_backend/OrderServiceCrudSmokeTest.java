package org.com.application_backend;

import org.com.application_backend.dto.order.OrderDTO;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.order.Order;
import org.com.application_backend.entity.order.OrderStatus;
import org.com.application_backend.repo.Customer.CustomerRepository;
import org.com.application_backend.repo.SparePartRepository;
import org.com.application_backend.repo.order.OrderRepository;
import org.com.application_backend.service.custom.order.OrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class OrderServiceCrudSmokeTest {

    @Autowired private OrderService orderService;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private SparePartRepository sparePartRepository;
    @Autowired private OrderRepository orderRepository;

    @Test
    void createReadUpdateAndDeleteOrder() throws Exception {
        Customer customer = customerRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("A customer is required for this test"));
        SparePart part = sparePartRepository.findAll().stream()
                .filter(candidate -> candidate.getInventory() != null
                        && candidate.getInventory().getQuantity_on_hand() > 0)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("An in-stock spare part is required for this test"));

        String orderId = "TEST-" + UUID.randomUUID();
        OrderDTO input = new OrderDTO(orderId, customer, List.of(part), 0, 0, null,
                OrderStatus.CONFIRMED, "Initial address");

        OrderDTO created = orderService.save(input);
        assertEquals(orderId, created.getOrderId());
        assertEquals(1, created.getQuantity());
        assertEquals(part.getSellPrice(), created.getTotalPrice());

        assertEquals(orderId, orderService.find(orderId).getOrderId());
        assertTrue(orderService.getAll().stream().anyMatch(order -> orderId.equals(order.getOrderId())));

        created.setAddress("Updated address");
        OrderDTO updated = orderService.update(created);
        assertEquals("Updated address", updated.getAddress());
        assertEquals("Updated address", orderService.find(orderId).getAddress());

        Order stored = orderRepository.findById(orderId).orElseThrow();
        stored.setOrderStatus(OrderStatus.CANCELLED);
        orderRepository.saveAndFlush(stored);
        orderService.delete(orderId);
        assertFalse(orderService.ifExit(orderId));
    }
}
