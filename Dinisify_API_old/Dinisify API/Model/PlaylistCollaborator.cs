using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

public partial class PlaylistCollaborator
{
    public ulong PlaylistId { get; set; }

    public ulong UserId { get; set; }

    public string Role { get; set; } = null!;

    public virtual Playlist Playlist { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
