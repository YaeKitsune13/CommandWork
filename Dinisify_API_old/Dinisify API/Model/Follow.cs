using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

public partial class Follow
{
    public ulong FollowerId { get; set; }

    public ulong FollowingId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User Follower { get; set; } = null!;

    public virtual User Following { get; set; } = null!;
}
