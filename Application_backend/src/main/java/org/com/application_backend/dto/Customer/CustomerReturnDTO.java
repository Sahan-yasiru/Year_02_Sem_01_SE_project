package org.com.application_backend.dto.Customer;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.order.Order;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CustomerReturnDTO {
    private String returnID;
    private Date date;
    private Order order;
    private int quantity;
    private String reason;
}
