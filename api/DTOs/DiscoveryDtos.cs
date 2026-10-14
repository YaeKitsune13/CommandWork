namespace api.Dtos;

public record ArtistSearchDto(ulong Id, string Name, string? Image);
public record AlbumSearchDto(ulong Id, string Name, string? Image, string ArtistName);
public record TrackSearchDto(ulong Id, string Name, string ArtistName, string? Image, uint? DurationSec);

public record SearchResultDto(
    List<TrackSearchDto> Tracks,
    List<ArtistSearchDto> Artists,
    List<AlbumSearchDto> Albums);

public record ChartItemDto(
    int Rank,
    ulong TrackId,
    string TrackName,
    string ArtistName,
    string? Image,
    uint? DurationSec,
    int ListensCount);
