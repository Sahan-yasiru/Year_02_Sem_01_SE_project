package org.com.application_backend.controller.customer;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.Customer.CustomerReturnDTO;
import org.com.application_backend.service.custom.customer.CustomerReturnService;
import org.com.application_backend.util.APIResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/customerReturn")
public class CustomerReturnController {

    private final CustomerReturnService customerReturnService;

    @GetMapping
    public ResponseEntity<APIResponse<List<CustomerReturnDTO>>> getAllReturns() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Customer returns retrieved successfully", customerReturnService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<CustomerReturnDTO>> getReturn(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Customer return retrieved successfully", customerReturnService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<CustomerReturnDTO>> saveReturn(@Valid @RequestBody CustomerReturnDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Customer return created successfully", customerReturnService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<CustomerReturnDTO>> updateReturn(@Valid @RequestBody CustomerReturnDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Customer return updated successfully", customerReturnService.update(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteReturn(@PathVariable String id) throws Exception {
        customerReturnService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Customer return deleted successfully", null));
    }
}

