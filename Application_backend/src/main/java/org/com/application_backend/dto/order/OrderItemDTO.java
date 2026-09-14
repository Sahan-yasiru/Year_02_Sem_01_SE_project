package org.com.application_backend.dto.order;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.SparePart;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class OrderItemDTO {
    private String id;
    private List<SparePart> spareParts;
    private int quantity;
    private double totalPrice;
    private Customer customer;
}
