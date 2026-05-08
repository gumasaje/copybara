package com.gumasaje.copybara.category.controller;

import com.gumasaje.copybara.auth.service.AuthMember;
import com.gumasaje.copybara.category.dto.CategoryCreateRequest;
import com.gumasaje.copybara.category.dto.CategoryResponse;
import com.gumasaje.copybara.category.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(
            @AuthenticationPrincipal AuthMember authMember,
            @Valid @RequestBody CategoryCreateRequest request
    ) {
        return categoryService.create(authMember.memberId(), request);
    }

    @GetMapping
    public List<CategoryResponse> getCategories(@AuthenticationPrincipal AuthMember authMember) {
        return categoryService.getCategories(authMember.memberId());
    }

    @PutMapping("/{categoryId}")
    public CategoryResponse update(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryCreateRequest request
    ) {
        return categoryService.update(authMember.memberId(), categoryId, request);
    }

    @DeleteMapping("/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal AuthMember authMember,
            @PathVariable Long categoryId
    ) {
        categoryService.delete(authMember.memberId(), categoryId);
    }
}
