package org.com.application_backend.dto.purchase;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class ReceiveItemDTO {
    private Long itemId;
    private String partId;
    private int receivedQuantity;
}
