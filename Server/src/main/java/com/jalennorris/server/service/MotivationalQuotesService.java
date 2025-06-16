package com.jalennorris.server.service;

import com.jalennorris.server.Models.MotivationalQuotesModel;
import com.jalennorris.server.Repository.MotivationalQuotesRepository;
import com.jalennorris.server.dto.MotivationalQuoteDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MotivationalQuotesService {

    @Autowired
    private MotivationalQuotesRepository repository;

    public List<MotivationalQuoteDto> getAllQuotes() {
        return repository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Optional<MotivationalQuoteDto> getQuoteById(Long id) {
        return repository.findById(id).map(this::toDto);
    }

    public MotivationalQuoteDto createQuote(MotivationalQuoteDto quoteDto) {
        MotivationalQuotesModel entity = toEntity(quoteDto);
        MotivationalQuotesModel saved = repository.save(entity);
        return toDto(saved);
    }

    public List<MotivationalQuoteDto> createQuotes(List<MotivationalQuoteDto> quoteDtos) {
        List<MotivationalQuotesModel> entities = quoteDtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
        List<MotivationalQuotesModel> savedEntities = repository.saveAll(entities);
        return savedEntities.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Optional<MotivationalQuoteDto> updateQuote(Long id, MotivationalQuoteDto quoteDto) {
        return repository.findById(id).map(existing -> {
            existing.setQuote(quoteDto.getQuote());
            existing.setAuthor(quoteDto.getAuthor());
            existing.setType(quoteDto.getType());
            if (quoteDto.getCreated_at() != null) {
                existing.setCreated_at(quoteDto.getCreated_at());
            }
            MotivationalQuotesModel saved = repository.save(existing);
            return toDto(saved);
        });
    }

    public Optional<MotivationalQuoteDto> patchQuote(Long id, MotivationalQuoteDto quoteDto) {
        return repository.findById(id).map(existing -> {
            if (quoteDto.getQuote() != null) existing.setQuote(quoteDto.getQuote());
            if (quoteDto.getAuthor() != null) existing.setAuthor(quoteDto.getAuthor());
            if (quoteDto.getType() != null) existing.setType(quoteDto.getType());
            if (quoteDto.getCreated_at() != null) {
                existing.setCreated_at(quoteDto.getCreated_at());
            }
            MotivationalQuotesModel saved = repository.save(existing);
            return toDto(saved);
        });
    }

    public boolean deleteQuote(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    private MotivationalQuoteDto toDto(MotivationalQuotesModel entity) {
        MotivationalQuoteDto dto = new MotivationalQuoteDto();
        dto.setId(entity.getId());
        dto.setQuote(entity.getQuote());
        dto.setAuthor(entity.getAuthor());
        dto.setType(entity.getType());
        // LocalDateTime is used in both model and DTO
        if (entity.getCreated_at() != null) {
            dto.setCreated_at(entity.getCreated_at());
        }
        // Optionally set id if you add it to the DTO
        return dto;
    }

    private MotivationalQuotesModel toEntity(MotivationalQuoteDto dto) {
        MotivationalQuotesModel entity = new MotivationalQuotesModel();
        entity.setId(dto.getId());
        entity.setQuote(dto.getQuote());
        entity.setAuthor(dto.getAuthor());
        entity.setType(dto.getType());
        if (dto.getCreated_at() != null) {
            entity.setCreated_at(dto.getCreated_at());
        }
        return entity;
    }
}