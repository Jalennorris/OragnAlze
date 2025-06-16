package com.jalennorris.server.Controllers;

import com.jalennorris.server.service.MotivationalQuotesService;
import com.jalennorris.server.dto.MotivationalQuoteDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/quotes")
public class MotivationalQuotesController {

    @Autowired
    private MotivationalQuotesService service;

    @GetMapping
    public ResponseEntity<List<MotivationalQuoteDto>> getAllQuotes() {
        List<MotivationalQuoteDto> quotes = service.getAllQuotes();
        return ResponseEntity.ok().body(quotes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<String> getQuoteById(@PathVariable Long id) {
        Optional<MotivationalQuoteDto> quote = service.getQuoteById(id);
        if (quote.isPresent()) {
            return ResponseEntity.ok("Fetched quote with ID: " + id + " - " + quote.get().getQuote());
        } else {
            return ResponseEntity.status(404).body("Quote with ID: " + id + " not found.");
        }
    }

    @PostMapping
    public ResponseEntity<String> createQuote(@RequestBody MotivationalQuoteDto quoteDto) {
        MotivationalQuoteDto createdQuote = service.createQuote(quoteDto);
        return ResponseEntity.ok("Created quote with ID: " + createdQuote.getId());
    }

    @PostMapping("/batch")
    public ResponseEntity<List<MotivationalQuoteDto>> createQuotes(@RequestBody List<MotivationalQuoteDto> quoteDtos) {
        List<MotivationalQuoteDto> createdQuotes = service.createQuotes(quoteDtos);
        return ResponseEntity.ok(createdQuotes);
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateQuote(@PathVariable Long id, @RequestBody MotivationalQuoteDto quoteDto) {
        Optional<MotivationalQuoteDto> updatedQuote = service.updateQuote(id, quoteDto);
        if (updatedQuote.isPresent()) {
            return ResponseEntity.ok("Updated quote with ID: " + id);
        } else {
            return ResponseEntity.status(404).body("Quote with ID: " + id + " not found for update.");
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<String> patchQuote(@PathVariable Long id, @RequestBody MotivationalQuoteDto quoteDto) {
        Optional<MotivationalQuoteDto> patchedQuote = service.patchQuote(id, quoteDto);
        if (patchedQuote.isPresent()) {
            return ResponseEntity.ok("Patched quote with ID: " + id);
        } else {
            return ResponseEntity.status(404).body("Quote with ID: " + id + " not found for patching.");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteQuote(@PathVariable Long id) {
        boolean deleted = service.deleteQuote(id);
        if (deleted) {
            return ResponseEntity.ok("Deleted quote with ID: " + id);
        } else {
            return ResponseEntity.status(404).body("Quote with ID: " + id + " not found for deletion.");
        }
    }
}
