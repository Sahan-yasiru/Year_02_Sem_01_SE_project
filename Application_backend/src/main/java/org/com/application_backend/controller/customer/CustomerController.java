package org.com.application_backend.controller.customer;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.Customer.CustomerDTO;
import org.com.application_backend.service.custom.customer.CustomerService;
import org.com.application_backend.util.APIResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<APIResponse<List<CustomerDTO>>> getAllCustomers() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Customers retrieved successfully", customerService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<CustomerDTO>> getCustomer(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Customer retrieved successfully", customerService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<CustomerDTO>> saveCustomer(@RequestBody CustomerDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Customer created successfully", customerService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<CustomerDTO>> updateCustomer(@RequestBody CustomerDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Customer updated successfully", customerService.update(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteCustomer(@PathVariable String id) throws Exception {
        customerService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Customer deleted successfully", null));
    }
}
