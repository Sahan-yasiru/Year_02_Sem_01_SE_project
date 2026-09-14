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
        if(ifExit(dto.getUsername())){
            throw new CustomException("username name already registered");
        }
        if(userRepository.existsByEmail(dto.getEmail())){
            throw new CustomException("email has already been registered");
        }
        return modelMapper.map(userRepository.save(modelMapper.map(dto, User.class)), UserDTO.class);
    }

    @Override
    public UserDTO update(UserDTO dto) throws Exception {
        if(ifExit(dto.getUsername())){
            throw new CustomException("username name already registered");
        }
        if(userRepository.existsByEmail(dto.getEmail())){
            throw new CustomException("email has already been registered");
        }
        return modelMapper.map(userRepository.save(modelMapper.map(dto, User.class)), UserDTO.class);
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

