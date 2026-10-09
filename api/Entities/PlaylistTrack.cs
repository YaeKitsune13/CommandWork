using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class PlaylistTrack
{
    public ulong PlaylistId { get; set; }

    public ulong MusicId { get; set; }

    public uint Position { get; set; }

    /// <summary>
    /// кто добавил трек
    /// </summary>
    public ulong? AddedBy { get; set; }

    public DateTime AddedAt { get; set; }

    public virtual User? AddedByNavigation { get; set; }

    public virtual Music Music { get; set; } = null!;

    public virtual Playlist Playlist { get; set; } = null!;
}
