using api.Entities;
using System;

namespace api.Dtos;

public record MusicReviewDto(ulong MusicId, bool IsApproved, string? RejectionReason);

public record UserBlockDto(ulong UserId, bool IsBlocked);

public record MusicModerationResponseDto(
    ulong Id, 
    string Name, 
    string FileUrl, 
    string ArtistName, 
    string Status, 
    DateTime CreatedAt
);