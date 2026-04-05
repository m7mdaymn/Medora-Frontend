using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class PatientMedicalService : IPatientMedicalService
{
    private const long MaxDocumentSizeBytes = 10 * 1024 * 1024;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private readonly EliteClinicDbContext _context;
    private readonly IFileStorageService _fileStorageService;

    public PatientMedicalService(EliteClinicDbContext context, IFileStorageService fileStorageService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<PatientMedicalDocumentDto>> UploadDocumentAsync(
        Guid tenantId,
        Guid patientId,
        IFormFile file,
        UploadPatientMedicalDocumentRequest request,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<PatientMedicalDocumentDto>.Error(access.Message);

        if (file == null || file.Length <= 0)
            return ApiResponse<PatientMedicalDocumentDto>.Error("File is required");

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension) || !AllowedContentTypes.Contains(file.ContentType))
            return ApiResponse<PatientMedicalDocumentDto>.Error("Unsupported file type. Allowed types: PDF, JPG/JPEG, PNG, WEBP");

        if (!_fileStorageService.IsAllowedSize(file.Length, MaxDocumentSizeBytes))
            return ApiResponse<PatientMedicalDocumentDto>.Error("File size exceeds 10 MB limit");

        var saved = await _fileStorageService.SaveFileAsync(tenantId, "patient-medical-documents", file, cancellationToken);

        var document = new PatientMedicalDocument
        {
            TenantId = tenantId,
            PatientId = patientId,
            UploadedByUserId = callerUserId,
            Category = request.Category,
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = saved.StoredFileName,
            RelativePath = saved.RelativePath,
            PublicUrl = saved.PublicUrl,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            Notes = request.Notes
        };

        _context.PatientMedicalDocuments.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<PatientMedicalDocumentDto>.Created(MapDocument(document), "Medical document uploaded successfully");
    }

    public async Task<ApiResponse<List<PatientMedicalDocumentDto>>> ListDocumentsAsync(
        Guid tenantId,
        Guid patientId,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<List<PatientMedicalDocumentDto>>.Error(access.Message);

        var docs = await _context.PatientMedicalDocuments
            .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.PatientId == patientId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<List<PatientMedicalDocumentDto>>.Ok(docs.Select(MapDocument).ToList(), $"Retrieved {docs.Count} document(s)");
    }

    public async Task<ApiResponse<PatientMedicalDocumentAccessDto>> GetDocumentAccessAsync(
        Guid tenantId,
        Guid patientId,
        Guid documentId,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<PatientMedicalDocumentAccessDto>.Error(access.Message);

        var doc = await _context.PatientMedicalDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.TenantId == tenantId && !d.IsDeleted && d.PatientId == patientId, cancellationToken);

        if (doc == null)
            return ApiResponse<PatientMedicalDocumentAccessDto>.Error("Document not found");

        return ApiResponse<PatientMedicalDocumentAccessDto>.Ok(new PatientMedicalDocumentAccessDto
        {
            Id = doc.Id,
            PatientId = doc.PatientId,
            OriginalFileName = doc.OriginalFileName,
            ContentType = doc.ContentType,
            RelativePath = doc.RelativePath
        }, "Document access granted");
    }

    public async Task<ApiResponse<PatientChronicProfileDto>> GetChronicProfileAsync(
        Guid tenantId,
        Guid patientId,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<PatientChronicProfileDto>.Error(access.Message);

        var profile = await _context.PatientChronicProfiles
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.PatientId == patientId, cancellationToken);

        if (profile == null)
        {
            return ApiResponse<PatientChronicProfileDto>.Ok(new PatientChronicProfileDto
            {
                Id = Guid.Empty,
                PatientId = patientId,
                UpdatedAt = DateTime.UtcNow
            }, "No chronic profile found");
        }

        return ApiResponse<PatientChronicProfileDto>.Ok(MapChronic(profile), "Chronic profile retrieved");
    }

    public async Task<ApiResponse<PatientChronicProfileDto>> UpsertChronicProfileAsync(
        Guid tenantId,
        Guid patientId,
        UpsertPatientChronicProfileRequest request,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<PatientChronicProfileDto>.Error(access.Message);

        if (!request.Other)
            request.OtherNotes = null;

        var profile = await _context.PatientChronicProfiles
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.PatientId == patientId, cancellationToken);

        if (profile == null)
        {
            profile = new PatientChronicProfile
            {
                TenantId = tenantId,
                PatientId = patientId,
                Diabetes = request.Diabetes,
                Hypertension = request.Hypertension,
                CardiacDisease = request.CardiacDisease,
                Asthma = request.Asthma,
                Other = request.Other,
                OtherNotes = request.OtherNotes,
                RecordedByUserId = callerUserId
            };
            _context.PatientChronicProfiles.Add(profile);
            await _context.SaveChangesAsync(cancellationToken);
            return ApiResponse<PatientChronicProfileDto>.Created(MapChronic(profile), "Chronic profile created");
        }

        profile.Diabetes = request.Diabetes;
        profile.Hypertension = request.Hypertension;
        profile.CardiacDisease = request.CardiacDisease;
        profile.Asthma = request.Asthma;
        profile.Other = request.Other;
        profile.OtherNotes = request.OtherNotes;
        profile.RecordedByUserId = callerUserId;

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<PatientChronicProfileDto>.Ok(MapChronic(profile), "Chronic profile updated");
    }

    public async Task<ApiResponse<List<PatientMedicalDocumentThreadDto>>> ListDocumentThreadsAsync(
        Guid tenantId,
        Guid patientId,
        Guid documentId,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<List<PatientMedicalDocumentThreadDto>>.Error(access.Message);

        var document = await EnsureDocumentExistsAsync(tenantId, patientId, documentId, cancellationToken);
        if (document == null)
            return ApiResponse<List<PatientMedicalDocumentThreadDto>>.Error("Medical document not found");

        var threads = await _context.PatientMedicalDocumentThreads
            .Include(t => t.Replies.Where(r => !r.IsDeleted))
            .Where(t => t.TenantId == tenantId && !t.IsDeleted && t.PatientId == patientId && t.DocumentId == documentId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<List<PatientMedicalDocumentThreadDto>>.Ok(
            threads.Select(t => MapThread(t, isPatientActor)).ToList(),
            $"Retrieved {threads.Count} thread(s)");
    }

    public async Task<ApiResponse<PatientMedicalDocumentThreadDto>> CreateDocumentThreadAsync(
        Guid tenantId,
        Guid patientId,
        Guid documentId,
        CreatePatientMedicalDocumentThreadRequest request,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error(access.Message);

        var document = await EnsureDocumentExistsAsync(tenantId, patientId, documentId, cancellationToken);
        if (document == null)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Medical document not found");

        if (string.IsNullOrWhiteSpace(request.Subject))
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Subject is required");

        var thread = new PatientMedicalDocumentThread
        {
            TenantId = tenantId,
            PatientId = patientId,
            DocumentId = documentId,
            CreatedByUserId = callerUserId,
            Subject = request.Subject.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            Status = MedicalDocumentThreadStatus.Open
        };

        _context.PatientMedicalDocumentThreads.Add(thread);

        if (!string.IsNullOrWhiteSpace(request.InitialMessage))
        {
            _context.PatientMedicalDocumentThreadReplies.Add(new PatientMedicalDocumentThreadReply
            {
                TenantId = tenantId,
                ThreadId = thread.Id,
                AuthorUserId = callerUserId,
                Message = request.InitialMessage.Trim(),
                IsInternalNote = false
            });
        }

        await AddThreadNotificationAsync(
            tenantId,
            patientId,
            document.UploadedByUserId,
            callerUserId,
            thread.Id,
            "Medical document thread updated",
            "A new discussion thread was opened on a medical document",
            cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await _context.PatientMedicalDocumentThreads
            .Include(t => t.Replies.Where(r => !r.IsDeleted))
            .FirstAsync(t => t.TenantId == tenantId && !t.IsDeleted && t.Id == thread.Id, cancellationToken);

        return ApiResponse<PatientMedicalDocumentThreadDto>.Created(MapThread(saved, isPatientActor), "Medical document thread created");
    }

    public async Task<ApiResponse<PatientMedicalDocumentThreadDto>> AddThreadReplyAsync(
        Guid tenantId,
        Guid patientId,
        Guid documentId,
        Guid threadId,
        AddPatientMedicalDocumentThreadReplyRequest request,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error(access.Message);

        var document = await EnsureDocumentExistsAsync(tenantId, patientId, documentId, cancellationToken);
        if (document == null)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Medical document not found");

        var thread = await _context.PatientMedicalDocumentThreads
            .Include(t => t.Replies.Where(r => !r.IsDeleted))
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && !t.IsDeleted && t.Id == threadId && t.PatientId == patientId && t.DocumentId == documentId, cancellationToken);

        if (thread == null)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Thread not found");

        if (thread.Status == MedicalDocumentThreadStatus.Closed)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Thread is already closed");

        if (string.IsNullOrWhiteSpace(request.Message))
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Reply message is required");

        if (isPatientActor && request.IsInternalNote)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Patients cannot submit internal notes");

        _context.PatientMedicalDocumentThreadReplies.Add(new PatientMedicalDocumentThreadReply
        {
            TenantId = tenantId,
            ThreadId = thread.Id,
            AuthorUserId = callerUserId,
            Message = request.Message.Trim(),
            IsInternalNote = request.IsInternalNote
        });

        await AddThreadNotificationAsync(
            tenantId,
            patientId,
            document.UploadedByUserId,
            callerUserId,
            thread.Id,
            "Medical document thread updated",
            "A new reply was posted on a medical document thread",
            cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        var updated = await _context.PatientMedicalDocumentThreads
            .Include(t => t.Replies.Where(r => !r.IsDeleted))
            .FirstAsync(t => t.TenantId == tenantId && !t.IsDeleted && t.Id == threadId, cancellationToken);

        return ApiResponse<PatientMedicalDocumentThreadDto>.Ok(MapThread(updated, isPatientActor), "Reply added successfully");
    }

    public async Task<ApiResponse<PatientMedicalDocumentThreadDto>> CloseThreadAsync(
        Guid tenantId,
        Guid patientId,
        Guid documentId,
        Guid threadId,
        ClosePatientMedicalDocumentThreadRequest request,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default)
    {
        var access = await EnsurePatientAccessAsync(tenantId, patientId, callerUserId, isPatientActor, cancellationToken);
        if (!access.Allowed)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error(access.Message);

        var document = await EnsureDocumentExistsAsync(tenantId, patientId, documentId, cancellationToken);
        if (document == null)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Medical document not found");

        var thread = await _context.PatientMedicalDocumentThreads
            .Include(t => t.Replies.Where(r => !r.IsDeleted))
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && !t.IsDeleted && t.Id == threadId && t.PatientId == patientId && t.DocumentId == documentId, cancellationToken);

        if (thread == null)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Thread not found");

        if (thread.Status == MedicalDocumentThreadStatus.Closed)
            return ApiResponse<PatientMedicalDocumentThreadDto>.Error("Thread is already closed");

        thread.Status = MedicalDocumentThreadStatus.Closed;
        thread.ClosedAt = DateTime.UtcNow;
        thread.ClosedByUserId = callerUserId;

        if (!string.IsNullOrWhiteSpace(request.Notes))
            thread.Notes = string.IsNullOrWhiteSpace(thread.Notes) ? request.Notes.Trim() : $"{thread.Notes} | {request.Notes.Trim()}";

        await AddThreadNotificationAsync(
            tenantId,
            patientId,
            document.UploadedByUserId,
            callerUserId,
            thread.Id,
            "Medical document thread closed",
            "A medical document thread has been closed",
            cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<PatientMedicalDocumentThreadDto>.Ok(MapThread(thread, isPatientActor), "Thread closed successfully");
    }

    private async Task<PatientMedicalDocument?> EnsureDocumentExistsAsync(Guid tenantId, Guid patientId, Guid documentId, CancellationToken cancellationToken)
    {
        return await _context.PatientMedicalDocuments
            .FirstOrDefaultAsync(d => d.TenantId == tenantId && !d.IsDeleted && d.PatientId == patientId && d.Id == documentId, cancellationToken);
    }

    private async Task AddThreadNotificationAsync(
        Guid tenantId,
        Guid patientId,
        Guid uploadedByUserId,
        Guid actorUserId,
        Guid threadId,
        string title,
        string body,
        CancellationToken cancellationToken)
    {
        var patientUserId = await _context.Patients
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == patientId)
            .Select(p => (Guid?)p.UserId)
            .FirstOrDefaultAsync(cancellationToken);

        var recipients = new HashSet<Guid>();
        if (patientUserId.HasValue)
            recipients.Add(patientUserId.Value);
        recipients.Add(uploadedByUserId);
        recipients.Remove(actorUserId);

        foreach (var userId in recipients)
        {
            _context.InAppNotifications.Add(new InAppNotification
            {
                TenantId = tenantId,
                UserId = userId,
                Type = InAppNotificationType.MedicalDocumentThreadUpdated,
                Title = title,
                Body = body,
                EntityType = nameof(PatientMedicalDocumentThread),
                EntityId = threadId
            });
        }
    }

    private async Task<(bool Allowed, string Message)> EnsurePatientAccessAsync(
        Guid tenantId,
        Guid patientId,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken)
    {
        var targetPatient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == patientId && p.TenantId == tenantId && !p.IsDeleted, cancellationToken);

        if (targetPatient == null)
            return (false, "Patient profile not found");

        if (!isPatientActor)
            return (true, string.Empty);

        var ownedProfiles = await _context.Patients
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.UserId == callerUserId)
            .Select(p => new { p.Id, p.ParentPatientId })
            .ToListAsync(cancellationToken);

        if (!ownedProfiles.Any())
            return (false, "No patient profiles linked to current user");

        var allProfiles = await _context.Patients
            .Where(p => p.TenantId == tenantId && !p.IsDeleted)
            .Select(p => new PatientHierarchyNode(p.Id, p.ParentPatientId))
            .ToListAsync(cancellationToken);

        var allowed = ExpandHierarchyIds(ownedProfiles.Select(p => p.Id).ToHashSet(), allProfiles)
            .Contains(patientId);

        return allowed
            ? (true, string.Empty)
            : (false, "Access denied to requested patient profile");
    }

    private static HashSet<Guid> ExpandHierarchyIds(HashSet<Guid> seed, List<PatientHierarchyNode> allProfiles)
    {
        var allowed = new HashSet<Guid>(seed);
        var changed = true;

        while (changed)
        {
            changed = false;
            foreach (var profile in allProfiles)
            {
                if (allowed.Contains(profile.Id) && profile.ParentPatientId is Guid parentId && allowed.Add(parentId))
                {
                    changed = true;
                }

                if (profile.ParentPatientId is Guid pId && allowed.Contains(pId) && allowed.Add(profile.Id))
                {
                    changed = true;
                }
            }
        }

        return allowed;
    }

    private readonly record struct PatientHierarchyNode(Guid Id, Guid? ParentPatientId);

    private static PatientMedicalDocumentDto MapDocument(PatientMedicalDocument document)
    {
        return new PatientMedicalDocumentDto
        {
            Id = document.Id,
            PatientId = document.PatientId,
            Category = document.Category,
            OriginalFileName = document.OriginalFileName,
            ContentType = document.ContentType,
            FileSizeBytes = document.FileSizeBytes,
            Notes = document.Notes,
            CreatedAt = document.CreatedAt
        };
    }

    private static PatientMedicalDocumentThreadDto MapThread(PatientMedicalDocumentThread thread, bool isPatientActor)
    {
        return new PatientMedicalDocumentThreadDto
        {
            Id = thread.Id,
            PatientId = thread.PatientId,
            DocumentId = thread.DocumentId,
            CreatedByUserId = thread.CreatedByUserId,
            Subject = thread.Subject,
            Status = thread.Status,
            ClosedAt = thread.ClosedAt,
            ClosedByUserId = thread.ClosedByUserId,
            Notes = thread.Notes,
            Replies = thread.Replies
                .Where(r => !r.IsDeleted && (!isPatientActor || !r.IsInternalNote))
                .OrderBy(r => r.CreatedAt)
                .Select(r => new PatientMedicalDocumentThreadReplyDto
                {
                    Id = r.Id,
                    ThreadId = r.ThreadId,
                    AuthorUserId = r.AuthorUserId,
                    Message = r.Message,
                    IsInternalNote = r.IsInternalNote,
                    CreatedAt = r.CreatedAt
                })
                .ToList(),
            CreatedAt = thread.CreatedAt
        };
    }

    private static PatientChronicProfileDto MapChronic(PatientChronicProfile profile)
    {
        return new PatientChronicProfileDto
        {
            Id = profile.Id,
            PatientId = profile.PatientId,
            Diabetes = profile.Diabetes,
            Hypertension = profile.Hypertension,
            CardiacDisease = profile.CardiacDisease,
            Asthma = profile.Asthma,
            Other = profile.Other,
            OtherNotes = profile.OtherNotes,
            RecordedByUserId = profile.RecordedByUserId,
            UpdatedAt = profile.UpdatedAt
        };
    }
}
