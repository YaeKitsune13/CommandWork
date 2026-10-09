public record RegisterDto(string Email, string Password, string? Nickname);
public record LoginDto(string Email, string Password);
public record TokenDto(string Token);
