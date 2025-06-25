package com.jalennorris.server.service;

import com.jalennorris.server.Models.AcceptedTask;
import com.jalennorris.server.Repository.AcceptRepository;
import com.jalennorris.server.dto.AcceptedDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AcceptedService {

    private final AcceptRepository acceptedRepository;

    @Autowired
    public AcceptedService(AcceptRepository acceptedRepository) {
        this.acceptedRepository = acceptedRepository;
    }

    // DTO to Entity
    private AcceptedTask toEntity(AcceptedDTO dto) {
        AcceptedTask entity = new AcceptedTask();
        entity.setId(dto.getId());
        entity.setUser(dto.getUser());
        entity.setTaskTitle(dto.getTaskTitle());
        entity.setTaskDescription(dto.getTaskDescription());
        entity.setDeadline(dto.getDeadline());
        entity.setAcceptedAt(dto.getAcceptedAt());
        return entity;
    }

    // Entity to DTO
    private AcceptedDTO toDTO(AcceptedTask entity) {
        AcceptedDTO dto = new AcceptedDTO();
        dto.setId(entity.getId());
        dto.setUser(entity.getUser());
        dto.setTaskTitle(entity.getTaskTitle());
        dto.setTaskDescription(entity.getTaskDescription());
        dto.setDeadline(entity.getDeadline());
        dto.setAcceptedAt(entity.getAcceptedAt());


        return dto;
    }

    public AcceptedDTO createAccepted(AcceptedDTO acceptedDTO) {
        if (acceptedDTO.getTaskTitle() == null) {
            throw new IllegalArgumentException("taskTitle must not be null");
        }
        AcceptedTask saved = acceptedRepository.save(toEntity(acceptedDTO));
        return toDTO(saved);
    }

    public List<AcceptedDTO> createAcceptedBatch(List<AcceptedDTO> acceptedDTOs) {
        List<AcceptedTask> entities = acceptedDTOs.stream()
                .map(dto -> {
                    if (dto.getTaskTitle() == null) {
                        throw new IllegalArgumentException("taskTitle must not be null");
                    }
                    return toEntity(dto);
                })
                .collect(Collectors.toList());
        List<AcceptedTask> saved = acceptedRepository.saveAll(entities);
        return saved.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<AcceptedDTO> getAcceptedById(Long id) {
        return acceptedRepository.findById(id).map(this::toDTO);
    }

    public List<AcceptedDTO> getAcceptedByUser(Long user) {
        return acceptedRepository.findByUser(user)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AcceptedDTO> getAllAccepted() {
        return acceptedRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<AcceptedDTO> updateAccepted(Long id, AcceptedDTO updatedDTO) {
        return acceptedRepository.findById(id).map(accepted -> {
            accepted.setUser(updatedDTO.getUser());
            accepted.setTaskTitle(updatedDTO.getTaskTitle());
            accepted.setTaskDescription(updatedDTO.getTaskDescription());
            accepted.setDeadline(updatedDTO.getDeadline());
            accepted.setAcceptedAt(updatedDTO.getAcceptedAt());
            return toDTO(acceptedRepository.save(accepted));
        });
    }

    public Optional<AcceptedDTO> patchAccepted(Long id, AcceptedDTO patchDTO) {
        return acceptedRepository.findById(id).map(accepted -> {
            // Only update fields that are not null in patchDTO
            if (patchDTO.getUser() != null) {
                accepted.setUser(patchDTO.getUser());
            }
            if (patchDTO.getTaskTitle() != null) {
                accepted.setTaskTitle(patchDTO.getTaskTitle());
            }
            if (patchDTO.getTaskDescription() != null) {
                accepted.setTaskDescription(patchDTO.getTaskDescription());
            }
            if (patchDTO.getDeadline() != null) {
                accepted.setDeadline(patchDTO.getDeadline());
            }
            if (patchDTO.getAcceptedAt() != null) {
                accepted.setAcceptedAt(patchDTO.getAcceptedAt());
            }
            // Save only if at least one field was patched
            return toDTO(acceptedRepository.save(accepted));
        });
    }

    public boolean deleteAccepted(Long id) {
        if (acceptedRepository.existsById(id)) {
            acceptedRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
