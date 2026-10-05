package org.com.application_backend;

import org.com.application_backend.entity.order.Order;
import org.com.application_backend.repo.order.OrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
class ApplicationBackendApplicationTests {
    @Autowired
    OrderRepository orderRepository;
    @Test
    void contextLoads() throws Exception {
        Order order = orderRepository.findById("ORD-20261003-4987").get();
        System.out.println("order");

    }

}
