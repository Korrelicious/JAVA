package org.example.dto;

public record AuthResponse(Long id, String token, String name, String email) {}