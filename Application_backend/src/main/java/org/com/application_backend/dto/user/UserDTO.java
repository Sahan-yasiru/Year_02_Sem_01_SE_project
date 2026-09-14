package org.com.application_backend.dto.user;

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
    private String username;
    private String password;
    private String email;
    private String phone;
}
