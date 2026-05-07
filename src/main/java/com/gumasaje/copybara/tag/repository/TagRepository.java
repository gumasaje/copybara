package com.gumasaje.copybara.tag.repository;

import com.gumasaje.copybara.tag.domain.Tag;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findAllByNormalizedNameIn(List<String> normalizedNames);

    Optional<Tag> findByName(String name);
}
