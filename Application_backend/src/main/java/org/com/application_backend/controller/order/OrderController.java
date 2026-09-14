package org.com.application_backend.controller.order;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.order.OrderDTO;
import org.com.application_backend.entity.order.Order;
import org.com.application_backend.service.custom.order.OrderService;
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
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<APIResponse<List<OrderDTO>>> getAll() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Orders retrieved successfully", orderService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<OrderDTO>> find(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Order retrieved successfully", orderService.find(id)));
    }

    @PostMapping
    public ResponseEntity<APIResponse<OrderDTO>> create(@RequestBody OrderDTO order) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Order created successfully", orderService.save(order)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<OrderDTO>> update(@RequestBody OrderDTO order) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Order updated successfully", orderService.update(order)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> delete(@PathVariable String id) throws Exception {
        orderService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Order deleted successfully", null));
    }
}
