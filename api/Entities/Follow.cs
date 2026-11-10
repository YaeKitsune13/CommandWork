using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class Follow
{
    public ulong FollowerId { get; set; }

    public ulong FollowingId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual User Follower { get; set; } = null!;

    public virtual User Following { get; set; } = null!;
}
