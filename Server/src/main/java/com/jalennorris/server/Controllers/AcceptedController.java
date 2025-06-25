package com.jalennorris.server.Controllers;

import com.jalennorris.server.dto.AcceptedDTO;
import com.jalennorris.server.service.AcceptedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/accepted")
public class AcceptedController {

    @Autowired
    private AcceptedService acceptedService;

    @GetMapping
    public ResponseEntity<List<AcceptedDTO>> getAllAccepted() {
        return ResponseEntity.ok(acceptedService.getAllAccepted());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcceptedDTO> getAcceptedById(@PathVariable Long id) {
        Optional<AcceptedDTO> accepted = acceptedService.getAcceptedById(id);
        return accepted.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AcceptedDTO> createAccepted(@Valid @RequestBody AcceptedDTO accepted) {
        return ResponseEntity.status(201).body(acceptedService.createAccepted(accepted));
    }

    // Batch endpoint: create multiple accepted tasks at once
    @PostMapping("/batch/create")
    public ResponseEntity<List<AcceptedDTO>> createAcceptedBatch(@Valid @RequestBody List<AcceptedDTO> acceptedList) {
        List<AcceptedDTO> created = acceptedService.createAcceptedBatch(acceptedList);
        return ResponseEntity.status(201).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AcceptedDTO> updateAccepted(@PathVariable Long id, @RequestBody AcceptedDTO accepted) {
        Optional<AcceptedDTO> updated = acceptedService.updateAccepted(id, accepted);
        return updated.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccepted(@PathVariable Long id) {
        boolean deleted = acceptedService.deleteAccepted(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
