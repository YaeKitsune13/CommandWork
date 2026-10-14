using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;
using api.Entities;
namespace api.Data;

public partial class CoopProjectContext : DbContext
{
    public CoopProjectContext()
    {
    }

    public CoopProjectContext(DbContextOptions<CoopProjectContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Album> Albums { get; set; }

    public virtual DbSet<Artist> Artists { get; set; }

    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<Complaint> Complaints { get; set; }

    public virtual DbSet<Follow> Follows { get; set; }

    public virtual DbSet<Music> Musics { get; set; }

    public virtual DbSet<MusicGenre> MusicGenres { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<Playlist> Playlists { get; set; }

    public virtual DbSet<PlaylistCollaborator> PlaylistCollaborators { get; set; }

    public virtual DbSet<PlaylistTrack> PlaylistTracks { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserLike> UserLikes { get; set; }

    public virtual DbSet<UserListened> UserListeneds { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseMySql("server=127.0.0.1;port=3300;database=coop_project;user=root;password=1234", Microsoft.EntityFrameworkCore.ServerVersion.Parse("26.7.0-mysql"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Album>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("album");

            entity.HasIndex(e => e.ArtistId, "idx_album_artist");

            entity.HasIndex(e => e.OwnerId, "idx_album_owner");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ArtistId).HasColumnName("artist_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Image)
                .HasColumnType("text")
                .HasColumnName("image");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.OwnerId)
                .HasComment("пользователь, создавший альбом")
                .HasColumnName("owner_id");
            entity.Property(e => e.ReleaseDate).HasColumnName("release_date");

            entity.HasOne(d => d.Artist).WithMany(p => p.Albums)
                .HasForeignKey(d => d.ArtistId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_album_artist");

            entity.HasOne(d => d.Owner).WithMany(p => p.Albums)
                .HasForeignKey(d => d.OwnerId)
                .HasConstraintName("fk_album_owner");
        });

        modelBuilder.Entity<Artist>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("artist");

            entity.HasIndex(e => e.Name, "uq_artist_name").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Image)
                .HasColumnType("text")
                .HasColumnName("image");
            entity.Property(e => e.Name).HasColumnName("name");
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("comments");

            entity.HasIndex(e => e.MusicId, "idx_comments_music");

            entity.HasIndex(e => e.UserId, "idx_comments_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasComment("мягкое удаление")
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.MusicId).HasColumnName("music_id");
            entity.Property(e => e.Text)
                .HasColumnType("text")
                .HasColumnName("text");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Music).WithMany(p => p.Comments)
                .HasForeignKey(d => d.MusicId)
                .HasConstraintName("fk_comments_music");

            entity.HasOne(d => d.User).WithMany(p => p.Comments)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_comments_user");
        });

        modelBuilder.Entity<Complaint>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("complaints");

            entity.HasIndex(e => e.CommentId, "idx_complaints_comment");

            entity.HasIndex(e => e.MusicId, "idx_complaints_music");

            entity.HasIndex(e => e.ResolvedBy, "idx_complaints_resolver");

            entity.HasIndex(e => e.Status, "idx_complaints_status");

            entity.HasIndex(e => e.TargetUserId, "idx_complaints_target_user");

            entity.HasIndex(e => new { e.ReporterId, e.CommentId }, "uq_complaints_comment").IsUnique();

            entity.HasIndex(e => new { e.ReporterId, e.MusicId }, "uq_complaints_music").IsUnique();

            entity.HasIndex(e => new { e.ReporterId, e.TargetUserId }, "uq_complaints_user").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CommentId).HasColumnName("comment_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.MusicId).HasColumnName("music_id");
            entity.Property(e => e.Reason)
                .HasColumnType("text")
                .HasColumnName("reason");
            entity.Property(e => e.ReporterId).HasColumnName("reporter_id");
            entity.Property(e => e.ResolvedAt)
                .HasColumnType("datetime")
                .HasColumnName("resolved_at");
            entity.Property(e => e.ResolvedBy)
                .HasComment("модератор, рассмотревший жалобу")
                .HasColumnName("resolved_by");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'pending'")
                .HasColumnType("enum('pending','reviewed','resolved')")
                .HasColumnName("status");
            entity.Property(e => e.TargetUserId).HasColumnName("target_user_id");

            entity.HasOne(d => d.Comment).WithMany(p => p.Complaints)
                .HasForeignKey(d => d.CommentId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_complaints_comment");

            entity.HasOne(d => d.Music).WithMany(p => p.Complaints)
                .HasForeignKey(d => d.MusicId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_complaints_music");

            entity.HasOne(d => d.Reporter).WithMany(p => p.ComplaintReporters)
                .HasForeignKey(d => d.ReporterId)
                .HasConstraintName("fk_complaints_reporter");

            entity.HasOne(d => d.ResolvedByNavigation).WithMany(p => p.ComplaintResolvedByNavigations)
                .HasForeignKey(d => d.ResolvedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_complaints_resolver");

            entity.HasOne(d => d.TargetUser).WithMany(p => p.ComplaintTargetUsers)
                .HasForeignKey(d => d.TargetUserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_complaints_target_user");
        });

        modelBuilder.Entity<Follow>(entity =>
        {
            entity.HasKey(e => new { e.FollowerId, e.FollowingId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("follows");

            entity.HasIndex(e => new { e.FollowingId, e.Status }, "idx_follows_following");

            entity.Property(e => e.FollowerId).HasColumnName("follower_id");
            entity.Property(e => e.FollowingId).HasColumnName("following_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'accepted'")
                .HasColumnType("enum('pending','accepted')")
                .HasColumnName("status");

            entity.HasOne(d => d.Follower).WithMany(p => p.FollowFollowers)
                .HasForeignKey(d => d.FollowerId)
                .HasConstraintName("fk_follows_follower");

            entity.HasOne(d => d.Following).WithMany(p => p.FollowFollowings)
                .HasForeignKey(d => d.FollowingId)
                .HasConstraintName("fk_follows_following");
        });

        modelBuilder.Entity<Music>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("music");

            entity.HasIndex(e => e.AlbumId, "idx_music_album");

            entity.HasIndex(e => e.ArtistId, "idx_music_artist");

            entity.HasIndex(e => e.ModeratedBy, "idx_music_moderator");

            entity.HasIndex(e => e.OwnerId, "idx_music_owner");

            entity.HasIndex(e => e.Status, "idx_music_status");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AlbumId).HasColumnName("album_id");
            entity.Property(e => e.ArtistId).HasColumnName("artist_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasComment("мягкое удаление")
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DurationSec).HasColumnName("duration_sec");
            entity.Property(e => e.FileUrl)
                .HasColumnType("text")
                .HasColumnName("file_url");
            entity.Property(e => e.Image)
                .HasColumnType("text")
                .HasColumnName("image");
            entity.Property(e => e.ModeratedAt)
                .HasColumnType("datetime")
                .HasColumnName("moderated_at");
            entity.Property(e => e.ModeratedBy)
                .HasComment("модератор, принявший решение")
                .HasColumnName("moderated_by");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.OwnerId)
                .HasComment("пользователь, загрузивший трек")
                .HasColumnName("owner_id");
            entity.Property(e => e.RejectionReason)
                .HasColumnType("text")
                .HasColumnName("rejection_reason");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'pending'")
                .HasColumnType("enum('pending','approved','rejected')")
                .HasColumnName("status");

            entity.HasOne(d => d.Album).WithMany(p => p.Musics)
                .HasForeignKey(d => d.AlbumId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_music_album");

            entity.HasOne(d => d.Artist).WithMany(p => p.Musics)
                .HasForeignKey(d => d.ArtistId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_music_artist");

            entity.HasOne(d => d.ModeratedByNavigation).WithMany(p => p.MusicModeratedByNavigations)
                .HasForeignKey(d => d.ModeratedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_music_moderator");

            entity.HasOne(d => d.Owner).WithMany(p => p.MusicOwners)
                .HasForeignKey(d => d.OwnerId)
                .HasConstraintName("fk_music_owner");

            entity.HasMany(d => d.Genres).WithMany(p => p.Musics)
                .UsingEntity<Dictionary<string, object>>(
                    "MusicGenre1",
                    r => r.HasOne<MusicGenre>().WithMany()
                        .HasForeignKey("GenreId")
                        .HasConstraintName("fk_music_genres_genre"),
                    l => l.HasOne<Music>().WithMany()
                        .HasForeignKey("MusicId")
                        .HasConstraintName("fk_music_genres_music"),
                    j =>
                    {
                        j.HasKey("MusicId", "GenreId")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("music_genres");
                        j.HasIndex(new[] { "GenreId" }, "idx_music_genres_genre");
                        j.IndexerProperty<ulong>("MusicId").HasColumnName("music_id");
                        j.IndexerProperty<ulong>("GenreId").HasColumnName("genre_id");
                    });
        });

        modelBuilder.Entity<MusicGenre>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("music_genre");

            entity.HasIndex(e => e.Name, "uq_music_genre_name").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("password_reset_tokens");

            entity.HasIndex(e => e.UserId, "idx_password_reset_user");

            entity.HasIndex(e => e.TokenHash, "uq_password_reset_token_hash").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.ExpiresAt)
                .HasColumnType("datetime")
                .HasColumnName("expires_at");
            entity.Property(e => e.TokenHash)
                .HasMaxLength(64)
                .IsFixedLength()
                .HasComment("SHA-256 токена в hex")
                .HasColumnName("token_hash");
            entity.Property(e => e.UsedAt)
                .HasColumnType("datetime")
                .HasColumnName("used_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.PasswordResetTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_password_reset_user");
        });

        modelBuilder.Entity<Playlist>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("playlist");

            entity.HasIndex(e => e.UserId, "idx_playlist_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasComment("мягкое удаление")
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.Privacy)
                .HasDefaultValueSql("'public'")
                .HasColumnType("enum('public','private')")
                .HasColumnName("privacy");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId)
                .HasComment("владелец плейлиста")
                .HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Playlists)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_playlist_user");
        });

        modelBuilder.Entity<PlaylistCollaborator>(entity =>
        {
            entity.HasKey(e => new { e.PlaylistId, e.UserId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("playlist_collaborators");

            entity.HasIndex(e => e.UserId, "idx_playlist_collab_user");

            entity.Property(e => e.PlaylistId).HasColumnName("playlist_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Role)
                .HasDefaultValueSql("'viewer'")
                .HasColumnType("enum('editor','viewer')")
                .HasColumnName("role");

            entity.HasOne(d => d.Playlist).WithMany(p => p.PlaylistCollaborators)
                .HasForeignKey(d => d.PlaylistId)
                .HasConstraintName("fk_playlist_collab_playlist");

            entity.HasOne(d => d.User).WithMany(p => p.PlaylistCollaborators)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_playlist_collab_user");
        });

        modelBuilder.Entity<PlaylistTrack>(entity =>
        {
            entity.HasKey(e => new { e.PlaylistId, e.MusicId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("playlist_tracks");

            entity.HasIndex(e => e.AddedBy, "idx_playlist_tracks_added_by");

            entity.HasIndex(e => e.MusicId, "idx_playlist_tracks_music");

            entity.HasIndex(e => new { e.PlaylistId, e.Position }, "idx_playlist_tracks_position");

            entity.Property(e => e.PlaylistId).HasColumnName("playlist_id");
            entity.Property(e => e.MusicId).HasColumnName("music_id");
            entity.Property(e => e.AddedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("added_at");
            entity.Property(e => e.AddedBy)
                .HasComment("кто добавил трек")
                .HasColumnName("added_by");
            entity.Property(e => e.Position).HasColumnName("position");

            entity.HasOne(d => d.AddedByNavigation).WithMany(p => p.PlaylistTracks)
                .HasForeignKey(d => d.AddedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_playlist_tracks_added_by");

            entity.HasOne(d => d.Music).WithMany(p => p.PlaylistTracks)
                .HasForeignKey(d => d.MusicId)
                .HasConstraintName("fk_playlist_tracks_music");

            entity.HasOne(d => d.Playlist).WithMany(p => p.PlaylistTracks)
                .HasForeignKey(d => d.PlaylistId)
                .HasConstraintName("fk_playlist_tracks_playlist");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("user");

            entity.HasIndex(e => e.Email, "uq_user_email").IsUnique();

            entity.HasIndex(e => e.Phone, "uq_user_phone").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasComment("мягкое удаление")
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.Image)
                .HasColumnType("text")
                .HasColumnName("image");
            entity.Property(e => e.IsBlocked).HasColumnName("is_blocked");
            entity.Property(e => e.Nickname)
                .HasMaxLength(100)
                .HasColumnName("nickname");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.Phone)
                .HasMaxLength(32)
                .HasColumnName("phone");
            entity.Property(e => e.Privacy)
                .HasDefaultValueSql("'public'")
                .HasColumnType("enum('public','private')")
                .HasColumnName("privacy");
            entity.Property(e => e.Role)
                .HasDefaultValueSql("'user'")
                .HasColumnType("enum('user','moderator','admin')")
                .HasColumnName("role");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
        });

        modelBuilder.Entity<UserLike>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.MusicId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("user_likes");

            entity.HasIndex(e => e.MusicId, "idx_user_likes_music");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.MusicId).HasColumnName("music_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Type)
                .HasColumnType("enum('like','dislike')")
                .HasColumnName("type");

            entity.HasOne(d => d.Music).WithMany(p => p.UserLikes)
                .HasForeignKey(d => d.MusicId)
                .HasConstraintName("fk_user_likes_music");

            entity.HasOne(d => d.User).WithMany(p => p.UserLikes)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_user_likes_user");
        });

        modelBuilder.Entity<UserListened>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("user_listened");

            entity.HasIndex(e => e.MusicId, "idx_user_listened_music");

            entity.HasIndex(e => new { e.UserId, e.ListenedAt }, "idx_user_listened_user_time");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ListenedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("listened_at");
            entity.Property(e => e.MusicId).HasColumnName("music_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Music).WithMany(p => p.UserListeneds)
                .HasForeignKey(d => d.MusicId)
                .HasConstraintName("fk_user_listened_music");

            entity.HasOne(d => d.User).WithMany(p => p.UserListeneds)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_user_listened_user");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
