using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

public partial class PlaylistTrack
{
    public ulong PlaylistId { get; set; }

    public ulong MusicId { get; set; }

    public uint Position { get; set; }

    public virtual Music Music { get; set; } = null!;

    public virtual Playlist Playlist { get; set; } = null!;
}
