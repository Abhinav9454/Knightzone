package com.collegecontest.controller;

import com.collegecontest.dto.AuthRequest;
import com.collegecontest.dto.AuthResponse;
import com.collegecontest.dto.BasicMessageResponse;
import com.collegecontest.dto.ForgotPasswordRequest;
import com.collegecontest.dto.ForgotPasswordResponse;
import com.collegecontest.dto.GoogleAuthRequest;
import com.collegecontest.dto.RefreshTokenRequest;
import com.collegecontest.dto.RegistrationRequest;
import com.collegecontest.dto.ResetPasswordRequest;
import com.collegecontest.dto.UserDTO;
import com.collegecontest.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Authentication APIs")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", responses = {
            @ApiResponse(responseCode = "200", description = "User registered") })
    public AuthResponse register(@RequestBody @jakarta.validation.Valid RegistrationRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password", responses = {
            @ApiResponse(responseCode = "200", description = "Login successful") })
    public AuthResponse login(@RequestBody @jakarta.validation.Valid AuthRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    @Operation(summary = "Login or register using Google", responses = {
            @ApiResponse(responseCode = "200", description = "Google auth successful") })
    public AuthResponse google(@RequestBody @jakarta.validation.Valid GoogleAuthRequest request) {
        return authService.loginWithGoogle(request.getIdToken());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", responses = {
            @ApiResponse(responseCode = "200", description = "Token refreshed") })
    public AuthResponse refresh(@RequestBody @jakarta.validation.Valid RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current session", responses = {
            @ApiResponse(responseCode = "200", description = "Logout successful") })
    public BasicMessageResponse logout(@RequestBody(required = false) RefreshTokenRequest request) {
        String refreshToken = request != null ? request.getRefreshToken() : null;
        return authService.logout(refreshToken);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset token", responses = {
            @ApiResponse(responseCode = "200", description = "Password reset request accepted") })
    public ForgotPasswordResponse forgotPassword(@RequestBody @jakarta.validation.Valid ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using one-time token", responses = {
            @ApiResponse(responseCode = "200", description = "Password reset successful") })
    public BasicMessageResponse resetPassword(@RequestBody @jakarta.validation.Valid ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user", responses = {
            @ApiResponse(responseCode = "200", description = "Current user returned") })
    public UserDTO getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        return authService.getCurrentUser(email);
    }
}
