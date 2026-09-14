package org.com.application_backend.dto.order;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.Customer.Customer;
import org.com.application_backend.entity.SparePart;
import org.com.application_backend.entity.order.OrderStatus;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class OrderDTO {
    private String orderId;
    private Customer customer;
    private List<SparePart> spareParts;
    private int quantity;
    private double totalPrice;
    private Date date;
    private OrderStatus orderStatus;
    private String address;
}
