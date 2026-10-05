package org.com.application_backend.service.impl.customer;

import lombok.AllArgsConstructor;
import org.com.application_backend.config.PasswordHasher;
import org.com.application_backend.dto.Customer.CustomerDTO;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.order.Order;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.Customer.CustomerRepository;
import org.com.application_backend.repo.order.OrderRepository;
import org.com.application_backend.service.custom.UserService;
import org.com.application_backend.service.custom.customer.CustomerService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@AllArgsConstructor
@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final UserService userService;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public CustomerDTO save(CustomerDTO dto) throws Exception {

        if (ifExit(dto.getCustomerID())) {
            throw new CustomException("Customer ID is already registered");
        }

        if (dto.getUser() != null && dto.getUser().getUsername() != null && userService.ifExit(dto.getUser().getUsername())) {

            throw new CustomException("Customer username is already registered");
        }
        if (dto.getUser() != null) {
            if (dto.getUser().getPassword() == null || dto.getUser().getPassword().isBlank()) {
                throw new CustomException("Password is required");
            }
        }

        if (customerRepository.existsByEmail(dto.getEmail())) {
            throw new CustomException("Customer email is already registered");
        }

        if (customerRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new CustomException("Customer phone is already registered");
        }

        Customer customer = modelMapper.map(dto, Customer.class);
        if (customer.getUser() != null) {
            customer.getUser().setPassword(PasswordHasher.getHashPassword(dto.getUser().getPassword()));
        }

        Customer savedCustomer = customerRepository.save(customer);

        return modelMapper.map(savedCustomer, CustomerDTO.class);
    }

    @Override
    @Transactional
    public CustomerDTO update(CustomerDTO dto) throws Exception {

        Customer existingCustomer = customerRepository.findById(dto.getCustomerID()).orElseThrow(() -> new CustomException("Customer not found"));

        // Check email only if it was changed
        if (!Objects.equals(existingCustomer.getEmail(), dto.getEmail())) {

            if (customerRepository.existsByEmail(dto.getEmail())) {
                throw new CustomException("Customer email is already registered to another customer");
            }

            existingCustomer.setEmail(dto.getEmail());
        }

        // Check phone only if it was changed
        if (!Objects.equals(existingCustomer.getPhoneNumber(), dto.getPhoneNumber())) {

            if (customerRepository.existsByPhoneNumber(dto.getPhoneNumber())) {

                throw new CustomException("Customer phone is already registered to another customer");
            }

            existingCustomer.setPhoneNumber(dto.getPhoneNumber());
        }

        // Update other customer fields
        existingCustomer.setAddress(dto.getAddress());
        existingCustomer.setName(dto.getName());

        Customer updatedCustomer = customerRepository.save(existingCustomer);

        return modelMapper.map(updatedCustomer, CustomerDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerDTO> getAll() throws Exception {

        return customerRepository.findAll().stream().map(customer -> modelMapper.map(customer, CustomerDTO.class)).toList();
    }

    @Override
    @Transactional
    public void delete(String id) throws Exception {

        // Find customer
        Customer customer = customerRepository.findById(id).orElseThrow(() -> new CustomException("Customer not found"));

        // Find all orders belonging to customer
        List<Order> orders = orderRepository.findAllByCustomer(customer);

        // Customer cannot be deleted while orders exist
        if (!orders.isEmpty()) {

            throw new CustomException("Cannot delete customer because they have " + orders.size() + " order(s). Delete the orders first.");
        }

        // Safe to delete
        customerRepository.delete(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDTO find(String id) throws Exception {

        Customer customer = customerRepository.findById(id).orElseThrow(() -> new CustomException("Customer not found"));

        return modelMapper.map(customer, CustomerDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean ifExit(String id) throws Exception {
        return customerRepository.existsById(id);
    }

    @Transactional(readOnly = true)
    public String getLastID() {

        List<String> ids = customerRepository.getLastCustomer();

        if (ids == null || ids.isEmpty()) {
            return "C001";
        }

        int num = Integer.parseInt(ids.getFirst().substring(1));

        num++;

        return String.format("C%03d", num);
    }
}