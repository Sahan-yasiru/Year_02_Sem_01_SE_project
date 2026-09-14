package org.com.application_backend.controller;

import lombok.RequiredArgsConstructor;
import org.com.application_backend.dto.user.UserDTO;
import org.com.application_backend.service.custom.UserService;
import org.com.application_backend.util.APIResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<APIResponse<List<UserDTO>>> getAllUsers() throws Exception{
        return ResponseEntity.ok(new APIResponse<>(200, "Users retrieved successfully", userService.getAll()));
    }

    //save
    @PostMapping
    public ResponseEntity<APIResponse<UserDTO>> saveUser(@RequestBody UserDTO dto) throws Exception{
        return ResponseEntity.ok(new APIResponse<>(200, "User created successfully", userService.save(dto)));
    }

    //update
    @PutMapping
    public ResponseEntity<APIResponse<UserDTO>> updateUser(@RequestBody UserDTO dto) throws Exception{
        return ResponseEntity.ok(new APIResponse<>(200, "User updated successfully", userService.update(dto)));
    }

    //delete
    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteUser(@PathVariable String id) throws Exception {
        userService.delete(id);
        return ResponseEntity.ok(new APIResponse<>(200, "User deleted successfully", null));
    }


}
