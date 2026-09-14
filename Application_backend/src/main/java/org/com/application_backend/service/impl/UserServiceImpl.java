package org.com.application_backend.service.impl;

import lombok.AllArgsConstructor;
import org.com.application_backend.dto.user.UserDTO;
import org.com.application_backend.entity.user.User;
import org.com.application_backend.exception.CustomException;
import org.com.application_backend.repo.user.UserRepository;
import org.com.application_backend.service.custom.UserService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;


    @Override
    public UserDTO save(UserDTO dto) throws Exception {
        if (dto == null || dto.getUsername() == null || dto.getUsername().isBlank()) {
            throw new CustomException("Username is required");
        }
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new CustomException("Email is required");
        }
        String cleanUsername = dto.getUsername().trim();
        String cleanEmail = dto.getEmail().trim();

        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new CustomException("Username '" + cleanUsername + "' is already registered");
        }
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new CustomException("Email '" + cleanEmail + "' is already registered");
        }

        User user = modelMapper.map(dto, User.class);
        user.setUsername(cleanUsername);
        user.setEmail(cleanEmail);
        user.setUserID(null);
        
        return modelMapper.map(userRepository.save(user), UserDTO.class);
    }

    @Override
    public UserDTO update(UserDTO dto) throws Exception {
        if (dto == null || dto.getUserID() == null) {
            throw new CustomException("User ID is required for update");
        }
        User existingUser = userRepository.findById(dto.getUserID())
                .orElseThrow(() -> new CustomException("User not found"));

        String cleanUsername = dto.getUsername() != null ? dto.getUsername().trim() : existingUser.getUsername();
        String cleanEmail = dto.getEmail() != null ? dto.getEmail().trim() : existingUser.getEmail();

        if (!existingUser.getUsername().equalsIgnoreCase(cleanUsername) && userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new CustomException("Username '" + cleanUsername + "' is already registered to another user");
        }
        if (!existingUser.getEmail().equalsIgnoreCase(cleanEmail) && userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new CustomException("Email '" + cleanEmail + "' is already registered to another user");
        }

        User userToSave = modelMapper.map(dto, User.class);
        userToSave.setUsername(cleanUsername);
        userToSave.setEmail(cleanEmail);
        return modelMapper.map(userRepository.save(userToSave), UserDTO.class);
    }

    @Override
            public List<UserDTO> getAll() throws Exception {
                List<UserDTO> dtos = new ArrayList<>();
                userRepository.findAll().forEach( user -> {
                    dtos.add(modelMapper.map(user, UserDTO.class));
        });
        return dtos;
    }

    @Override
    public void delete(String id) throws Exception {
        userRepository.deleteById(Integer.parseInt(id));
    }

    @Override
    public UserDTO find(String id) throws Exception {
        return modelMapper.map(userRepository.findById(Integer.parseInt(id)), UserDTO.class);
    }

    @Override
    public boolean ifExit(String userName) throws Exception {
        return userRepository.existsUsersByUsername(userName);
    }


}

