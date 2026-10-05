package org.com.application_backend.dto.purchase;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.dto.Supplier.SupplierDTO;
import org.com.application_backend.entity.purchase.PurchaseOrderPaymentStatus;
import org.com.application_backend.entity.purchase.PurchaseOrderStatus;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PurchaseOrderDTO {
    private String purchaseOrderId;
    private SupplierDTO supplier;
    private Date orderDate;
    private Date expectedDate;
    private PurchaseOrderStatus status;
    private PurchaseOrderPaymentStatus paymentStatus;
    private double totalAmount;
    private List<PurchaseOrderItemDTO> items = new ArrayList<>();
    private String notes;
}
