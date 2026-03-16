package com.fintrack.controller;

import com.fintrack.dto.request.VoiceCommandRequest;
import com.fintrack.dto.request.VoiceConfirmRequest;
import com.fintrack.dto.response.ApiResponse;
import com.fintrack.dto.response.VoiceCommandResponse;
import com.fintrack.util.SecurityUtils;
import com.fintrack.voice.VoiceAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
public class VoiceAssistantController {

    private final VoiceAssistantService voiceAssistantService;

    @PostMapping("/command")
    public ResponseEntity<ApiResponse<VoiceCommandResponse>> processCommand(
            @Valid @RequestBody VoiceCommandRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        VoiceCommandResponse response = voiceAssistantService.processCommand(userId, request.getText());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<VoiceCommandResponse>> confirmAction(
            @Valid @RequestBody VoiceConfirmRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        VoiceCommandResponse response = voiceAssistantService.confirmAction(
                userId, request.getPendingActionId(), request.isConfirmed());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
