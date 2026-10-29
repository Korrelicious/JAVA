package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.IngredientDto;
import org.example.dto.RecipeRequest;
import org.example.dto.RecipeResponse;
import org.example.model.Category;
import org.example.model.Ingredient;
import org.example.model.Recipe;
import org.example.model.User;
import org.example.repository.CategoryRepository;
import org.example.repository.RecipeRepository;
import org.example.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public RecipeController(RecipeRepository recipeRepository,
                            UserRepository userRepository,
                            CategoryRepository categoryRepository) {
        this.recipeRepository = recipeRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<RecipeResponse> getAll(@RequestParam(required = false) String search,
                                       @RequestParam(required = false) Long categoryId) {
        String term = (search == null || search.isBlank()) ? null : search.trim();
        return recipeRepository.search(term, categoryId).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public RecipeResponse getOne(@PathVariable Long id) {
        return toResponse(findRecipe(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public RecipeResponse create(@Valid @RequestBody RecipeRequest request,
                                 Authentication authentication) {
        User owner = findUser(authentication);

        Recipe recipe = new Recipe();
        recipe.setOwner(owner);
        applyRequest(recipe, request);

        return toResponse(recipeRepository.save(recipe));
    }

    @PutMapping("/{id}")
    @Transactional
    public RecipeResponse update(@PathVariable Long id,
                                 @Valid @RequestBody RecipeRequest request,
                                 Authentication authentication) {
        Recipe recipe = findRecipe(id);
        checkOwner(recipe, authentication);

        applyRequest(recipe, request);

        return toResponse(recipeRepository.save(recipe));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id, Authentication authentication) {
        Recipe recipe = findRecipe(id);
        checkOwner(recipe, authentication);

        recipeRepository.delete(recipe);
    }

    private Recipe findRecipe(Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receptet finns inte"));
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Användaren finns inte"));
    }

    private void checkOwner(Recipe recipe, Authentication authentication) {
        User user = findUser(authentication);
        if (!recipe.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Du äger inte det här receptet");
        }
    }

    private void applyRequest(Recipe recipe, RecipeRequest request) {
        recipe.setTitle(request.title());
        recipe.setDescription(request.description());
        recipe.setInstructions(request.instructions());
        recipe.setImageUrl(request.imageUrl());

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kategorin finns inte"));
            recipe.setCategory(category);
        } else {
            recipe.setCategory(null);
        }

        recipe.getIngredients().clear();
        if (request.ingredients() != null) {
            for (IngredientDto dto : request.ingredients()) {
                Ingredient ingredient = new Ingredient();
                ingredient.setName(dto.name());
                ingredient.setAmount(dto.amount());
                ingredient.setRecipe(recipe);
                recipe.getIngredients().add(ingredient);
            }
        }
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