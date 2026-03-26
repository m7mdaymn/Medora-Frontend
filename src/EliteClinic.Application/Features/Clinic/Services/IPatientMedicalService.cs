using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using Microsoft.AspNetCore.Http;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IPatientMedicalService
{
    Task<ApiResponse<PatientMedicalDocumentDto>> UploadDocumentAsync(
        Guid tenantId,
        Guid patientId,
        IFormFile file,
        UploadPatientMedicalDocumentRequest request,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<List<PatientMedicalDocumentDto>>> ListDocumentsAsync(
        Guid tenantId,
        Guid patientId,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientMedicalDocumentAccessDto>> GetDocumentAccessAsync(
        Guid tenantId,
        Guid patientId,
        Guid documentId,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientChronicProfileDto>> GetChronicProfileAsync(
        Guid tenantId,
        Guid patientId,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientChronicProfileDto>> UpsertChronicProfileAsync(
        Guid tenantId,
        Guid patientId,
        UpsertPatientChronicProfileRequest request,
        Guid callerUserId,
        bool isPatientActor,
        CancellationToken cancellationToken = default);
}
