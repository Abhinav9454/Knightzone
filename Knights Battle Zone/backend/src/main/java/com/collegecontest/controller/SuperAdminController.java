package com.collegecontest.controller;

import com.collegecontest.dto.CreateAdminRequest;
import com.collegecontest.dto.UserDTO;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.service.UserPublicIdService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserPublicIdService userPublicIdService;

    public SuperAdminController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            UserPublicIdService userPublicIdService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userPublicIdService = userPublicIdService;
    }

    @GetMapping("/admins")
    public List<UserDTO> getAdminUsers() {
        return userRepository.findByRoleIn(List.of(Role.ADMIN, Role.SUPER_ADMIN))
                .stream()
                .sorted(Comparator.comparing(User::getCreatedAt).reversed())
                .map(this::toDto)
                .toList();
    }

    @PostMapping("/admins")
    public UserDTO createAdmin(@RequestBody @jakarta.validation.Valid CreateAdminRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }
        if (request.getAccessDurationHours() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "accessDurationHours is required");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setUsername(generateUniqueUsername(request.getName(), email));
        user.setPublicUserId(userPublicIdService.generateUniquePublicUserId());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCollege(request.getCollege());
        user.setRole(Role.ADMIN);
        user.setAdminExpiresAt(LocalDateTime.now().plusHours(request.getAccessDurationHours()));

        return toDto(userRepository.save(user));
    }

    @DeleteMapping("/admins/{adminId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAdmin(@PathVariable Long adminId) {
        User user = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));
        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only admin accounts can be deleted");
        }
        userRepository.delete(user);
    }

    private UserDTO toDto(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setPublicUserId(user.getPublicUserId());
        dto.setEmail(user.getEmail());
        dto.setCollege(user.getCollege());
        dto.setDepartment(user.getDepartment());
        dto.setAdminExpiresAt(user.getAdminExpiresAt());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        return dto;
    }

    private String generateUniqueUsername(String name, String email) {
        String base = (name != null && !name.isBlank() ? name : email.split("@")[0])
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "")
                .trim();
        if (base.isBlank()) {
            base = "user";
        }

        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }
}
