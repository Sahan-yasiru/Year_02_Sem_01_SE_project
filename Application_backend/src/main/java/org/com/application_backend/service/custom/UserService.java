package org.com.application_backend.service.custom;

import org.com.application_backend.dto.user.LoginRequestDTO;
import org.com.application_backend.dto.user.LoginResponseDTO;
import org.com.application_backend.dto.user.UserDTO;
import org.com.application_backend.service.SuperService;

public interface UserService extends SuperService<UserDTO> {

    LoginResponseDTO login(LoginRequestDTO dto) throws Exception;
}