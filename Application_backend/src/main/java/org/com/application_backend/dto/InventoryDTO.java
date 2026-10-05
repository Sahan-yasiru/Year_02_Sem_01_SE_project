package org.com.application_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.dto.SparePart.SparePartDTO;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class InventoryDTO {
    private String inventory_id;
    private SparePartDTO part;
    private int quantity_on_hand;
    private int reorder_threshold;
}
