package org.com.application_backend;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.CategoryDTO;
import org.com.application_backend.repo.Customer.CustomerRepository;
import org.com.application_backend.repo.user.UserRepository;
import org.com.application_backend.service.custom.CategoryService;
import org.com.application_backend.service.custom.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
class ApplicationBackendApplicationTests {
    @Autowired
    CustomerRepository customerRepository;
    @Test
    void contextLoads() throws Exception {

        System.out.println(customerRepository.getLastCustomer());
    }

}
