namespace api.Dtos;

public record SearchResultDto(
    List<TrackResponseDto> Tracks,
    List<UserBriefDto> Users,
    List<AlbumResponseDto> Albums,
    List<PlaylistResponseDto> Playlists);

public record ChartItemDto(
    int Rank,
    int ListensCount,
    TrackResponseDto Track);
