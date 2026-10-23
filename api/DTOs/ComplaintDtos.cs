using api.Entities;
using System;

namespace api.Dtos;

public record ComplaintCreateDto(
    ComplaintTargetType TargetType, 
    ulong TargetId, 
    string Reason, 
    string? Description
);

public record ComplaintResponseDto(
    ulong Id,
    ComplaintTargetType TargetType,
    ulong TargetId,
    string Reason,
    string? Description,
    ulong ReporterId,
    ComplaintStatus Status,
    DateTime CreatedAt
);