using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

public partial class UserLike
{
    public ulong UserId { get; set; }

    public ulong MusicId { get; set; }

    public string Type { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Music Music { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
