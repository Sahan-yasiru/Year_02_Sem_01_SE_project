package org.com.application_backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.com.application_backend.entity.user.UserRole;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class LoginResponseDTO {

    private Integer userID;
    private String username;
    private String email;
    private UserRole userRole;
}