package org.com.application_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.entity.SparePart;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class InventoryDTO {
    private String inventory_id;
    private SparePart part;
    private int quantity_on_hand;
    private int reorder_threshold;
}
