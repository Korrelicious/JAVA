package org.example.dto;

import jakarta.validation.constraints.NotBlank;

public record IngredientDto(
        @NotBlank String name,
        String amount
) {}