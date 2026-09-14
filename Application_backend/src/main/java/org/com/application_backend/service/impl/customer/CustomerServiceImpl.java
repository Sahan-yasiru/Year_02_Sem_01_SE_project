package org.com.application_backend.service.impl.customer;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.Customer.CustomerDTO;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.Customer.CustomerRepository;
import org.com.application_backend.service.custom.customer.CustomerService;
import org.com.application_backend.service.custom.UserService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final UserService userService;

    @Override
    public CustomerDTO save(CustomerDTO dto) throws Exception {
        if (ifExit(dto.getCustomerID())) {
            throw new CustomException("customer already registered");
        }
        customerVerification(dto);
        return modelMapper.map(customerRepository.save(modelMapper.map(dto, Customer.class)), CustomerDTO.class);
    }

    public void customerVerification(CustomerDTO dto) throws Exception {
        if (userService.ifExit(dto.getUser().getUsername())) {
            throw new CustomException("customer user name is already registered");
        }
        if (customerRepository.existsByEmail(dto.getEmail())) {
            throw new CustomException("customer email is already registered");
        }
        if (customerRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new CustomException("customer email is already registered");
        }
    }


    @Override
    public CustomerDTO update(CustomerDTO dto) throws Exception {
        customerVerification(dto);
        return modelMapper.map(customerRepository.save(modelMapper.map(dto, Customer.class)), CustomerDTO.class);
    }

    @Override
    public List<CustomerDTO> getAll() throws Exception {
        List<CustomerDTO> dtos = new ArrayList<>();
        customerRepository.findAll().forEach(customer -> {
            dtos.add(modelMapper.map(customer, CustomerDTO.class));
        });
        return dtos;
    }

    @Override
    public void delete(String id) throws Exception {
        customerRepository.deleteById(id);
    }

    @Override
    public CustomerDTO find(String id) throws Exception {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomException("customer not found"));
        return modelMapper.map(customer, CustomerDTO.class);
    }

    @Override
    public boolean ifExit(String id) throws Exception {
        return customerRepository.existsById(id);
    }

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

