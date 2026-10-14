using System.Windows.Markup;
using System.Xml;
using Dinisify_API.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
public class MusicController : ControllerBase
{
// [Authorize]
[HttpPost("/api/music")]
public async Task<IActionResult> upload_Music(MusicUpload dto)
    {
        var db = new CoopProjectContext();
          if (dto.AudioFile == null || dto.AudioFile.Length == 0)
        return BadRequest("Файл не прикреплён");

        var uploadsFolder = Path.Combine("wwwroot", "uploads", "music");
        Directory.CreateDirectory(uploadsFolder);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.AudioFile.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await dto.AudioFile.CopyToAsync(stream);
        }
        string imagePath = "";
        if (dto.Image != null)
        {
            var imgFolder = Path.Combine("wwwroot", "uploads", "images");
            Directory.CreateDirectory(imgFolder);
            var imgName = $"{Guid.NewGuid()}{Path.GetExtension(dto.Image.FileName)}";
            var imgFullPath = Path.Combine(imgFolder, imgName);
            using var imgStream = new FileStream(imgFullPath, FileMode.Create);
            await dto.Image.CopyToAsync(imgStream);
            imagePath = $"/uploads/images/{imgName}";
        }

        var music = new Music
        {
            Name = dto.Name,
            Author = dto.Author,
            OwnerId = dto.OwnerId,
            AlbumId = dto.AlbumId,
            FileUrl = $"/uploads/music/{fileName}",
            Image = imagePath,
            Status = "pending",
            RejectionReason = null,
            Date = DateTime.Now
        };
    db.Musics.Add(music);
    db.SaveChanges();
    return Ok( new { message = "Вы успешно выложили песню",
        music
    });
    }


 [HttpGet("/api/music/meta")]
 public IActionResult get_Music(ulong id)
    {
        var db= new CoopProjectContext();
        var music = db.Musics.FirstOrDefault(m => m.Id == id);
        if (music == null)
        {
            return NotFound("Не найдена песня!");
        }
        return Ok(music);
    }

    [HttpGet("/api/music/sound")]
    public IActionResult get_file_music(ulong id)
    {
        var db = new CoopProjectContext();
        var music = db.Musics.FirstOrDefault(m => m.Id == id);
        if (music == null)
        {
            return NotFound("Песня не найдена!");
        }
        var relativePath = Path.Combine("wwwroot", music.FileUrl.TrimStart('/'));
    var fullPath = Path.GetFullPath(relativePath);
       if (!System.IO.File.Exists(fullPath))
        {
        return NotFound("Файл на сервере отсутствует");
        }
         var contentType = GetContentType(fullPath);
          return PhysicalFile(fullPath, contentType, enableRangeProcessing: true);
    }
    private string GetContentType(string filePath)
{
    var ext = Path.GetExtension(filePath).ToLowerInvariant();
    return ext switch
    {
        ".mp3" => "audio/mpeg",
        ".wav" => "audio/wav",
        ".ogg" => "audio/ogg",
        ".flac" => "audio/flac",
        _ => "application/octet-stream"
    };
}
// [Authorize]
[HttpDelete("api/music/delete")]
public IActionResult music_delete(ulong id)
    {
        var db = new CoopProjectContext();
        var music = db.Musics.FirstOrDefault(m => m.Id == id);
        if (music == null)
        {
            return NotFound("Песня не найдена!");
        }
        db.Musics.Remove(music);
        db.SaveChanges();
        return Ok(new { message = "Песня удалена!"});  
    }
  //  [Authorize]
    [HttpPut("api/music/edit")]
    public IActionResult edit_music(MusicEdit dto)
    {
        var db = new CoopProjectContext();
        var music = db.Musics.FirstOrDefault(m => m.Id == dto.Id);
          if (music == null)
        {
            return NotFound("Песня не найдена!");
        }
        music.Name = dto.Name;
        music.Author = dto.Author;
        music.OwnerId = dto.OwnerId;
        music.AlbumId = dto.AlbumId;
        music.Status = dto.Status;
        music.RejectionReason = dto.RejectionReason;
        db.SaveChanges();
        return Ok(new { message = "Песня обновлена!"});
    }

}
