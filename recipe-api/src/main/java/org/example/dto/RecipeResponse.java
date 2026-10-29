package org.example.dto;

import java.util.List;

public record RecipeResponse(
        Long id,
        String title,
        String description,
        String instructions,
        String imageUrl,
        Long categoryId,
        String categoryName,
        Long ownerId,
        String ownerName,
        List<IngredientDto> ingredients
) {}