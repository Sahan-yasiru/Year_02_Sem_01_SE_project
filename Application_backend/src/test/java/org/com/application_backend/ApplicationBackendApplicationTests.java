package org.com.application_backend;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.BrandDTO;
import org.com.application_backend.dto.CategoryDTO;
import org.com.application_backend.dto.Customer.CustomerDTO;
import org.com.application_backend.dto.SparePartDTO;
import org.com.application_backend.entity.order.Order;
import org.com.application_backend.repo.Customer.CustomerRepository;
import org.com.application_backend.repo.order.OrderRepository;
import org.com.application_backend.repo.user.UserRepository;
import org.com.application_backend.service.custom.CategoryService;
import org.com.application_backend.service.custom.SparePartService;
import org.com.application_backend.service.custom.UserService;
import org.com.application_backend.service.custom.customer.CustomerService;
import org.com.application_backend.service.custom.supplier.SupplierService;
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
