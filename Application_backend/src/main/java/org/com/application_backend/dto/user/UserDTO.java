package org.com.application_backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.com.application_backend.entity.user.UserRole;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserDTO {
    private int userID;
    private UserRole userRole;
    private String username;
    private String password;
    private String email;
    private String phone;
}
