package org.com.application_backend.dto.Customer;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.Customer.PaymentMethod;
import org.com.application_backend.entity.order.Order;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CustomerTransactionDTO {
    private int saleID;
    private Date date;
    private double amount;
    private Order order;
    private PaymentMethod paymentMethod;
}
