using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class UserListened
{
    public ulong Id { get; set; }

    public ulong UserId { get; set; }

    public ulong MusicId { get; set; }

    public DateTime ListenedAt { get; set; }

    public virtual Music Music { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
