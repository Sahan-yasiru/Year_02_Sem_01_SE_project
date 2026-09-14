package org.com.application_backend.dto.Customer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.entity.Customer.CustomerName;
import org.com.application_backend.entity.user.User;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class CustomerDTO {
    private String customerID;
    private CustomerName name;
    private String email;
    private String phoneNumber;
    private String address;
    private User user;
}
