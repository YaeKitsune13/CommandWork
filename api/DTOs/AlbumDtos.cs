namespace api.Dtos;

public record AlbumCreateDto(string Name, ulong ArtistId, IFormFile? Image, DateTime ReleaseDate);
public record AlbumEditDto(ulong Id, string Name, ulong ArtistId, DateTime? ReleaseDate);
public record AlbumResponseDto(
    ulong Id, 
    string Name, 
    ulong ArtistId, 
    string? Image, 
    DateTime ReleaseDate,
    List<TrackResponseDto>? Tracks 
);