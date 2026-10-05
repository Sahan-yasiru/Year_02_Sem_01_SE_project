package org.com.application_backend.dto.purchase;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.dto.SparePart.SparePartDTO;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PurchaseOrderItemDTO {
    private Long id;
    private String partId;
    private String partName;
    private SparePartDTO sparePart;
    private int orderedQuantity;
    private int receivedQuantity;
    private double unitPrice;
    private double lineTotal;
}
