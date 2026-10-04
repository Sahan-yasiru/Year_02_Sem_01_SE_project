package org.com.application_backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.entity.user.UserRole;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserDTO {
    private Integer userID;
    private UserRole userRole;
    @NotBlank(message = "username should be inserted")
    private String username;
    @NotBlank(message = "password should be inserted")
    private String password;
    @NotBlank
    @Pattern(
            regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$",
            message = "Invalid email address"
    )
    private String email;
    private String phone;
}
