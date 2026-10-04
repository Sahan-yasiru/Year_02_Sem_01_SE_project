package org.com.application_backend.dto.Customer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.dto.order.OrderDTO;
import org.com.application_backend.entity.order.Order;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class CustomerReturnDTO {
    private String returnID;
    private Date date;
    private OrderDTO order;
    private int quantity;
    private String reason;
}
