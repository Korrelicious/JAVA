package org.example.config;

import org.example.model.Category;
import org.example.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    public DataInitializer(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            return;
        }

        for (String name : List.of("Huvudrätt", "Efterrätt", "Förrätt", "Bakning")) {
            Category category = new Category();
            category.setName(name);
            categoryRepository.save(category);
        }
    }
}