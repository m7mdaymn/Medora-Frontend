namespace EliteClinic.Domain.Enums;

public enum CreditReason
{
    DoctorAbsent = 0,
    SessionForceClosedUnserved = 1,
    SessionAutoClosedUnserved = 2,
    ClinicCancellationAfterPayment = 3,
    NoShowRetainedByPolicy = 4,
    ManualAdjustment = 5,
    CreditConsumption = 6,
    CreditExpiration = 7
}
