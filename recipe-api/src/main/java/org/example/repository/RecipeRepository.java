package org.example.repository;

import org.example.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByOwnerId(Long ownerId);

    @Query("""
            SELECT r FROM Recipe r
            WHERE (:search IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
              AND (:categoryId IS NULL OR r.category.id = :categoryId)
            """)
    List<Recipe> search(@Param("search") String search,
                        @Param("categoryId") Long categoryId);
}