package org.example.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record RecipeRequest(
        @NotBlank String title,
        String description,
        @NotBlank String instructions,
        String imageUrl,
        Long categoryId,
        @Valid List<IngredientDto> ingredients
) {}