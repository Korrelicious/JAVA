package org.example.controller;

import org.example.dto.IngredientDto;
import org.example.dto.RecipeResponse;
import org.example.model.Category;
import org.example.model.Favorite;
import org.example.model.Recipe;
import org.example.model.User;
import org.example.repository.FavoriteRepository;
import org.example.repository.RecipeRepository;
import org.example.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;

    public FavoriteController(FavoriteRepository favoriteRepository,
                              RecipeRepository recipeRepository,
                              UserRepository userRepository) {
        this.favoriteRepository = favoriteRepository;
        this.recipeRepository = recipeRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<RecipeResponse> getMine(Authentication authentication) {
        User user = findUser(authentication);
        return favoriteRepository.findByUserId(user.getId()).stream()
                .map(f -> toResponse(f.getRecipe()))
                .toList();
    }

    @PostMapping("/{recipeId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public void add(@PathVariable Long recipeId, Authentication authentication) {
        User user = findUser(authentication);
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receptet finns inte"));

        if (favoriteRepository.findByUserIdAndRecipeId(user.getId(), recipeId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Receptet är redan en favorit");
        }

        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setRecipe(recipe);
        favoriteRepository.save(favorite);
    }

    @DeleteMapping("/{recipeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void remove(@PathVariable Long recipeId, Authentication authentication) {
        User user = findUser(authentication);
        Favorite favorite = favoriteRepository.findByUserIdAndRecipeId(user.getId(), recipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favoriten finns inte"));

        favoriteRepository.delete(favorite);
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Användaren finns inte"));
    }

    private RecipeResponse toResponse(Recipe recipe) {
        Category category = recipe.getCategory();
        return new RecipeResponse(
                recipe.getId(),
                recipe.getTitle(),
                recipe.getDescription(),
                recipe.getInstructions(),
                recipe.getImageUrl(),
                category != null ? category.getId() : null,
                category != null ? category.getName() : null,
                recipe.getOwner().getId(),
                recipe.getOwner().getName(),
                recipe.getIngredients().stream()
                        .map(i -> new IngredientDto(i.getName(), i.getAmount()))
                        .toList()
        );
    }
}