package org.com.application_backend.controller.purchase;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.purchase.PurchaseOrderDTO;
import org.com.application_backend.dto.purchase.ReceiveItemDTO;
import org.com.application_backend.entity.purchase.PurchaseOrderPaymentStatus;
import org.com.application_backend.service.custom.purchase.PurchaseOrderService;
import org.com.application_backend.util.APIResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public ResponseEntity<APIResponse<List<PurchaseOrderDTO>>> getAll() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Purchase orders retrieved successfully", purchaseOrderService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<PurchaseOrderDTO>> find(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Purchase order retrieved successfully", purchaseOrderService.find(id)));
    }

    @GetMapping("/last-id")
    public ResponseEntity<APIResponse<String>> getLastId() throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Last PO ID retrieved successfully", purchaseOrderService.getLastId()));
    }

    @PostMapping
    public ResponseEntity<APIResponse<PurchaseOrderDTO>> create(@RequestBody PurchaseOrderDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Purchase order created successfully", purchaseOrderService.save(dto)));
    }

    @PutMapping
    public ResponseEntity<APIResponse<PurchaseOrderDTO>> update(@RequestBody PurchaseOrderDTO dto) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Purchase order updated successfully", purchaseOrderService.update(dto)));
    }

    @PutMapping("/{id}/receive")
    public ResponseEntity<APIResponse<PurchaseOrderDTO>> receiveGoods(
            @PathVariable String id,
            @RequestBody List<ReceiveItemDTO> receiveItems) throws Exception {
        return ResponseEntity.ok(new APIResponse<>(200, "Goods received successfully",
                purchaseOrderService.receiveGoods(id, receiveItems)));
    }

    @PutMapping("/{id}/payment-status")
    public ResponseEntity<APIResponse<PurchaseOrderDTO>> updatePaymentStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) throws Exception {
        String statusStr = body.get("paymentStatus");
        if (statusStr == null && body.containsKey("status")) {
            statusStr = body.get("status");
        }
        if (statusStr == null) {
            throw new IllegalArgumentException("paymentStatus is required");
        }
        PurchaseOrderPaymentStatus paymentStatus = PurchaseOrderPaymentStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(new APIResponse<>(200, "Payment status updated successfully",
                purchaseOrderService.updatePaymentStatus(id, paymentStatus)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> delete(@PathVariable String id) throws Exception {
        purchaseOrderService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "Purchase order deleted successfully", null));
    }
}
