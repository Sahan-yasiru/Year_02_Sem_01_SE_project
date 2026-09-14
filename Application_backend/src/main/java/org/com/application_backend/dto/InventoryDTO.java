package org.com.application_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.SparePart;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class InventoryDTO {
    private String inventory_id;
    private SparePart part;
    private int quantity_on_hand;
    private int reorder_threshold;
}
