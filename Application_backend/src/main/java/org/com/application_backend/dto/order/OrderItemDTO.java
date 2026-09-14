package org.com.application_backend.dto.order;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.SparePart;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class OrderItemDTO {
    private String id;
    private List<SparePart> spareParts;
    private int quantity;
    private double totalPrice;
    private Customer customer;
}
