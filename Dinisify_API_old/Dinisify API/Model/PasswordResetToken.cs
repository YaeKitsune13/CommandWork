using System;
using System.Collections.Generic;

namespace Dinisify_API.Model;

public partial class PasswordResetToken
{
    public ulong Id { get; set; }

    public ulong UserId { get; set; }

    public string Token { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
