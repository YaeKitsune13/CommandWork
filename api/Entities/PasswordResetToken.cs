using System;
using System.Collections.Generic;

namespace api.Entities;

public partial class PasswordResetToken
{
    public ulong Id { get; set; }

    public ulong UserId { get; set; }

    /// <summary>
    /// SHA-256 токена в hex
    /// </summary>
    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? UsedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
