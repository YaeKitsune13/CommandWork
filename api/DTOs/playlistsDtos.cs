using System.ComponentModel.DataAnnotations;

namespace api.Dtos;

public class PlaylistCreateDto
{
    [Required, MaxLength(50)] public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
}

public class PlaylistEditDto
{
    [MaxLength(50)] public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsPublic { get; set; }
}

public class PlaylistAddTrackDto
{
    [Required] public ulong TrackId { get; set; }
    public int? Position { get; set; }
}

public class PlaylistCollaboratorDto
{
    [Required] public ulong UserId { get; set; }
    public string Role { get; set; } = "editor";
}

public record PlaylistTrackDto(int Position, TrackResponseDto Track);

public record PlaylistCollaboratorResponseDto(ulong UserId, string Role);

public record PlaylistResponseDto(
    ulong Id,
    string Name,
    string? Description,
    bool IsPublic,
    ulong OwnerId,
    string? OwnerName,
    int TracksCount,
    List<PlaylistTrackDto>? Tracks,
    List<PlaylistCollaboratorResponseDto>? Collaborators
);