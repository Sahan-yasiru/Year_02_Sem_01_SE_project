package org.com.application_backend.dto.Customer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.dto.order.OrderDTO;
import org.com.application_backend.entity.Customer.PaymentMethod;

import java.util.Date;


@AllArgsConstructor
@NoArgsConstructor
@Data
public class CustomerTransactionEntryDTO {

    private Date date;

    private double amount;

    private OrderDTO order;

    private PaymentMethod paymentMethod;
}
