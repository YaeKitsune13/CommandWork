using System.ComponentModel.DataAnnotations;

namespace api.Dtos;

public class AlbumCreateDto
{
    [Required, MaxLength(255)]
    public string Name { get; set; } = null!;
    public IFormFile? Image { get; set; }
    public DateOnly? ReleaseDate { get; set; }
}

public class AlbumEditDto
{
    public ulong? Id { get; set; }
    [MaxLength(255)]
    public string? Name { get; set; }
    public DateOnly? ReleaseDate { get; set; }
}

public record AlbumResponseDto(
    ulong Id,
    string Name,
    UserBriefDto Owner,
    string? Image,
    DateOnly? ReleaseDate,
    int TracksCount,
    List<TrackResponseDto>? Tracks = null
);
