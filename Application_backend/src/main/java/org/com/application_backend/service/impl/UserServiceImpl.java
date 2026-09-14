package org.com.application_backend.service.impl;

import org.com.application_backend.dto.user.UserDTO;
import org.com.application_backend.service.custom.UserService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    @Override
    public UserDTO save(UserDTO dto) throws Exception {
        return null;
    }

    @Override
    public UserDTO update(UserDTO dto) throws Exception {
        return null;
    }

    @Override
    public List<UserDTO> getAll() throws Exception {
        return List.of();
    }

    @Override
    public String getLastID() throws Exception {
        return "";
    }

    @Override
    public void delete(String id) throws Exception {

    }

    @Override
    public UserDTO find(String id) throws Exception {
        return null;
    }

    @Override
    public boolean ifExit(String id) throws Exception {
        return false;
    }
}
