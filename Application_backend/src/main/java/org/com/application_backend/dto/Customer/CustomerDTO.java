package org.com.application_backend.dto.Customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.antlr.v4.runtime.misc.NotNull;
import org.com.application_backend.dto.user.UserDTO;
import org.com.application_backend.entity.Customer.CustomerName;
import org.com.application_backend.entity.user.User;
import org.hibernate.annotations.DialectOverride;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class CustomerDTO {
    private String customerID;
    private CustomerName name;
    @NotBlank
    @Pattern(
            regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$",
            message = "Invalid email address"
    )
    private String email;
    private int phoneNumber;
    private String address;
    private UserDTO user;
}
