package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.user.UserDTO;
import org.com.application_backend.service.custom.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;

    @GetMapping
    public List<UserDTO> getAllUsers() throws Exception{
        List<UserDTO> userDTOS=userService.getAll();
        System.out.println(userDTOS);
        return userDTOS;
    }

    //save
    @PostMapping
    public UserDTO saveUser(@RequestBody UserDTO dto) throws Exception{

        return userService.save(dto);
    }

    //update
    @PutMapping
    public UserDTO updateUser(@RequestBody UserDTO dto) throws Exception{
        return userService.update(dto);
    }

    //delete
    @DeleteMapping
    public void deleteUser(@PathVariable String id) throws Exception {
         userService.delete(id);
    }


}
